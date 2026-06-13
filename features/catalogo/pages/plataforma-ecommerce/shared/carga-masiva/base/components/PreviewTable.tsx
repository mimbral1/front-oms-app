// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/components/PreviewTable.tsx
//
// Tabla del stage `preview` — summary 4 KPIs + filtro (dropdown) + tabla.
//
// READ-ONLY: esta tabla es solo intake/revisión del lote. Completar/editar/
// publicar las filas se hace en "Productos a publicar" (la bandeja / flujo de
// trabajo), no acá. Por eso no hay columna de acción ni navegación por fila.

"use client";

import { useMemo, useState } from "react";
import { RowStatusPill } from "./RowStatusPill";
import type { BulkRow, RowFilterTone, RowStatus } from "../types/carga-masiva-types";

// Clases OMS para el <select> nativo del filtro (mismo patrón que los selects de
// publicar/AttrInput). Compacto para caber en la barra de filtro.
const FILTER_SELECT_CLASSES = [
    "h-7 rounded border border-gray-300 bg-white px-2 pr-7",
    "text-[11.5px] text-gray-700 shadow-sm cursor-pointer",
    "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
].join(" ");

export interface PreviewTableProps {
    rows: BulkRow[];
    /** ISO timestamp del último procesamiento (para el "Procesado hace X"). */
    processedAtIso?: string;
    /**
     * ID del batch — se manda como query param al wizard de Publicar para que
     * sepa a qué fila volver y a qué row hacerle PATCH al guardar.
     */
    batchId?: string;
}

const FILTERS: Array<{ id: RowFilterTone; label: string }> = [
    { id: "all", label: "Todos" },
    { id: "ok", label: "OK" },
    { id: "warn", label: "Avisos" },
    { id: "err", label: "Errores" },
];

export function PreviewTable({
    rows,
    processedAtIso,
}: PreviewTableProps) {
    const [filter, setFilter] = useState<RowFilterTone>("all");

    const counts = useMemo(() => {
        const ok = rows.filter((r) => r.status === "ok").length;
        const warn = rows.filter((r) => r.status === "warn").length;
        const err = rows.filter((r) => r.status === "err").length;
        return { ok, warn, err, total: rows.length };
    }, [rows]);

    const filtered = useMemo(() => {
        if (filter === "all") return rows;
        const target: RowStatus = filter;
        return rows.filter((r) => r.status === target);
    }, [filter, rows]);

    const processedNote = useMemo(() => {
        if (!processedAtIso) return null;
        const t = new Date(processedAtIso).getTime();
        if (Number.isNaN(t)) return null;
        const diffMin = Math.max(0, Math.floor((Date.now() - t) / 60_000));
        if (diffMin === 0) return "Procesado hace un momento";
        if (diffMin === 1) return "Procesado hace 1 minuto";
        if (diffMin < 60) return `Procesado hace ${diffMin} minutos`;
        const diffH = Math.floor(diffMin / 60);
        return `Procesado hace ${diffH}h ${diffMin % 60}m`;
    }, [processedAtIso]);

    return (
        <div className="bg-white rounded-md border border-gray-200">
            {/* Summary KPIs */}
            <div className="p-5 border-b border-gray-200 grid grid-cols-4 gap-4">
                <SumCell label="Total filas" value={counts.total} tone="neutral" />
                <SumCell label="OK" value={counts.ok} tone="ok" />
                <SumCell label="Avisos" value={counts.warn} tone="warn" />
                <SumCell label="Errores" value={counts.err} tone="err" />
            </div>

            {/* Filtro (dropdown) */}
            <div className="px-5 py-2.5 border-b border-gray-200 flex items-center gap-2 flex-wrap">
                <label
                    htmlFor="preview-filter"
                    className="text-[10.5px] uppercase tracking-wide font-semibold text-gray-500"
                >
                    Filtrar:
                </label>
                <select
                    id="preview-filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as RowFilterTone)}
                    className={FILTER_SELECT_CLASSES}
                >
                    {FILTERS.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.label}
                        </option>
                    ))}
                </select>
                {processedNote && (
                    <div className="ml-auto text-[11.5px] text-gray-500 tabular-nums">
                        {processedNote}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                    <thead>
                        <tr className="text-[10.5px] uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-2 pl-5 pr-2 w-12">Fila</th>
                            <th className="text-left py-2 px-2 w-28">Estado</th>
                            <th className="text-left py-2 px-2">SKU</th>
                            <th className="text-left py-2 px-2">Nombre</th>
                            <th className="text-right py-2 px-2 w-20">Margen</th>
                            <th className="text-left py-2 px-2 pr-5">Mensaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-8 text-center text-gray-400 text-[12.5px]"
                                >
                                    Sin filas que mostrar con este filtro
                                </td>
                            </tr>
                        ) : (
                            filtered.map((row) => {
                                return (
                                    <tr
                                        key={row.rowNumber}
                                        className={[
                                            "border-b border-gray-100 last:border-b-0",
                                            row.status === "err"
                                                ? "bg-rose-50/30"
                                                : row.status === "warn"
                                                  ? "bg-amber-50/20"
                                                  : "",
                                        ].join(" ")}
                                    >
                                        <td className="py-2 pl-5 pr-2 text-gray-500 tabular-nums">
                                            {row.rowNumber}
                                        </td>
                                        <td className="py-2 px-2">
                                            <RowStatusPill status={row.status ?? "ok"} />
                                        </td>
                                        <td className="py-2 px-2 font-medium text-gray-900 tabular-nums">
                                            {row.sku || (
                                                <span className="text-gray-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-gray-700">
                                            {row.title ?? (
                                                <span className="text-gray-400 italic">(sin nombre)</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-2 text-right tabular-nums text-gray-700">
                                            {row.margen != null
                                                ? `${Math.round(row.margen * 100)}%`
                                                : "—"}
                                        </td>
                                        <td className="py-2 px-2 pr-5 text-gray-700">
                                            {row.message ?? row.issues?.[0]?.message ?? "—"}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SumCell({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "neutral" | "ok" | "warn" | "err";
}) {
    const map = {
        neutral: { label: "text-gray-500", value: "text-gray-900" },
        ok: { label: "text-emerald-700", value: "text-emerald-700" },
        warn: { label: "text-amber-700", value: "text-amber-700" },
        err: { label: "text-rose-700", value: "text-rose-700" },
    } as const;
    return (
        <div>
            <div
                className={[
                    "text-[10.5px] uppercase tracking-wide font-semibold",
                    map[tone].label,
                ].join(" ")}
            >
                {label}
            </div>
            <div
                className={[
                    "text-[22px] font-semibold tabular-nums",
                    map[tone].value,
                ].join(" ")}
            >
                {value.toLocaleString("es-CL")}
            </div>
        </div>
    );
}
