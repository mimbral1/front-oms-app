// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/hooks/usePublicarWizard.ts
//
// PORT VERBATIM (adaptado) del legacy `pim-service/Plataforma_Marketplace/src/
// features/publicar/PublicarApp.tsx`. Adaptaciones para OMS:
//   - `useState + useEffect` directos → hook reutilizable (la View consume).
//   - `localStorage` solo dentro de `useEffect` post-mount (SSR safe).
//   - Estructura de retorno: state + actions tipadas + memoized payload/coverage.
//
// El SHAPE del state es IDÉNTICO al legacy. `buildMlPayload`/`buildFalaPayload`
// dependen de eso. Cualquier slot que falte → ML/Fala rechazan 400.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { usePublicarApi } from "../api/publicar-api";
import { computeCoverage } from "../helpers/coverage";
import {
    buildFalaPayload,
    buildMlPayload,
} from "../helpers/payload-builders";
import { buildPreviewData, type PreviewData } from "../helpers/preview";
import type {
    CoverageSummary,
    FalaChannelData,
    MLChannelData,
    MarketplaceCategory,
    PublicarChannel,
    PublicarResult,
    PublicarState,
    PublicarStepId,
} from "../types/publicar-types";

const STORAGE_KEY = "publicar.state.v2";

/**
 * Estado inicial — IDÉNTICO al legacy `initialState()` con slots ml/fala
 * canonical pre-rellenados con defaults.
 */
function initialState(channel: PublicarChannel): PublicarState {
    return {
        step: "sku",
        channel,
        sku: "",
        sap: null,
        category: null,
        categoryFala: null,
        images: [],
        mlAvailableAttrs: [],
        falaRequiredAttrs: [],
        falaOptionalAttrs: [],
        falaScoreRules: [],
        falaScoreActual: null,
        falaBasicMeta: {},
        ml: {
            title: "",
            description: "",
            price: "",
            available_quantity: "",
            condition: "new",
            listing_type_id: "gold_special",
            status: "paused",
            currency_id: "CLP",
            buying_mode: "buy_it_now",
            warranty: "",
            family_name: "",
            domain_id: "",
            official_store_id: null,
            attrs: {},
        },
        fala: {
            SellerSku: "",
            PrimaryCategory: "",
            Name: "",
            Brand: "",
            Description: "",
            Price: "",
            Quantity: "",
            Status: "active",
            attrs: {},
        },
        fichaOrigen: null,
    };
}

export interface UsePublicarWizardOptions {
    channel: PublicarChannel;
    /** SKU pre-rellenado si el usuario viene del catálogo. */
    initialSku?: string;
}

/** Updater function pattern (legacy `update(prev => ...)`). */
export type StateUpdater =
    | Partial<PublicarState>
    | ((prev: PublicarState) => PublicarState);

export interface UsePublicarWizardReturn {
    state: PublicarState;
    step: PublicarStepId;
    coverage: CoverageSummary;
    score: number;
    /** Payload listo para enviar a `/publicar` (recomputado por canal). */
    payload: Record<string, unknown>;
    /** Preview data del producto para `ProductPreview`. */
    previewData: PreviewData;

    loading: boolean;
    submitting: boolean;
    error: string | null;
    publishError: PublicarResult | null;

    // Actions:
    setStep: (s: PublicarStepId) => void;
    goNext: () => void;
    goPrev: () => void;
    /** Update functional o partial. `update(prev => ({...prev, ml: {...}}))`. */
    update: (next: StateUpdater) => void;
    /** Helper: actualiza un campo del slot ml/fala (`state.ml.title`, etc.). */
    updateField: <C extends PublicarChannel>(
        channel: C,
        key: keyof (C extends "ml" ? MLChannelData : FalaChannelData),
        value: unknown,
    ) => void;
    /** Helper: actualiza un atributo dinámico (`state.ml.attrs[id]`). */
    updateAttr: (channel: PublicarChannel, key: string, value: unknown) => void;
    /** Carga SAP + categoría + attrs desde `/vista-previa`. */
    lookupSku: (sku: string) => Promise<void>;
    /** Cambio manual de categoría ML — refetch attrs de la nueva categoría. */
    handleSelectMlCategory: (category: MarketplaceCategory) => Promise<void>;
    /** Cambio manual de categoría Falabella — refetch preview con
     *  `?categoria_id=` para refrescar attrs/score/meta. */
    handleSelectFalaCategory: (category: MarketplaceCategory) => Promise<void>;
    /** Discard state. */
    reset: () => void;

    // Datos exportados para componentes:
    /** Si vendor pasa por aquí desde otra Vista, el `user.id` usado en payloads. */
    userId: string | undefined;
}

const STEP_ORDER: PublicarStepId[] = ["sku", "obligatorios", "imagenes", "revisar"];

