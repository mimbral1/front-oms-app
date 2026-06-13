// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/views/PublicarWizardView.tsx
//
// Wizard de publicación. 4 steps.
//
// PREVIEW REFACTOR (look OMS pleno):
//   - Header simple: eyebrow blue-700 uppercase + h1 + badge inline + acciones a la
//     derecha con `ActionButton` global.
//   - Tabs: `Tabs` (OMS) en lugar de `JanisStepsHeader`.
//   - Iconos: `lucide-react` en lugar de `JanisIcon`.
//
// Si te gusta este look, replicamos en Step2/3/4 + el resto. Si no, revertimos
// con `git checkout`.
//
// NO POST automático — "Publicar a ML" abre `PublishConfirmModal` que es donde
// el usuario clickea "Enviar" (después de revisar createdBy, modo test/real,
// etc.). El front no dispara nada por su cuenta.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Braces,
    Check,
    CheckCircle,
    Flag,
    Image as ImageIcon,
    Info,
    Save,
    Table as TableIcon,
    X,
} from "lucide-react";

import { ActionButton } from "@/components/ui/button/action-button";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useCargaMasivaApi } from "../../../carga-masiva/base/api/carga-masiva-api";
import { PayloadDrawer } from "../components/PayloadDrawer";
import { PublishConfirmModal } from "../components/PublishConfirmModal";
import { usePublicarWizard } from "../hooks/usePublicarWizard";
import { Step1SkuCategoria } from "../steps/Step1SkuCategoria";
import { Step2Obligatorios } from "../steps/Step2Obligatorios";
import { Step3Imagenes } from "../steps/Step3Imagenes";
import { Step4Revisar } from "../steps/Step4Revisar";
import type { PublicarChannel, PublicarState, PublicarStepId } from "../types/publicar-types";

// (Mayo 2026) Step3 cambió de "Recomendados" a "Imágenes". Los atributos
// recomendados se mostraban como step propio antes; ahora viven como sección
// colapsable dentro de Step2 Obligatorios (decisión UX para reducir cantidad
// de steps y hacer el wizard más lineal).
const STEPS: TabItem[] = [
    { id: "sku", label: "SKU y categoría", icon: TableIcon },
    { id: "obligatorios", label: "Obligatorios", icon: Info },
    { id: "imagenes", label: "Imágenes", icon: ImageIcon },
    { id: "revisar", label: "Revisar", icon: CheckCircle },
];

export interface PublicarWizardViewProps {
    channel: PublicarChannel;
}

