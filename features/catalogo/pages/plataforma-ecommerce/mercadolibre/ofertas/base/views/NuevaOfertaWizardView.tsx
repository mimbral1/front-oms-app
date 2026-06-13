// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/views/NuevaOfertaWizardView.tsx
//
// Wizard de creación de oferta. 3 steps con `Tabs`:
//   1. Info: nombre, tipo, fechas, descuento global.
//   2. SKUs: picker desde el catálogo.
//   3. Review: confirmar y crear (POST a backend).
//
// Look OMS: EcommercePageHeader + Tabs + ActionButton + SimpleModal.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CheckCircle,
    ChevronRight,
    Flag,
    Info,
    List,
} from "lucide-react";

import { ActionButton } from "@/components/ui";
import { SimpleModal } from "@/components/ui/modal";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { WizardStep1Info } from "../components/WizardStep1Info";
import {
    WizardStep2Skus,
    type SelectedSku,
} from "../components/WizardStep2Skus";
import { WizardStep3Review } from "../components/WizardStep3Review";
import { useOfertasApi, ApiError } from "../api/ofertas-api";
import { humanizeApiError } from "../helpers/error-map";
import { priceFromDiscount } from "../helpers/pricing";
import type {
    CreatableType,
    WizardStep1Draft,
} from "../components/WizardStep1Info";

type WizardStepId = "info" | "skus" | "review";

const STEPS: TabItem[] = [
    { id: "info", label: "Info", icon: Info },
    { id: "skus", label: "SKUs", icon: List },
    { id: "review", label: "Revisar", icon: CheckCircle },
];

/** Default fechas: inicio mañana, fin a 14 días. */
function defaultDates() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in14 = new Date();
    in14.setDate(in14.getDate() + 14);
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toISO(tomorrow), end: toISO(in14) };
}

