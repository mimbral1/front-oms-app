// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/OfertaCalendario.tsx
//
// Tab "CALENDARIO" del detail view. Muestra timeline visual de la campaña:
// fecha de inicio, fin, y "hoy". Útil para entender en qué fase del lifecycle
// está la oferta.
//
// Look OMS: Card con title + FieldRow.

import { Calendar, Info } from "lucide-react";
import { Card } from "@/components/ui";
import { FieldRow, SectionDivider } from "../../../../_shared/ui";
import { asDate, type Campaign } from "../types/oferta-types";

export interface OfertaCalendarioProps {
    oferta: Campaign;
}

export function OfertaCalendario({ oferta }: OfertaCalendarioProps) {
    const start = asDate(oferta.start_date);
    const end = asDate(oferta.end_date);
    const now = new Date();

    if (!start || !end) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card title="Calendario">
                    <div className="text-gray-500 text-sm">
                        Esta campaña aún no tiene fechas definidas.
                    </div>
                </Card>
            </div>
        );
    }

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = Math.max(0, Math.min(totalMs, now.getTime() - start.getTime()));
    const pct = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, totalDays - daysElapsed);

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <Card title="Timeline de la campaña">
                <SectionDivider icon={<Calendar className="w-4 h-4" />}>
                    Progreso
                </SectionDivider>

                {/* Bar */}
                <div className="mt-2">
                    <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs tabular-nums text-gray-500">
                            {start.toLocaleDateString("es-CL", {
                                day: "numeric",
                                month: "short",
                            })}
                        </span>
                        <span className="text-xs tabular-nums text-gray-500">
                            {end.toLocaleDateString("es-CL", {
                                day: "numeric",
                                month: "short",
                            })}
                        </span>
                    </div>
                    <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
                        <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${pct}%` }}
                        />
                        {/* Marker "ahora" */}
                        {now.getTime() >= start.getTime() &&
                            now.getTime() <= end.getTime() && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
                                    style={{ left: `${pct}%` }}
                                    aria-label="Ahora"
                                >
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-rose-600 font-semibold uppercase tracking-wider whitespace-nowrap">
                                        Ahora
                                    </div>
                                </div>
                            )}
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    <Stat
                        label="Duración total"
                        value={`${totalDays} ${totalDays === 1 ? "día" : "días"}`}
                    />
                    <Stat
                        label="Transcurridos"
                        value={`${daysElapsed} ${daysElapsed === 1 ? "día" : "días"}`}
                        accent={
                            daysElapsed === 0
                                ? "text-blue-600"
                                : "text-emerald-600"
                        }
                    />
                    <Stat
                        label="Restantes"
                        value={`${daysLeft} ${daysLeft === 1 ? "día" : "días"}`}
                        accent={daysLeft <= 3 ? "text-rose-600" : "text-gray-900"}
                    />
                </div>
            </Card>

            <Card title="Hitos clave">
                <SectionDivider icon={<Info className="w-4 h-4" />}>
                    Eventos
                </SectionDivider>
                <FieldRow label="Lanzamiento">
                    <span className="tabular-nums text-gray-900">
                        {start.toLocaleString("es-CL")}
                    </span>
                </FieldRow>
                {oferta.type === "DOD" && oferta.global_discount != null && (
                    <FieldRow label="Pico horario (DOD)">
                        <span className="text-sm text-amber-700">
                            Stock obligatorio durante toda la oferta del día.
                        </span>
                    </FieldRow>
                )}
                <FieldRow label="Cierre">
                    <span className="tabular-nums text-gray-900">
                        {end.toLocaleString("es-CL")}
                    </span>
                </FieldRow>
            </Card>
        </div>
    );
}

function Stat({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: string;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                {label}
            </div>
            <div
                className={[
                    "text-lg font-semibold tabular-nums mt-1",
                    accent ?? "text-gray-900",
                ].join(" ")}
            >
                {value}
            </div>
        </div>
    );
}
