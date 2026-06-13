// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/CampaignTable.tsx
//
// Tabla principal de campañas (Activas y Finalizadas). Para la tab "Disponibles"
// se usa `AvailableInvitationsList`.
//
// Look OMS: white container con sombra suave + table bordered.

"use client";

import { statusOf } from "../helpers/status";
import type { Campaign } from "../types/oferta-types";
import { TypeChip } from "./TypeChip";
import { OfertaStatusBadge } from "./OfertaStatusBadge";
import { DaysLeft } from "./DaysLeft";

export interface CampaignTableProps {
    rows: ReadonlyArray<Campaign>;
    loading: boolean;
    error: string | null;
    onRowClick?: (row: Campaign) => void;
}

const HEADER = [
    "text-xs uppercase tracking-wider text-gray-500 font-semibold",
    "py-3 px-3 bg-gray-50 border-b border-gray-200 text-left",
].join(" ");

const CELL = "py-2.5 px-3 border-b border-gray-100 align-middle";

export function CampaignTable({
    rows,
    loading,
    error,
    onRowClick,
}: CampaignTableProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className={HEADER}>Campaña</th>
                            <th className={HEADER + " w-32"}>Tipo</th>
                            <th className={HEADER + " w-28"}>Estado</th>
                            <th className={HEADER + " text-right w-24"}>SKUs</th>
                            <th className={HEADER + " w-36"}>Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <StateRow colSpan={5} kind="loading">
                                Cargando campañas…
                            </StateRow>
                        )}
                        {!loading && error && (
                            <StateRow colSpan={5} kind="error">
                                Error: {error}
                            </StateRow>
                        )}
                        {!loading && !error && rows.length === 0 && (
                            <StateRow colSpan={5} kind="empty">
                                Sin campañas en esta sección
                            </StateRow>
                        )}
                        {!loading &&
                            !error &&
                            rows.map((row) => {
                                const status = statusOf(row);
                                const skusCount = row.skus_count ?? row.skus?.length ?? 0;
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => onRowClick?.(row)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className={CELL}>
                                            <div className="font-medium text-gray-900 truncate max-w-[280px]">
                                                {row.name}
                                            </div>
                                            {row.official_id && (
                                                <div className="text-xs text-gray-500 tabular-nums mt-0.5">
                                                    {row.official_id}
                                                </div>
                                            )}
                                        </td>
                                        <td className={CELL}>
                                            {row.type ? (
                                                <TypeChip type={row.type} />
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className={CELL}>
                                            <OfertaStatusBadge status={status} />
                                        </td>
                                        <td className={CELL + " text-right tabular-nums"}>
                                            {skusCount.toLocaleString("es-CL")}
                                        </td>
                                        <td className={CELL}>
                                            <DaysLeft end={row.end_date} />
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StateRow({
    colSpan,
    kind,
    children,
}: {
    colSpan: number;
    kind: "loading" | "error" | "empty";
    children: React.ReactNode;
}) {
    const tone =
        kind === "error"
            ? "text-rose-600"
            : kind === "empty"
              ? "text-gray-500"
              : "text-gray-400";
    return (
        <tr>
            <td colSpan={colSpan} className={`py-8 px-4 text-center text-sm ${tone}`}>
                {children}
            </td>
        </tr>
    );
}
