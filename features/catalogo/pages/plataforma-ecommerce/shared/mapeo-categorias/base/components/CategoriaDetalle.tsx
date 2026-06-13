// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/components/CategoriaDetalle.tsx
//
// Panel derecho del mapeo de categorías. Muestra:
//   - breadcrumb Mimbral → N1 → N2 → N3
//   - mapeo principal con confianza
//   - SKUs vinculados
//   - tabla de mapeos secundarios por marca (con datos del back si están)
//   - "última modificación" (audit trail)
//
// Si no se seleccionó ningún N3, muestra empty state.

"use client";

import { useEffect, useState } from "react";
import { useMapeoCategoriasApi } from "../api/mapeo-categorias-api";
import { List, ChevronDown, Flag, Plus, Clock } from "lucide-react";
import { Card, Sec, Field, PillBtn } from "../../../../_shared/janis";
import type { CategoriaNodo, MapeoCategoria } from "../types/mapeo-categorias-types";

export interface CategoriaDetalleProps {
    /** Ruta de selección N1 → N2 → N3. null si no hay selección. */
    breadcrumb: CategoriaNodo[];
    /** Si null, se muestra empty state. */
    n3: CategoriaNodo | null;
}

export function CategoriaDetalle({ breadcrumb, n3 }: CategoriaDetalleProps) {
    if (!n3) {
        return (
            <div className="px-6 pt-6 pb-10">
                <Card>
                    <div className="py-10 text-center">
                        <div className="text-gray-400 mx-auto w-10 h-10 mb-3">
                            <List className="w-9 h-9" />
                        </div>
                        <div className="text-[14px] font-semibold text-gray-700">
                            Selecciona una categoría N3
                        </div>
                        <p className="text-[12.5px] text-gray-500 mt-1 max-w-xs mx-auto">
                            Expande un N2 en el árbol de la izquierda y haz click en
                            una N3 para ver su mapeo al marketplace.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return <CategoriaDetalleLoaded n3={n3} breadcrumb={breadcrumb} />;
}

function CategoriaDetalleLoaded({
    n3,
    breadcrumb,
}: {
    n3: CategoriaNodo;
    breadcrumb: CategoriaNodo[];
}) {
    const api = useMapeoCategoriasApi();
    const [mapeos, setMapeos] = useState<MapeoCategoria[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let canceled = false;
        setLoading(true);
        setError(null);
        api.getMapeos(n3.id)
            .then((res) => {
                if (canceled) return;
                setMapeos(Array.isArray(res) ? res : []);
            })
            .catch((e: Error) => {
                if (canceled) return;
                setError(e?.message ?? "Error cargando mapeos");
            })
            .finally(() => {
                if (!canceled) setLoading(false);
            });
        return () => {
            canceled = true;
        };
    }, [api, n3.id]);

    // Mapeo "principal" = el primero sin marca (o el primero a secas si no hay claros).
    const principal = mapeos.find((m) => !m.marca) ?? mapeos[0] ?? null;
    const secundarios = mapeos.filter((m) => m !== principal);

    return (
        <div className="px-6 pt-6 pb-10">
            <Card>
                <Sec icon={<List className="w-[18px] h-[18px]" />}>Categoría seleccionada</Sec>

                {/* Breadcrumb */}
                <div className="mb-6 px-3 py-2.5 rounded bg-gray-50 border border-gray-200 flex items-center gap-2 text-[12.5px] flex-wrap">
                    <span className="text-gray-500">Mimbral</span>
                    {breadcrumb.map((b, i) => (
                        <span
                            key={`${b.id}-${i}`}
                            className="flex items-center gap-2"
                        >
                            <CrumbCaret />
                            <span
                                className={
                                    i === breadcrumb.length - 1
                                        ? "font-semibold text-gray-900"
                                        : "text-gray-500"
                                }
                            >
                                {b.nombre}
                            </span>
                        </span>
                    ))}
                </div>

                {/* Mapeo principal */}
                <Field label="Mapeo principal">
                    {loading ? (
                        <span className="text-gray-400 text-[12.5px]">Cargando…</span>
                    ) : error ? (
                        <span className="text-rose-700 text-[12.5px]">{error}</span>
                    ) : principal ? (
                        <div className="flex items-center justify-between border-b border-gray-200 py-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                    {principal.marketplace_categoria_id}
                                </span>
                                <span className="text-gray-700">
                                    {principal.marketplace_categoria_nombre ?? "—"}
                                </span>
                            </div>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="text-amber-700 text-[12.5px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Esta N3 aún no tiene mapeo principal
                        </div>
                    )}
                </Field>

                {principal && typeof principal.confianza === "number" && (
                    <Field label="Confianza">
                        <ConfianzaBar value={normalizeConfianza(principal.confianza)} />
                    </Field>
                )}

                {principal && typeof principal.skus_count === "number" && (
                    <Field label="SKUs vinculados">
                        <span className="tabular-nums text-blue-700">
                            {principal.skus_count.toLocaleString("es-CL")} ítems
                        </span>
                    </Field>
                )}

                {/* Mapeos secundarios */}
                {secundarios.length > 0 && (
                    <>
                        <div className="h-4" />
                        <Sec icon={<Flag className="w-[18px] h-[18px]" />}>
                            Mapeos secundarios por marca
                        </Sec>
                        <div className="border border-gray-200 rounded overflow-hidden">
                            <table className="w-full text-[12.5px]">
                                <thead>
                                    <tr className="text-[10.5px] uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                                        <th className="text-left py-2 px-3">Marca</th>
                                        <th className="text-left py-2 px-3">Categoría ML</th>
                                        <th className="text-right py-2 px-3 w-20">SKUs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {secundarios.map((m) => (
                                        <tr
                                            key={`${m.id ?? m.marketplace_categoria_id}-${m.marca}`}
                                            className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60"
                                        >
                                            <td className="py-2 px-3 font-medium text-gray-900">
                                                {m.marca ?? "—"}
                                            </td>
                                            <td className="py-2 px-3 text-gray-700">
                                                {m.marketplace_categoria_id}{" "}
                                                {m.marketplace_categoria_nombre
                                                    ? `· ${m.marketplace_categoria_nombre}`
                                                    : ""}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                {m.skus_count?.toLocaleString("es-CL") ?? "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div className="mt-3">
                    <PillBtn
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Agregar mapeo
                    </PillBtn>
                </div>

                {/* Última modificación — placeholder visual (audit trail TBD backend) */}
                <div className="h-4" />
                <Sec icon={<Clock className="w-[18px] h-[18px]" />}>Última modificación</Sec>
                <div className="text-[12.5px] text-gray-500">
                    Sin información de auditoría disponible. El backend no expone aún
                    el campo <code className="text-[11.5px] bg-gray-100 px-1 rounded">updated_by</code>.
                </div>
            </Card>
        </div>
    );
}

function ConfianzaBar({ value }: { value: number }) {
    const pct = Math.max(0, Math.min(100, value));
    const tone =
        pct >= 80
            ? "bg-emerald-500"
            : pct >= 50
              ? "bg-amber-500"
              : "bg-rose-500";
    const textTone =
        pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-rose-700";
    return (
        <div className="flex items-center gap-2 py-1">
            <div className="h-1.5 w-32 bg-gray-100 rounded overflow-hidden">
                <div
                    className={`h-full ${tone}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`tabular-nums font-medium ${textTone}`}>{pct}%</span>
        </div>
    );
}

/** Normaliza confianza a 0..100. Acepta 0..1 o 0..100 de entrada. */
function normalizeConfianza(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value <= 1) return Math.round(value * 100);
    return Math.round(value);
}

function CrumbCaret() {
    return (
        <svg
            className="w-3 h-3 text-gray-400"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path d="M4.5 3l3 3-3 3" />
        </svg>
    );
}