export function NuevaOfertaWizardView() {
    const router = useRouter();
    const platform = useEcommercePlatform();
    const searchParams = useSearchParams();
    const api = useOfertasApi();

    // Pre-rellenado desde una invitación ML (cuando se viene de la tab "Disponibles").
    const rawInitialType = searchParams.get("type") ?? "SELLER_CAMPAIGN";
    const initialType: CreatableType = (
        ["SELLER_CAMPAIGN", "VOLUME", "SELLER_COUPON_CAMPAIGN"] as CreatableType[]
    ).includes(rawInitialType as CreatableType)
        ? (rawInitialType as CreatableType)
        : "SELLER_CAMPAIGN";
    const initialName = searchParams.get("name") ?? "";
    const dates = useMemo(defaultDates, []);

    const [step, setStep] = useState<WizardStepId>("info");
    const [info, setInfo] = useState<WizardStep1Draft>({
        name: initialName,
        type: initialType,
        start_date: dates.start,
        end_date: dates.end,
        global_discount: 15,
    });
    const [skus, setSkus] = useState<ReadonlyArray<SelectedSku>>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    /** Confirm modal humano antes de pegar a ML. NUNCA POST sin confirm. */
    const [confirmOpen, setConfirmOpen] = useState(false);
    /** Progreso del per-item opt-in (después del createCampaign). */
    const [progress, setProgress] = useState<{
        done: number;
        total: number;
        failed: number;
    } | null>(null);

    useEffect(() => {
        if (initialType && info.type !== initialType && !info.name) {
            setInfo((prev) => ({ ...prev, type: initialType, name: initialName }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialType, initialName]);

    // ── Validations ────────────────────────────────────────────────
    const canStep1 = useMemo(
        () =>
            info.name.trim().length >= 3 &&
            info.start_date &&
            info.end_date &&
            new Date(info.end_date).getTime() > new Date(info.start_date).getTime(),
        [info],
    );
    const canStep2 = skus.length > 0;
    const canSubmit = canStep1 && canStep2;

    // ── Navigation ─────────────────────────────────────────────────
    const goNext = useCallback(() => {
        if (step === "info" && canStep1) setStep("skus");
        else if (step === "skus" && canStep2) setStep("review");
    }, [canStep1, canStep2, step]);

    const goPrev = useCallback(() => {
        if (step === "review") setStep("skus");
        else if (step === "skus") setStep("info");
    }, [step]);

    const handleCancel = useCallback(() => {
        const dirty = info.name || skus.length > 0;
        if (dirty) {
            const ok = window.confirm(
                "¿Descartar los cambios y volver al listado?",
            );
            if (!ok) return;
        }
        router.push(`${platform.basePath}/ofertas`);
    }, [info.name, platform.basePath, router, skus.length]);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setSubmitError(null);

        try {
            // Step 1: crear la campaña
            const createResp = (await api.createCampaign({
                name: info.name.trim(),
                promotion_type: info.type,
                start_date: new Date(info.start_date).toISOString(),
                finish_date: new Date(info.end_date).toISOString(),
            })) as { id?: string; promotion_id?: string };

            const newPromoId = createResp?.id || createResp?.promotion_id;
            if (!newPromoId) {
                throw new ApiError(
                    "Backend no devolvió promotion_id tras crear la campaña.",
                    0,
                    null,
                );
            }

            // Step 2: per-item opt-in. NO bloquea todo si uno falla.
            setProgress({ done: 0, total: skus.length, failed: 0 });
            let done = 0;
            let failed = 0;
            await Promise.allSettled(
                skus.map(async (s) => {
                    try {
                        const discount = s.discount ?? info.global_discount;
                        const dealPrice = priceFromDiscount(s.price ?? 0, discount);
                        await api.optInItem(s.item_id ?? s.sku, {
                            promotion_id: newPromoId,
                            promotion_type: info.type,
                            deal_price: dealPrice,
                            stock: s.stock_committed ?? undefined,
                        });
                        done += 1;
                    } catch (e) {
                        failed += 1;
                        if (process.env.NODE_ENV !== "production") {
                            console.warn(
                                `[ofertas] optInItem ${s.item_id ?? s.sku} falló:`,
                                e,
                            );
                        }
                    } finally {
                        setProgress({ done, total: skus.length, failed });
                    }
                }),
            );

            if (done > 0) {
                router.push(
                    `${platform.basePath}/ofertas/${encodeURIComponent(newPromoId)}`,
                );
            } else {
                setSubmitError(
                    `Campaña creada (${newPromoId}) pero los ${skus.length} ítems no se inscribieron — agrégalos manualmente desde el detalle.`,
                );
                setSubmitting(false);
                setConfirmOpen(false);
            }
        } catch (e) {
            setSubmitError(humanizeApiError(e));
            setSubmitting(false);
            setConfirmOpen(false);
        }
    }, [api, canSubmit, info, platform.basePath, router, skus]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Campañas`}
                title={info.name || "Nueva oferta"}
                badge={{ label: "Borrador", tone: "draft" }}
                actions={
                    <>
                        <ActionButton variant="text" size="sm" onClick={handleCancel}>
                            Cancelar
                        </ActionButton>
                        {step !== "info" && (
                            <ActionButton variant="secondary" size="sm" onClick={goPrev}>
                                Anterior
                            </ActionButton>
                        )}
                        {step !== "review" ? (
                            <ActionButton
                                variant="primary"
                                size="sm"
                                onClick={goNext}
                                disabled={
                                    (step === "info" && !canStep1) ||
                                    (step === "skus" && !canStep2)
                                }
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </ActionButton>
                        ) : (
                            <ActionButton
                                variant="success"
                                size="sm"
                                onClick={() => setConfirmOpen(true)}
                                disabled={!canSubmit || submitting}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {submitting ? "Creando…" : "Lanzar campaña…"}
                            </ActionButton>
                        )}
                    </>
                }
            />

            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs
                    tabs={STEPS}
                    value={step}
                    onChange={(next) => {
                        const nextId = next as WizardStepId;
                        // Permitir saltar atrás libre, pero no adelantarse sin completar.
                        if (nextId === "info") setStep("info");
                        else if (nextId === "skus" && canStep1) setStep("skus");
                        else if (nextId === "review" && canStep1 && canStep2)
                            setStep("review");
                    }}
                />
            </div>

            <div className="flex-1 bg-gray-100">
                {step === "info" && (
                    <WizardStep1Info
                        draft={info}
                        onChange={(next) => setInfo((prev) => ({ ...prev, ...next }))}
                    />
                )}
                {step === "skus" && (
                    <WizardStep2Skus
                        selected={skus}
                        onChange={setSkus}
                        globalDiscount={info.global_discount}
                    />
                )}
                {step === "review" && (
                    <WizardStep3Review
                        info={info}
                        skus={skus}
                        submitting={submitting}
                        submitError={submitError}
                    />
                )}
            </div>

            <LaunchConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSubmit}
                submitting={submitting}
                progress={progress}
                info={info}
                skusCount={skus.length}
            />
        </div>
    );
}

// ─── Confirm modal humano (REGLA: nunca POST destructivo sin OK explícito) ────

interface LaunchConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    submitting: boolean;
    progress: { done: number; total: number; failed: number } | null;
    info: WizardStep1Draft;
    skusCount: number;
}

function LaunchConfirmModal({
    open,
    onClose,
    onConfirm,
    submitting,
    progress,
    info,
    skusCount,
}: LaunchConfirmModalProps) {
    return (
        <SimpleModal
            open={open}
            onClose={onClose}
            title={`⚠ Lanzar campaña "${info.name || "Sin nombre"}"`}
            maxWidth="sm:max-w-lg"
        >
            <div className="space-y-3 text-sm text-gray-700">
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-amber-800">
                    <p className="font-semibold mb-1">Acción destructiva en MercadoLibre real</p>
                    Se creará la campaña en ML y se inscribirán{" "}
                    <strong>{skusCount}</strong> ítem{skusCount !== 1 ? "s" : ""}{" "}
                    del catálogo. Las inscripciones a ML <strong>NO son reversibles</strong>{" "}
                    automáticamente — para sacar un ítem hay que hacer
                    <code className="ml-1 text-xs text-gray-700 bg-amber-100 px-1 py-0.5 rounded">
                        DELETE /seller-promotions/items/:itemId
                    </code>{" "}
                    manualmente.
                </div>
                <dl className="grid grid-cols-[120px_1fr] gap-y-1.5">
                    <dt className="text-gray-500">Tipo</dt>
                    <dd className="text-gray-900 font-semibold">{info.type}</dd>
                    <dt className="text-gray-500">Inicio</dt>
                    <dd className="text-gray-900">{info.start_date}</dd>
                    <dt className="text-gray-500">Fin</dt>
                    <dd className="text-gray-900">{info.end_date}</dd>
                    <dt className="text-gray-500">% off default</dt>
                    <dd className="text-gray-900 tabular-nums">
                        {info.global_discount}%
                    </dd>
                    <dt className="text-gray-500">SKUs a inscribir</dt>
                    <dd className="text-gray-900 tabular-nums">{skusCount}</dd>
                </dl>

                {progress && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
                        Inscribiendo ítems: {progress.done} / {progress.total}{" "}
                        {progress.failed > 0 && (
                            <span className="text-rose-700">
                                ({progress.failed} fallidos)
                            </span>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                    <ActionButton
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="success"
                        size="sm"
                        onClick={() => void onConfirm()}
                        disabled={submitting}
                    >
                        <Flag className="w-4 h-4" />
                        {submitting ? "Procesando…" : "Confirmar y publicar"}
                    </ActionButton>
                </div>
            </div>
        </SimpleModal>
    );
}
