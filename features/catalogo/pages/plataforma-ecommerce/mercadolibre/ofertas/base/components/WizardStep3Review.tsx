// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/WizardStep3Review.tsx
//
// Wizard Step 3: revisión final. Muestra meta + tabla de SKUs + botón
// "Lanzar campaña". El submit lo hace el wizard view padre.
//
// Look OMS: Cards con title + FieldRow + table bordered.

"use client";

import { useMemo } from "react";
import { List, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { FieldRow, SectionDivider } from "../../../../_shared/ui";
import { TypeChip } from "./TypeChip";
import { PublicationTypeChip } from "./PublicationTypeChip";
import type { WizardStep1Draft } from "./WizardStep1Info";
import type { SelectedSku } from "./WizardStep2Skus";

export interface WizardStep3ReviewProps {
    info: WizardStep1Draft;
    skus: ReadonlyArray<SelectedSku>;
    submitting: boolean;
    submitError: string | null;
}

const HEADER = [
    "text-xs uppercase tracking-wider text-gray-500 font-semibold",
    "py-3 px-3 bg-gray-50 border-b border-gray-200 text-left",
].join(" ");

export function WizardStep3Review({
    info,
    skus,
    submitError,
}: WizardStep3ReviewProps) {
    const stats = useMemo(() => {
        const total = skus.length;
        const avgDiscount =
            skus.length > 0
                ? Math.round(
                      skus.reduce(
                          (acc, s) => acc + (s.discount ?? info.global_discount),
                          0,
                      ) / skus.length,
                  )
                : 0;
        const totalStock = skus.reduce((acc, s) => acc + s.stock, 0);
        const totalDescuento = skus.reduce((acc, s) => {
            const d = s.discount ?? info.global_discount;
            return acc + (s.price * d) / 100;
        }, 0);
        return { total, avgDiscount, totalStock, totalDescuento };
    }, [info.global_discount, skus]);

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            {/* Banner de errores del submit */}
            {submitError && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    <strong>No se pudo crear la campaña:</strong> {submitError}
                </div>
            )}

            <Card title="Revisión final">
                <div className="grid grid-cols-[1fr_360px] gap-8">
                    <div className="min-w-0">
                        <FieldRow label="Nombre">
                            <span className="text-gray-900">{info.name || "—"}</span>
                        </FieldRow>
                        <FieldRow label="Tipo">
                            <TypeChip type={info.type} />
                        </FieldRow>
                        <FieldRow label="Período">
                            <span className="tabular-nums">
                                {info.start_date || "—"} → {info.end_date || "—"}
                            </span>
                        </FieldRow>
                        <FieldRow label="Descuento global">
                            <span className="tabular-nums">
                                {info.global_discount}%
                            </span>
                        </FieldRow>
                    </div>

                    <div className="border-l border-gray-200 pl-8">
                        <SectionDivider icon={<TrendingUp className="w-4 h-4" />}>
                            Resumen
                        </SectionDivider>
                        <dl className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
                            <dt className="text-gray-500">SKUs</dt>
                            <dd className="text-gray-900 tabular-nums text-right font-medium">
                                {stats.total}
                            </dd>
                            <dt className="text-gray-500">Descuento prom.</dt>
                            <dd className="text-gray-900 tabular-nums text-right font-medium">
                                {stats.avgDiscount}%
                            </dd>
                            <dt className="text-gray-500">Stock total</dt>
                            <dd className="text-gray-900 tabular-nums text-right font-medium">
                                {stats.totalStock.toLocaleString("es-CL")}
                            </dd>
                            <dt className="text-gray-500">Cobertura desc.</dt>
                            <dd className="text-gray-900 tabular-nums text-right font-medium">
                                $
                                {Math.round(stats.totalDescuento).toLocaleString(
                                    "es-CL",
                                )}
                            </dd>
                        </dl>
                    </div>
                </div>
            </Card>

            {/* SKUs a publicar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <List className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                            Publicaciones a inscribir ({skus.length})
                        </h3>
                    </div>
                </div>
                {skus.length === 0 ? (
                    <div className="py-8 text-center text-sm text-rose-600">
                        ⚠ No hay publicaciones seleccionadas. Vuelve al paso de SKUs
                        antes de confirmar.
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr>
                                    <th className={HEADER}>Publicación</th>
                                    <th className={HEADER}>Producto</th>
                                    <th className={HEADER + " text-right w-24"}>
                                        Precio
                                    </th>
                                    <th className={HEADER + " text-right w-20"}>
                                        Desc.
                                    </th>
                                    <th className={HEADER + " text-right w-28"}>
                                        Nuevo precio
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {skus.map((s) => {
                                    const d = s.discount ?? info.global_discount;
                                    const newPrice = Math.round(s.price * (1 - d / 100));
                                    return (
                                        <tr
                                            key={s.item_id ?? s.sku}
                                            className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <PublicationTypeChip
                                                        kind={s.pubKind ?? "clasica"}
                                                    />
                                                    <code className="text-xs text-gray-700 tabular-nums">
                                                        {s.item_id ?? s.sku}
                                                    </code>
                                                </div>
                                                <div className="text-[11px] text-gray-400 tabular-nums">
                                                    SKU {s.sku}
                                                </div>
                                            </td>
                                            <td
                                                className="py-2 px-3 text-gray-700 truncate max-w-[320px]"
                                                title={s.name}
                                            >
                                                {s.name}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                ${s.price.toLocaleString("es-CL")}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                {d}%
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-blue-700">
                                                ${newPrice.toLocaleString("es-CL")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
