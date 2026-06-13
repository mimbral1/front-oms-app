// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useSkuPublicaciones.ts
//
// Caché lazy por SKU de sus publicaciones + rango creíble por publicación.
// Se llena al expandir o marcar un SKU en el Paso 2 del wizard (Ola 3·3c-bis).
// Acota llamadas: solo trae publicaciones/rangos de los SKUs con los que
// interactúas (no de todo el catálogo).

"use client";

import { useCallback, useRef, useState } from "react";
import { useOfertasApi, getItemRange } from "../api/ofertas-api";
import { rangeFromPromotions } from "../helpers/wizard-publicaciones";
import type { MlItemRange } from "../types/oferta-types";
import type { OfferPublication } from "../types/elegibilidad-types";

/** Datos cargados de un SKU (lo que `ensureLoaded` resuelve). */
export interface SkuPubData {
    publications: OfferPublication[];
    /** Rango creíble por itemId. `null` = sin rango (ML no lo expone). */
    ranges: Record<string, MlItemRange | null>;
}

export interface SkuPubState extends SkuPubData {
    loading: boolean;
    error: string | null;
}

export interface UseSkuPublicacionesReturn {
    /** Estado por SKU (undefined = nunca tocado). */
    bySku: Record<string, SkuPubState>;
    /** Carga (si hace falta) las publicaciones + rangos de un SKU. Idempotente y deduplicado. */
    ensureLoaded: (sku: string) => Promise<SkuPubData>;
}

const EMPTY: SkuPubData = { publications: [], ranges: {} };

export function useSkuPublicaciones(): UseSkuPublicacionesReturn {
    const api = useOfertasApi();
    const [bySku, setBySku] = useState<Record<string, SkuPubState>>({});
    // Promesas en vuelo por SKU para deduplicar expand + check concurrentes.
    const inFlight = useRef<Map<string, Promise<SkuPubData>>>(new Map());
    // Lectura del estado más reciente sin recrear el callback en cada render.
    const stateRef = useRef<Record<string, SkuPubState>>({});
    stateRef.current = bySku;

    const ensureLoaded = useCallback(
        (sku: string): Promise<SkuPubData> => {
            const cached = stateRef.current[sku];
            if (cached && !cached.loading && !cached.error) {
                return Promise.resolve({
                    publications: cached.publications,
                    ranges: cached.ranges,
                });
            }
            const existing = inFlight.current.get(sku);
            if (existing) return existing;

            const p = (async (): Promise<SkuPubData> => {
                setBySku((prev) => ({
                    ...prev,
                    [sku]: {
                        publications: prev[sku]?.publications ?? [],
                        ranges: prev[sku]?.ranges ?? {},
                        loading: true,
                        error: null,
                    },
                }));
                try {
                    const publications = await api.listPublicaciones(sku);
                    const ranges: Record<string, MlItemRange | null> = {};
                    await Promise.allSettled(
                        publications.map(async (pub) => {
                            const cachedRange = getItemRange(pub.itemId);
                            if (cachedRange) {
                                ranges[pub.itemId] = cachedRange;
                                return;
                            }
                            try {
                                const { results } = await api.listItemPromotions(pub.itemId);
                                ranges[pub.itemId] = rangeFromPromotions(results);
                            } catch {
                                ranges[pub.itemId] = null;
                            }
                        }),
                    );
                    setBySku((prev) => ({
                        ...prev,
                        [sku]: { publications, ranges, loading: false, error: null },
                    }));
                    return { publications, ranges };
                } catch (e) {
                    setBySku((prev) => ({
                        ...prev,
                        [sku]: {
                            publications: [],
                            ranges: {},
                            loading: false,
                            error:
                                e instanceof Error
                                    ? e.message
                                    : "No se pudieron cargar las publicaciones.",
                        },
                    }));
                    return EMPTY;
                } finally {
                    inFlight.current.delete(sku);
                }
            })();

            inFlight.current.set(sku, p);
            return p;
        },
        [api],
    );

    return { bySku, ensureLoaded };
}
