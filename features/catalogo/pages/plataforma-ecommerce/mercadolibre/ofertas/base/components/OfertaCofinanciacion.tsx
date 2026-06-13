// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/OfertaCofinanciacion.tsx
//
// Tab "COFINANCIACIÓN" del detail view. Muestra el split ML% / Seller%
// (campañas SMART, MARKETPLACE_CAMPAIGN, PRICE_MATCHING), o avisa que no aplica
// para tipos no co-financiados.
//
// Fuente de datos: `useOfertaItems().cofinanciacion` — agregado computado desde
// `RawPromotionItem.meli_percentage` + `RawPromotionItem.seller_percentage` (PER-ITEM
// en ML). El field a nivel de campaña NO existe en el shape de
// `buildCampaignFromEnrollment` — antes leíamos `oferta.meli_percentage` que era
// SIEMPRE undefined → la tab quedaba "El backend todavía no expone..." forever.
//
// Look OMS: Card con title + FieldRow + SectionDivider.

import { AlertTriangle, DollarSign, Info, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui";
import { FieldRow, SectionDivider } from "../../../../_shared/ui";
import type { Campaign } from "../types/oferta-types";
import type { CofinanciacionAggregate } from "../hooks/useOfertaItems";

export interface OfertaCofinanciacionProps {
    oferta: Campaign;
    /**
     * Agregado computado por `useOfertaItems`. `null` si:
     *   - items todavía cargando, O
     *   - la campaña no devuelve `meli_percentage` en ningún item (tipo no co-financiado)
     */
    cofinanciacion: CofinanciacionAggregate | null;
    /** True mientras el hook fetcha los items. Muestra skeleton. */
    loading?: boolean;
    /** Error fatal del fetch de items. */
    error?: string | null;
}

const COFINANCIADA_TYPES = ["SMART", "MARKETPLACE_CAMPAIGN", "PRICE_MATCHING"] as const;

export function OfertaCofinanciacion({
    oferta,
    cofinanciacion,
    loading,
    error,
}: OfertaCofinanciacionProps) {
    const isCofinanciada =
        oferta.type && (COFINANCIADA_TYPES as readonly string[]).includes(oferta.type);

    // Caso 1: tipo de campaña que NO co-financia → mensaje claro
    if (!isCofinanciada) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card title="Sin cofinanciación">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-gray-600">
                            Este tipo de campaña ({oferta.type ?? "desconocido"}) se
                            descuenta 100% del seller. Solo las promociones{" "}
                            <code className="rounded bg-gray-100 px-1 text-xs">
                                SMART
                            </code>
                            ,{" "}
                            <code className="rounded bg-gray-100 px-1 text-xs">
                                MARKETPLACE_CAMPAIGN
                            </code>{" "}
                            y{" "}
                            <code className="rounded bg-gray-100 px-1 text-xs">
                                PRICE_MATCHING
                            </code>{" "}
                            tienen aporte de ML.
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Caso 2: loading inicial — esperando que `useOfertaItems` traiga los items
    if (loading && !cofinanciacion) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card title="Split del descuento">
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Cargando cofinanciación desde los items…
                    </div>
                </Card>
            </div>
        );
    }

    // Caso 3: error fatal
    if (error && !cofinanciacion) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card title="Split del descuento">
                    <div className="flex items-start gap-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>
                            Error cargando items para cofinanciación: {error}
                        </span>
                    </div>
                </Card>
            </div>
        );
    }

    // Caso 4: tipo co-financiado pero ningún item devolvió los percentages.
    // Esto pasa cuando la campaña aún no tiene items inscritos, o cuando ML
    // no los devuelve (raro, pero posible si la inscripción es muy reciente).
    if (!cofinanciacion) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card title="Split del descuento">
                    <SectionDivider icon={<DollarSign className="w-4 h-4" />}>
                        Aportes ML / Seller
                    </SectionDivider>
                    <div className="text-gray-500 text-sm">
                        Esta campaña es del tipo{" "}
                        <code className="rounded bg-gray-100 px-1 text-xs">
                            {oferta.type}
                        </code>{" "}
                        que normalmente tiene aporte de ML, pero los items inscritos
                        no devuelven datos de cofinanciación. Puede que la campaña
                        recién esté inscrita o que ML aún no haya calculado el split.
                    </div>
                </Card>
            </div>
        );
    }

    const { meliPercentage, sellerPercentage, uniform, count, meliMin, meliMax, sellerMin, sellerMax } =
        cofinanciacion;

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <Card title="Split del descuento">
                <SectionDivider icon={<DollarSign className="w-4 h-4" />}>
                    Aportes ML / Seller{uniform ? "" : " (promedio)"}
                </SectionDivider>

                <SplitBar
                    meliPct={meliPercentage}
                    sellerPct={sellerPercentage}
                />

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                        <div className="text-xs uppercase tracking-wider font-semibold text-cyan-700">
                            ML aporta
                        </div>
                        <div className="text-2xl font-semibold tabular-nums text-cyan-700 mt-1">
                            {uniform
                                ? `${meliPercentage}%`
                                : `${meliMin}–${meliMax}%`}
                        </div>
                        <div className="text-xs text-cyan-600 mt-1">
                            del descuento sobre el precio original.
                        </div>
                    </div>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                        <div className="text-xs uppercase tracking-wider font-semibold text-violet-700">
                            Seller aporta
                        </div>
                        <div className="text-2xl font-semibold tabular-nums text-violet-700 mt-1">
                            {uniform
                                ? `${sellerPercentage}%`
                                : `${sellerMin}–${sellerMax}%`}
                        </div>
                        <div className="text-xs text-violet-600 mt-1">
                            del descuento sobre el precio original.
                        </div>
                    </div>
                </div>

                {!uniform && (
                    <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                            El split varía entre los {count.toLocaleString("es-CL")} ítems
                            inscritos (ML lo calcula por SKU según historial). Los valores
                            grandes son el promedio.
                        </span>
                    </div>
                )}

                <div className="text-xs text-gray-400 mt-3">
                    Calculado desde {count.toLocaleString("es-CL")} ítem{count === 1 ? "" : "s"} con datos de cofinanciación.
                </div>
            </Card>

            <Card title="Cómo se calcula">
                <FieldRow label="Descuento total">
                    <span className="text-sm text-gray-600">
                        El descuento que ve el comprador =&nbsp;ML% + Seller%. Si una
                        promoción <strong>SMART</strong> ofrece 30% off y ML aporta
                        15%, el seller cubre 15% del precio original.
                    </span>
                </FieldRow>
                <FieldRow label="Atribución">
                    <span className="text-sm text-gray-600">
                        Las ventas atribuidas en{" "}
                        <strong>RESUMEN → Ventas atribuidas</strong> son el total
                        bruto. El seller solo recibe el costo proporcional a su
                        porcentaje.
                    </span>
                </FieldRow>
                <FieldRow label="Granularidad">
                    <span className="text-sm text-gray-600">
                        ML expone el split <strong>por ítem</strong>, no por campaña.
                        Si varía entre SKUs, los porcentajes se muestran como rango
                        (min–max).
                    </span>
                </FieldRow>
            </Card>
        </div>
    );
}

function SplitBar({
    meliPct,
    sellerPct,
}: {
    meliPct: number;
    sellerPct: number;
}) {
    const total = Math.max(1, meliPct + sellerPct);
    const meliWidth = (meliPct / total) * 100;
    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                    ML {meliPct}%
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                    Seller {sellerPct}%
                </span>
            </div>
            <div className="h-3 rounded-full bg-violet-200 overflow-hidden ring-1 ring-violet-300 flex">
                <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${meliWidth}%` }}
                    aria-label={`ML ${meliPct}%`}
                />
                <div
                    className="h-full bg-violet-500 flex-1"
                    aria-label={`Seller ${sellerPct}%`}
                />
            </div>
        </div>
    );
}