export function PublicarWizardView({ channel }: PublicarWizardViewProps) {
    const router = useRouter();
    const platform = useEcommercePlatform();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const cargaMasivaApi = useCargaMasivaApi();

    const initialSku = searchParams.get("sku") ?? undefined;
    /**
     * Modo "carga-masiva": el wizard fue abierto desde una fila del lote
     * (PreviewTable). En este modo:
     *   - Header eyebrow + título cambian para indicar contexto del lote
     *   - "Guardar" hace PATCH al row del batch (en vez de localStorage draft)
     *   - "Publicar a ML" se oculta — la publicación va por el botón
     *     "Aplicar X OK" de la vista de carga-masiva, no acá
     *   - "Cancelar" vuelve a /carga-masiva en vez de /catalogo
     */
    const cargaMasivaBatchId = searchParams.get("batchId");
    const cargaMasivaRowNumber = (() => {
        const raw = searchParams.get("rowNumber");
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
    })();
    const cargaMasivaMode =
        searchParams.get("from") === "carga-masiva" &&
        !!cargaMasivaBatchId &&
        cargaMasivaRowNumber != null;

    const wizard = usePublicarWizard({ channel, initialSku });
    const [payloadOpen, setPayloadOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    /** Feedback inline cuando se clickea "Aplicar" / "Guardar" — el state ya
     *  se persiste a localStorage automático en el hook, pero el botón debe dar
     *  feedback humano. */
    const [savedToast, setSavedToast] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savingToBatch, setSavingToBatch] = useState(false);

    // ── Acciones del header ────────────────────────────────────────────────

    const handleCancel = useCallback(() => {
        // En modo carga-masiva, "Cancelar" no descarta el draft global del
        // wizard — solo vuelve a la lista del lote. El seller puede reabrir la
        // fila después y el state local (que se guarda en localStorage) sigue.
        if (cargaMasivaMode) {
            router.push(`${platform.basePath}/carga-masiva`);
            return;
        }
        const hasData =
            wizard.state.sku ||
            wizard.state.ml.title ||
            wizard.state.fala.Name;
        if (hasData) {
            const ok = window.confirm(
                "¿Descartar el borrador y volver al listado?",
            );
            if (!ok) return;
            wizard.reset();
        }
        router.push(`${platform.basePath}/catalogo`);
    }, [cargaMasivaMode, platform.basePath, router, wizard]);

    /**
     * "Guardar borrador" — comportamiento depende del modo:
     *   - normal:       toast — placeholder hasta endpoint /drafts. El state ya
     *                   se persiste solo en cada cambio (useEffect del hook).
     *   - carga-masiva: PATCH a /api/pim/imports/:batchId/rows/:rowNumber con el
     *                   subset de campos del wizard mapeados al shape de Excel.
     *                   Al éxito redirige a /carga-masiva — el lote se restaura
     *                   solo (sessionStorage del hook de carga-masiva).
     */
    const handleGuardar = useCallback(async () => {
        if (!cargaMasivaMode) {
            setSavedToast("Borrador guardado");
            setTimeout(() => setSavedToast(null), 1800);
            return;
        }
        if (!cargaMasivaBatchId || !cargaMasivaRowNumber) return;
        const updatedBy = Number(user?.id) || 0;
        if (!updatedBy) {
            setSaveError("Usuario no identificado. Vuelve a iniciar sesión.");
            return;
        }
        setSavingToBatch(true);
        setSaveError(null);
        try {
            const mapped = buildMappedPatchFromState(wizard.state);
            await cargaMasivaApi.updateRow(
                cargaMasivaBatchId,
                cargaMasivaRowNumber,
                { mapped, updatedBy },
            );
            router.push(`${platform.basePath}/carga-masiva`);
        } catch (e) {
            setSaveError(
                (e as { message?: string })?.message ??
                    "Error guardando la fila en el lote.",
            );
        } finally {
            setSavingToBatch(false);
        }
    }, [
        cargaMasivaApi,
        cargaMasivaBatchId,
        cargaMasivaMode,
        cargaMasivaRowNumber,
        platform.basePath,
        router,
        user?.id,
        wizard.state,
    ]);

    const handlePublicar = useCallback(() => {
        // Si el coverage no está completo, igual permitimos abrir el modal —
        // que muestra warnings + el user decide. El backend valida igual.
        setConfirmOpen(true);
    }, []);

    // ── Navegación entre steps via Tabs ────────────────────────────────────

    /** Lo más restrictivo: bloqueamos avanzar si el step actual no cumple. */
    const handleStepChange = useCallback(
        (id: string) => {
            const stepId = id as PublicarStepId;
            const order: PublicarStepId[] = [
                "sku",
                "obligatorios",
                "imagenes",
                "revisar",
            ];
            const targetIdx = order.indexOf(stepId);
            const curIdx = order.indexOf(wizard.step);
            // Saltar atrás siempre libre.
            if (targetIdx <= curIdx) {
                wizard.setStep(stepId);
                return;
            }
            // Para avanzar, exigir condiciones del step actual.
            if (wizard.step === "sku") {
                const cat =
                    channel === "ml"
                        ? wizard.state.category
                        : wizard.state.categoryFala;
                if (wizard.state.sku && wizard.state.sap && cat) {
                    wizard.setStep(stepId);
                }
                return;
            }
            if (wizard.step === "obligatorios") {
                if (wizard.coverage.missing.length === 0) {
                    wizard.setStep(stepId);
                }
                return;
            }
            // imagenes → revisar: permitido siempre (las imágenes no son
            // bloqueantes — el backend valida igual al publicar).
            wizard.setStep(stepId);
        },
        [channel, wizard],
    );

    // Modo carga-masiva: cargar el mapped_json guardado de la fila y mergearlo
    // sobre el state (título/precio/stock/dims del paquete + margen para la
    // calculadora). Sin esto, lo que el publicador llenó en la bandeja NO
    // aparecía en el wizard (solo cargaba SAP).
    useEffect(() => {
        if (!cargaMasivaMode || !cargaMasivaBatchId || cargaMasivaRowNumber == null) return;
        let cancelled = false;
        cargaMasivaApi
            .getRow(cargaMasivaBatchId, cargaMasivaRowNumber)
            .then((row) => {
                if (cancelled || !row?.mapped) return;
                const m = row.mapped as Record<string, unknown>;
                const pkg = (m.package ?? {}) as Record<string, unknown>;
                const numUnit = (v: unknown, unit: string) =>
                    v != null && Number.isFinite(Number(v))
                        ? { number: Number(v), unit }
                        : undefined;
                const len = numUnit(pkg.length_cm, "cm");
                const wid = numUnit(pkg.width_cm, "cm");
                const hei = numUnit(pkg.height_cm, "cm");
                const wei = numUnit(pkg.weight_g, "g");
                wizard.update((prev) => ({
                    ...prev,
                    margen: typeof m.margen === "number" ? m.margen : prev.margen,
                    ml: {
                        ...prev.ml,
                        title: m.title ? String(m.title) : prev.ml.title,
                        description: m.description ? String(m.description) : prev.ml.description,
                        price: m.price != null ? String(m.price) : prev.ml.price,
                        available_quantity:
                            m.stock != null ? String(m.stock) : prev.ml.available_quantity,
                        attrs: {
                            ...(prev.ml.attrs as Record<string, unknown>),
                            ...(len ? { seller_package_length: len } : {}),
                            ...(wid ? { seller_package_width: wid } : {}),
                            ...(hei ? { seller_package_height: hei } : {}),
                            ...(wei ? { seller_package_weight: wei } : {}),
                        },
                    },
                }));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargaMasivaMode, cargaMasivaBatchId, cargaMasivaRowNumber]);

    // ── Render ─────────────────────────────────────────────────────────────

    // Headline matchea mockup: si hay título o SKU, mostrarlos; sino
    // "Nuevo producto".
    const headlineTitle =
        (channel === "ml"
            ? wizard.state.ml.title || wizard.state.fala.Name
            : wizard.state.fala.Name || wizard.state.ml.title) ||
        (cargaMasivaMode && wizard.state.sku
            ? `Fila ${cargaMasivaRowNumber} · ${wizard.state.sku}`
            : "Nuevo producto");

    const eyebrowText = cargaMasivaMode
        ? `Carga masiva · Fila ${cargaMasivaRowNumber}`
        : "Publicar producto";

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            {/* Header + tabs sticky: quedan fijos al hacer scroll del editor */}
            <div className="sticky top-0 z-30 bg-white shadow-sm">
            {/* ── Header OMS-style (EcommercePageHeader) ────────────────── */}
            <EcommercePageHeader
                eyebrow={eyebrowText}
                title={headlineTitle}
                badge={{
                    label: cargaMasivaMode ? "Completando lote" : "Borrador",
                    tone: "draft",
                }}
                actions={
                    cargaMasivaMode ? (
                        <>
                            <ActionButton
                                variant="secondary"
                                size="sm"
                                onClick={handleCancel}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al lote
                            </ActionButton>
                            <ActionButton
                                variant="success"
                                size="sm"
                                onClick={handleGuardar}
                                disabled={savingToBatch}
                                loading={savingToBatch}
                            >
                                <Save className="w-4 h-4" />
                                {savingToBatch ? "Guardando…" : "Guardar al lote"}
                            </ActionButton>
                            {/* Publicar per-producto (wizard-directo): manda el
                                payload completo del estado → preserva todas las
                                ediciones. Abre PublishConfirmModal (no postea solo). */}
                            <ActionButton
                                variant="primary"
                                size="sm"
                                onClick={handlePublicar}
                                disabled={wizard.submitting}
                            >
                                <Flag className="w-4 h-4" />
                                {wizard.submitting
                                    ? "Publicando…"
                                    : `Publicar a ${channel === "ml" ? "ML" : "Falabella"}`}
                            </ActionButton>
                        </>
                    ) : (
                        <>
                            <ActionButton
                                variant="success"
                                size="sm"
                                onClick={handleGuardar}
                            >
                                <Save className="w-4 h-4" />
                                Guardar borrador
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                size="sm"
                                onClick={handlePublicar}
                                disabled={wizard.submitting}
                            >
                                <Flag className="w-4 h-4" />
                                {wizard.submitting
                                    ? "Publicando…"
                                    : `Publicar a ${channel === "ml" ? "ML" : "Falabella"}`}
                            </ActionButton>
                            <ActionButton
                                variant="text"
                                size="sm"
                                onClick={handleCancel}
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </ActionButton>
                        </>
                    )
                }
            />

            {/* ── Tabs OMS-style (reemplaza JanisStepsHeader) ──────────── */}
            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs
                    tabs={STEPS}
                    value={wizard.step}
                    onChange={handleStepChange}
                />
            </div>
            </div>

            {/* Toast inline para feedback de Aplicar/Guardar */}
            {savedToast && (
                <div className="mx-6 mt-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 inline-flex items-center gap-1 w-fit">
                    <Check className="w-3.5 h-3.5" />
                    {savedToast}
                </div>
            )}

            {wizard.error && (
                <div className="mx-6 mt-3 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                    <strong>Error:</strong> {wizard.error}
                </div>
            )}

            {saveError && (
                <div className="mx-6 mt-3 rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                    <strong>Error al guardar al lote:</strong> {saveError}
                </div>
            )}

            {/* Quick access: Ver payload, oculto en el header para no saturar.
                El payload drawer sigue accesible desde Step 4 (botón "Ver JSON"). */}
            <div className="bg-white border-b border-gray-200 px-6 py-1.5 flex items-center justify-end gap-2">
                {wizard.state.sku && (
                    <code className="text-xs text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                        SKU {wizard.state.sku}
                    </code>
                )}
                <button
                    type="button"
                    onClick={() => setPayloadOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-700 font-mono"
                >
                    <Braces className="w-3.5 h-3.5" />
                    Ver payload
                </button>
            </div>

            <div className="flex-1 bg-gray-100">
                {wizard.step === "sku" && (
                    <Step1SkuCategoria
                        wizard={wizard}
                        onJumpToStep={wizard.setStep}
                        skuReadOnly={cargaMasivaMode}
                    />
                )}
                {wizard.step === "obligatorios" && (
                    <Step2Obligatorios wizard={wizard} onJumpToStep={wizard.setStep} />
                )}
                {wizard.step === "imagenes" && (
                    <Step3Imagenes wizard={wizard} onJumpToStep={wizard.setStep} />
                )}
                {wizard.step === "revisar" && (
                    <Step4Revisar wizard={wizard} onJumpToStep={wizard.setStep} />
                )}
            </div>

            <PayloadDrawer
                open={payloadOpen}
                onClose={() => setPayloadOpen(false)}
                payload={wizard.payload}
                channel={channel}
            />

            <PublishConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                state={wizard.state}
                coverage={wizard.coverage}
                channel={channel}
                payload={wizard.payload}
                onSubmitted={() => {
                    /* el modal queda abierto mostrando resultado */
                }}
            />
        </div>
    );
}

/**
 * Mapea el estado del wizard al shape `mapped` que espera el endpoint
 * PATCH /api/pim/imports/:batchId/rows/:rowNumber. Las keys deben matchear
 * `excelParser.mapRow` (title, brand, model, category, price, stock,
 * description, images), no el shape de payload ML/Fala — el backend re-corre
 * `validateMappedRow` con este `mapped` para recalcular `validation_status`.
 *
 * No incluye campos vacíos: el PATCH hace merge parcial y un string vacío
 * pisaría un valor previo legítimo.
 */
function buildMappedPatchFromState(state: PublicarState): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    const title = state.ml.title?.trim();
    if (title) out.title = title;

    const description = state.ml.description?.trim();
    if (description) out.description = description;

    // Marca: priorizar atributo ML BRAND si vino seteado, sino SAP marca.
    const brandAttr = state.ml.attrs?.BRAND;
    const brand =
        (typeof brandAttr === "string" && brandAttr.trim()) ||
        state.sap?.marca?.trim();
    if (brand) out.brand = brand;

    const modelAttr = state.ml.attrs?.MODEL;
    if (typeof modelAttr === "string" && modelAttr.trim()) {
        out.model = modelAttr.trim();
    }

    // Categoría: el backend acepta tanto el ID (MLC...) como el nombre. El
    // ID es más confiable porque la cascada P0-P5 puede sugerir por nombre
    // pero el match exacto es por id.
    if (state.category?.id) {
        out.category = String(state.category.id);
    }

    const priceStr = String(state.ml.price ?? "").trim();
    if (priceStr) {
        const n = Number(priceStr);
        if (Number.isFinite(n)) out.price = n;
    }

    const stockStr = String(state.ml.available_quantity ?? "").trim();
    if (stockStr) {
        const n = Number(stockStr);
        if (Number.isFinite(n)) out.stock = n;
    }

    const urls = state.images
        .map((img) => img.secureUrl)
        .filter((u): u is string => typeof u === "string" && u.length > 0);
    if (urls.length > 0) out.images = urls;

    return out;
}