export function usePublicarWizard({
    channel,
    initialSku,
}: UsePublicarWizardOptions): UsePublicarWizardReturn {
    const api = usePublicarApi();
    const { user } = useAuth();
    const [state, setState] = useState<PublicarState>(() => ({
        ...initialState(channel),
        sku: initialSku ?? "",
    }));
    const [loading, setLoading] = useState(false);
    const [submitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [publishError] = useState<PublicarResult | null>(null);
    const hydratedRef = useRef(false);
    const officialStoreIdRef = useRef<number | null>(null);

    // Hydrate from localStorage on mount (client only)
    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as PublicarState;
            // Solo restauramos si el canal coincide y hay SKU activo. Mergeamos
            // contra el initialState para que campos nuevos del shape no queden
            // undefined si el localStorage tiene un dump viejo.
            if (parsed?.channel === channel && parsed.sku) {
                const base = initialState(channel);
                setState({
                    ...base,
                    ...parsed,
                    ml: { ...base.ml, ...(parsed.ml || {}) },
                    fala: { ...base.fala, ...(parsed.fala || {}) },
                    images: Array.isArray(parsed.images) ? parsed.images : [],
                    mlAvailableAttrs: Array.isArray(parsed.mlAvailableAttrs)
                        ? parsed.mlAvailableAttrs
                        : [],
                    falaRequiredAttrs: Array.isArray(parsed.falaRequiredAttrs)
                        ? parsed.falaRequiredAttrs
                        : [],
                    falaOptionalAttrs: Array.isArray(parsed.falaOptionalAttrs)
                        ? parsed.falaOptionalAttrs
                        : [],
                    falaScoreRules: Array.isArray(parsed.falaScoreRules)
                        ? parsed.falaScoreRules
                        : [],
                    falaBasicMeta: parsed.falaBasicMeta || {},
                });
            }
        } catch {
            /* ignore */
        }
    }, [channel]);

    // Persist on every change (debounced)
    useEffect(() => {
        if (!hydratedRef.current) return;
        const t = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch {
                /* full disk? ignore */
            }
        }, 300);
        return () => clearTimeout(t);
    }, [state]);

    // Cargar `default_official_store_id` al mount (solo ML).
    useEffect(() => {
        if (channel !== "ml") return;
        let cancelled = false;
        api.fetchOfficialStoreId()
            .then((id) => {
                if (cancelled || id == null) return;
                officialStoreIdRef.current = id;
                setState((prev) => ({
                    ...prev,
                    ml: {
                        ...prev.ml,
                        official_store_id: prev.ml?.official_store_id ?? id,
                    },
                }));
            })
            .catch(() => {
                /* graceful — sin tienda oficial el publish falla y el seller
                 * verá el error explícito desde el modal. */
            });
        return () => {
            cancelled = true;
        };
    }, [api, channel]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const setStep = useCallback((s: PublicarStepId) => {
        setState((prev) => ({ ...prev, step: s }));
    }, []);

    const goNext = useCallback(() => {
        setState((prev) => {
            const idx = STEP_ORDER.indexOf(prev.step);
            if (idx < 0 || idx === STEP_ORDER.length - 1) return prev;
            return { ...prev, step: STEP_ORDER[idx + 1]! };
        });
    }, []);

    const goPrev = useCallback(() => {
        setState((prev) => {
            const idx = STEP_ORDER.indexOf(prev.step);
            if (idx <= 0) return prev;
            return { ...prev, step: STEP_ORDER[idx - 1]! };
        });
    }, []);

    const update = useCallback((next: StateUpdater) => {
        setState((prev) =>
            typeof next === "function" ? next(prev) : { ...prev, ...next },
        );
    }, []);

    const updateField: UsePublicarWizardReturn["updateField"] = useCallback(
        (ch, key, value) => {
            setState((prev) => ({
                ...prev,
                [ch]: {
                    ...prev[ch],
                    [key]: value,
                },
            }));
        },
        [],
    );

    const updateAttr: UsePublicarWizardReturn["updateAttr"] = useCallback(
        (ch, key, value) => {
            setState((prev) => ({
                ...prev,
                [ch]: {
                    ...prev[ch],
                    attrs: {
                        ...((prev[ch]?.attrs as Record<string, unknown>) || {}),
                        [key]: value,
                    },
                },
            }));
        },
        [],
    );

    const lookupSku = useCallback(
        async (rawSku: string) => {
            const sku = String(rawSku || "").trim();
            if (!sku) {
                setError("Ingresa un SKU");
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const next = await api.lookupSkuState(
                    channel,
                    sku,
                    officialStoreIdRef.current,
                );
                setState((prev) => ({
                    ...prev,
                    ...next,
                    // Reset images (nuevo lookup = nuevo SKU = nuevas imágenes).
                    images: [],
                    // Mergear slots ml/fala contra los defaults del state para
                    // garantizar que ningún campo quede undefined.
                    ml: { ...prev.ml, ...next.ml },
                    fala: { ...prev.fala, ...next.fala },
                    // NO avanzar al Step 2 automático — el seller revisa los
                    // datos pre-rellenados (nombre/marca/categoría sugerida/
                    // precio/stock) y avanza manual desde la tab.
                }));

                // Ficha maestra: precarga best-effort. Rellena SOLO los slots vacíos del
                // canal activo (no pisa lo que SAP/lookup ya trajo). Si no hay ficha, no-op.
                try {
                    const ficha = await api.fetchFichaProducto(sku, channel);
                    if (ficha) {
                        setState((prev) => {
                            if (channel === "ml") {
                                return {
                                    ...prev,
                                    fichaOrigen: ficha.origen_canal ?? null,
                                    ml: {
                                        ...prev.ml,
                                        title: prev.ml.title || ficha.nombre || "",
                                        description: prev.ml.description || ficha.descripcion || "",
                                    },
                                    images:
                                        prev.images.length > 0
                                            ? prev.images
                                            : ficha.imagenes.map((im) => ({ secureUrl: im.url })),
                                };
                            }
                            return {
                                ...prev,
                                fichaOrigen: ficha.origen_canal ?? null,
                                fala: {
                                    ...prev.fala,
                                    Name: prev.fala.Name || ficha.nombre || "",
                                    Description: prev.fala.Description || ficha.descripcion || "",
                                    Brand: prev.fala.Brand || ficha.marca || "",
                                },
                                images:
                                    prev.images.length > 0
                                        ? prev.images
                                        : ficha.imagenes.map((im) => ({ secureUrl: im.url })),
                            };
                        });
                    }
                } catch {
                    /* precarga best-effort: nunca rompe el lookup */
                }
            } catch (e) {
                setError((e as Error)?.message ?? "Error consultando SAP");
            } finally {
                setLoading(false);
            }
        },
        [api, channel],
    );

    const handleSelectMlCategory: UsePublicarWizardReturn["handleSelectMlCategory"] = useCallback(
        async (category) => {
            if (!category?.id) return;
            setLoading(true);
            setError(null);
            try {
                const attrs = await api.fetchMlCategoryAttributes(category.id);
                setState((prev) => ({
                    ...prev,
                    category,
                    mlAvailableAttrs: [...attrs],
                    ml: {
                        ...prev.ml,
                        attrs: {},
                    },
                }));
            } catch (e) {
                setError((e as Error)?.message ?? "Error cargando atributos ML");
            } finally {
                setLoading(false);
            }
        },
        [api],
    );

    const handleSelectFalaCategory: UsePublicarWizardReturn["handleSelectFalaCategory"] = useCallback(
        async (category) => {
            if (!category?.id) return;
            setLoading(true);
            setError(null);
            // Optimista: aplicar categoría + PrimaryCategory inmediato.
            setState((prev) => ({
                ...prev,
                categoryFala: category,
                fala: {
                    ...prev.fala,
                    PrimaryCategory: String(category.id),
                },
            }));
            try {
                if (!state.sku) return;
                const fresh = await api.fetchFalaPreviewForCategory(
                    state.sku,
                    category.id,
                );
                setState((prev) => ({
                    ...prev,
                    falaRequiredAttrs: fresh.falaRequiredAttrs,
                    falaOptionalAttrs: fresh.falaOptionalAttrs,
                    falaScoreRules: fresh.falaScoreRules,
                    falaScoreActual: fresh.falaScoreActual,
                    falaBasicMeta: fresh.falaBasicMeta,
                    // Reset attrs Fala — los attrs auto-resueltos para la
                    // categoría anterior no aplican a la nueva.
                    fala: {
                        ...prev.fala,
                        attrs: {},
                    },
                }));
            } catch (e) {
                setError(
                    `No se pudo refrescar atributos para la nueva categoría: ${(e as Error)?.message || e}`,
                );
            } finally {
                setLoading(false);
            }
        },
        [api, state.sku],
    );

    const reset = useCallback(() => {
        setState(initialState(channel));
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            /* empty */
        }
    }, [channel]);

    // ─── Derived (memoized) ───────────────────────────────────────────────────

    const coverage = useMemo(
        () => computeCoverage(state, state.channel),
        [state],
    );

    const payload = useMemo(
        () => (state.channel === "ml" ? buildMlPayload(state) : buildFalaPayload(state)),
        [state],
    );

    const previewData = useMemo(
        () => buildPreviewData(state, state.channel),
        [state],
    );

    return {
        state,
        step: state.step,
        coverage,
        score: coverage.pct,
        payload,
        previewData,
        loading,
        submitting,
        error,
        publishError,
        setStep,
        goNext,
        goPrev,
        update,
        updateField,
        updateAttr,
        lookupSku,
        handleSelectMlCategory,
        handleSelectFalaCategory,
        reset,
        userId: user?.id,
    };
}
