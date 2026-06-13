// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/OfertaResumen.tsx
//
// Tab "RESUMEN" del detail view. Muestra KPIs principales + meta de la campaña.
//
// Look OMS: MetricCard + Card OMS + FieldRow + SectionDivider.

import { Calendar, Flag, Info, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui";
import {
    FieldRow,
    MetricCard,
    SectionDivider,
} from "../../../../_shared/ui";
import { statusOf } from "../helpers/status";
import { asDate, type Campaign } from "../types/oferta-types";
import { TypeChip } from "./TypeChip";
import { OfertaStatusBadge } from "./OfertaStatusBadge";
import { DaysLeft } from "./DaysLeft";

export interface OfertaResumenProps {
    oferta: Campaign;
}

export function OfertaResumen({ oferta }: OfertaResumenProps) {
    const skusCount = oferta.skus_count ?? oferta.skus?.length ?? 0;
    const sales = oferta.sales_so_far ?? 0;
    const avgDiscount = oferta.avg_discount ?? oferta.global_discount ?? null;
    const stockCommitted = oferta.stock_committed ?? null;
    const start = asDate(oferta.start_date);
    const end = asDate(oferta.end_date);

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            {/* KPIs */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Métricas</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    <MetricCard
                        label="SKUs en campaña"
                        value={skusCount.toLocaleString("es-CL")}
                    />
                    <MetricCard
                        label="Ventas atribuidas"
                        value={
                            sales > 0
                                ? `$${sales.toLocaleString("es-CL")}`
                                : "$0"
                        }
                    />
                    <MetricCard
                        label="Descuento prom."
                        value={
                            avgDiscount != null
                                ? `${Math.round(avgDiscount)}%`
                                : "—"
                        }
                    />
                    <MetricCard
                        label="Stock comprometido"
                        value={
                            stockCommitted != null
                                ? stockCommitted.toLocaleString("es-CL")
                                : "—"
                        }
                    />
                </div>
            </section>

            {/* Detail card */}
            <Card title="Detalle de la campaña">
                <div className="grid grid-cols-[1fr_360px] gap-8">
                    <div className="min-w-0">
                        <SectionDivider icon={<Flag className="w-4 h-4" />}>
                            Campaña
                        </SectionDivider>

                        <FieldRow label="Nombre">
                            <span className="text-gray-900">{oferta.name}</span>
                        </FieldRow>

                        <FieldRow label="Tipo">
                            {oferta.type ? (
                                <TypeChip type={oferta.type} />
                            ) : (
                                <span className="text-gray-400">—</span>
                            )}
                        </FieldRow>

                        {oferta.official_id && (
                            <FieldRow label="Official ID">
                                <code className="text-xs text-gray-700 tabular-nums">
                                    {oferta.official_id}
                                </code>
                            </FieldRow>
                        )}

                        <FieldRow label="ID interno">
                            <code className="text-xs text-gray-500 tabular-nums">
                                {oferta.id}
                            </code>
                        </FieldRow>

                        <SectionDivider
                            icon={<Calendar className="w-4 h-4" />}
                            topDivider
                        >
                            Fechas
                        </SectionDivider>
                        <FieldRow label="Inicio">
                            <span className="tabular-nums">
                                {start ? start.toLocaleString("es-CL") : "—"}
                            </span>
                        </FieldRow>
                        <FieldRow label="Fin">
                            <span className="tabular-nums">
                                {end ? end.toLocaleString("es-CL") : "—"}
                            </span>
                        </FieldRow>
                        <FieldRow label="Tiempo">
                            <DaysLeft end={oferta.end_date} />
                        </FieldRow>
                    </div>

                    <div className="border-l border-gray-200 pl-8">
                        <SectionDivider icon={<Info className="w-4 h-4" />}>
                            Estado
                        </SectionDivider>
                        <FieldRow label="Status">
                            <OfertaStatusBadge status={statusOf(oferta)} />
                        </FieldRow>

                        {typeof oferta.global_discount === "number" && (
                            <FieldRow label="Descuento global">
                                <span className="tabular-nums font-medium text-gray-900">
                                    {oferta.global_discount}%
                                </span>
                            </FieldRow>
                        )}

                        {oferta.draft && (
                            <FieldRow label="Borrador">
                                <span className="text-amber-700 text-xs">
                                    No publicada todavía
                                </span>
                            </FieldRow>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
