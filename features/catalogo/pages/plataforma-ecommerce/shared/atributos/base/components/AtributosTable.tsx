// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/components/AtributosTable.tsx
//
// Tabla principal del listado. Versión Janis del `loadAtributos()` del
// monolito (`atributos.ts` líneas 105–142). Click en row → navega al detail.

"use client";

import type { Atributo } from "../types/atributo-types";

export interface AtributosTableProps {
    rows: Atributo[];
    loading: boolean;
    error: string | null;
    /** Callback al click en una row — el view se encarga del router.push. */
    onRowClick?: (row: Atributo) => void;
}

const HEADER_CLASSES =
    "text-[10.5px] uppercase tracking-[0.08em] text-gray-500 font-semibold py-2.5 px-3 bg-gray-50 border-b border-gray-200 text-left";

const CELL_CLASSES = "py-2 px-3 border-b border-gray-100 align-middle";

export function AtributosTable({ rows, loading, error, onRowClick }: AtributosTableProps) {
    return (
        <div className="bg-white rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                    <thead>
                        <tr>
                            <th className={HEADER_CLASSES} style={{ width: 72 }}>
                                ID
                            </th>
                            <th className={HEADER_CLASSES}>Nombre</th>
                            <th className={HEADER_CLASSES}>Nombre técnico</th>
                            <th className={HEADER_CLASSES}>Tipo</th>
                            <th className={HEADER_CLASSES}>Obligatorio</th>
                            <th className={HEADER_CLASSES}>Herencia</th>
                            <th className={HEADER_CLASSES + " text-right"}>Opciones</th>
                            <th className={HEADER_CLASSES}>Activo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <StateRow colSpan={8} kind="loading">
                                Cargando atributos…
                            </StateRow>
                        )}
                        {!loading && error && (
                            <StateRow colSpan={8} kind="error">
                                Error: {error}
                            </StateRow>
                        )}
                        {!loading && !error && rows.length === 0 && (
                            <StateRow colSpan={8} kind="empty">
                                Sin resultados — ajusta los filtros o crea un atributo nuevo.
                            </StateRow>
                        )}
                        {!loading &&
                            !error &&
                            rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className={CELL_CLASSES + " tabular-nums text-gray-500"}>
                                        {row.id}
                                    </td>
                                    <td className={CELL_CLASSES + " font-medium text-gray-900"}>
                                        {row.nombre || "—"}
                                    </td>
                                    <td className={CELL_CLASSES + " text-gray-600"}>
                                        <code className="text-[11.5px] tabular-nums">
                                            {row.nombreTecnico || "—"}
                                        </code>
                                    </td>
                                    <td className={CELL_CLASSES}>
                                        {row.tipoDato ? (
                                            <TipoBadge tipo={row.tipoDato} unidad={row.unidadMedida} />
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className={CELL_CLASSES}>
                                        <YesNoBadge value={!!row.esObligatorio} />
                                    </td>
                                    <td className={CELL_CLASSES}>
                                        {row.nivelHerencia ? (
                                            <HerenciaBadge nivel={row.nivelHerencia} />
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className={CELL_CLASSES + " text-right tabular-nums"}>
                                        {row.totalOpciones ?? 0}
                                    </td>
                                    <td className={CELL_CLASSES}>
                                        <YesNoBadge value={!!row.activo} />
                                    </td>
                                </tr>
                            ))}
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
            <td colSpan={colSpan} className={`py-8 px-4 text-center text-[12.5px] ${tone}`}>
                {children}
            </td>
        </tr>
    );
}

function TipoBadge({ tipo, unidad }: { tipo: string; unidad?: string | null }) {
    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
            {tipo}
            {unidad ? ` · ${unidad}` : ""}
        </span>
    );
}

function HerenciaBadge({ nivel }: { nivel: string }) {
    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200">
            {nivel}
        </span>
    );
}

function YesNoBadge({ value }: { value: boolean }) {
    return (
        <span
            className={[
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold",
                value
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
            ].join(" ")}
        >
            {value ? "Sí" : "No"}
        </span>
    );
}
