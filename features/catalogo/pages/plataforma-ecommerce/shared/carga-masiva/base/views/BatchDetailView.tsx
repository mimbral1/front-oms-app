// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/views/BatchDetailView.tsx
//
// Detalle de un lote: tab Productos (estado + asignación + publicación) y tab
// Actividad (timeline desde ml_event_log scoped por batch_id).

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListChecks, History } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { RowStatusPill } from "../components/RowStatusPill";
import { useBatchDetail } from "../hooks/useBatchDetail";
import type { BulkRow } from "../types/carga-masiva-types";

export interface BatchDetailViewProps {
    accountId: number;
    batchId: string;
}

// event_code → etiqueta legible (español neutro).
const EVENT_LABEL: Record<string, string> = {
    Bulk_uploaded: "Subió el lote",
    Bulk_row_claimed: "Tomó",
    Bulk_row_released: "Soltó",
    Bulk_row_updated: "Completó",
    Product_published: "Publicó",
    Product_publish_failed: "Falló al publicar",
    Product_publish_retried: "Reintentó publicar",
    Product_updated: "Actualizó",
    Product_paused: "Pausó",
};

function fmtDate(iso?: string | null): string {
    if (!iso) return "—";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "—";
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

function publishLabel(r: BulkRow): string {
    switch (r.publishStatus) {
        case "synchronized": return "Publicado";
        case "error":        return "Error";
        case "pending":      return "Pendiente";
        case "paused":       return "Pausado";
        default:             return "—";
    }
}

export function BatchDetailView({ batchId }: BatchDetailViewProps) {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const { batch, rows, activity, busy, error } = useBatchDetail(batchId);
    const [tab, setTab] = useState<"productos" | "actividad">("productos");

    // Tabs globales con badge count en "Productos" (total de filas del lote).
    const tabs: TabItem[] = [
        { id: "productos", label: "Productos", icon: ListChecks, badgeCount: rows.length },
        { id: "actividad", label: "Actividad", icon: History },
    ];

    // Fecha de publicación REAL: del evento `Product_published` de la actividad
    // (NO de sku_updated_at, que el import pisa al vincular el lote). "—" si no
    // hay evento registrado (ej. publicaciones anteriores a la tabla de actividad).
    const publishedAtBySku = useMemo(() => {
        const m = new Map<string, string>();
        for (const a of activity) {
            if (a.eventCode === "Product_published" && a.success !== false && a.sku && a.createdAt) {
                m.set(a.sku, a.createdAt); // actividad viene ASC → la última publicación gana
            }
        }
        return m;
    }, [activity]);
    const pubDate = (sku: string | null | undefined): string => {
        const d = sku ? publishedAtBySku.get(sku) : undefined;
        return d ? fmtDate(d) : "—";
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Carga masiva`}
                title={batch?.filename ? `Lote · ${batch.filename}` : "Detalle del lote"}
                actions={
                    <ActionButton
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`${platform.basePath}/carga-masiva`)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a lotes
                    </ActionButton>
                }
            />

            {/* Tabs */}
            <div className="bg-white px-6 border-b border-gray-200 flex items-center gap-2">
                <Tabs tabs={tabs} value={tab} onChange={(id) => setTab(id as "productos" | "actividad")} />
                <span className="ml-auto text-[11.5px] text-gray-500 tabular-nums">
                    {busy ? "Cargando…" : tab === "productos" ? `${rows.length} productos` : `${activity.length} eventos`}
                </span>
            </div>

            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-gray-100 px-6 py-6">
                {tab === "productos" ? (
                    <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
                        <table className="w-full text-[12.5px]">
                            <thead>
                                <tr className="text-[10.5px] uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-2 pl-5 pr-2">SKU</th>
                                    <th className="text-left py-2 px-2">Nombre</th>
                                    <th className="text-left py-2 px-2 w-24">Estado</th>
                                    <th className="text-left py-2 px-2 w-44">Asignado a</th>
                                    <th className="text-left py-2 px-2 w-28">Publicación</th>
                                    <th className="text-left py-2 px-2 w-36">Fecha publicación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {busy && rows.length === 0 ? (
                                    <ProductSkeletonRows count={5} />
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-gray-500 text-[12.5px]">
                                            Sin productos
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r) => (
                                        <tr key={r.rowNumber} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60">
                                            <td className="py-2 pl-5 pr-2 font-medium text-gray-900 tabular-nums">
                                                {r.sku || <span className="text-gray-400 italic">—</span>}
                                            </td>
                                            <td className="py-2 px-2 text-gray-700">
                                                {r.title ?? <span className="text-gray-400 italic">(sin nombre)</span>}
                                            </td>
                                            <td className="py-2 px-2">
                                                <RowStatusPill status={r.status ?? "ok"} />
                                            </td>
                                            <td className="py-2 px-2 text-gray-600">
                                                {r.assignedTo != null ? (
                                                    <>
                                                        {r.assignedToName || `#${r.assignedTo}`}
                                                        {r.assignedAt ? (
                                                            <span className="text-gray-400 text-[11px]"> · {fmtDate(r.assignedAt)}</span>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">Libre</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-2 text-gray-700">{publishLabel(r)}</td>
                                            <td className="py-2 px-2 text-gray-500 tabular-nums">
                                                {pubDate(r.sku)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-md border border-gray-200 p-4">
                        {activity.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-[12.5px]">
                                {busy ? "Cargando…" : "Sin actividad registrada"}
                            </div>
                        ) : (
                            <ol className="space-y-2">
                                {activity.map((a) => (
                                    <li key={a.id} className="flex items-start gap-3 text-[12.5px]">
                                        <span className="text-gray-400 tabular-nums shrink-0 w-32">{fmtDate(a.createdAt)}</span>
                                        <span
                                            className={[
                                                "shrink-0 w-32 font-medium",
                                                a.success === false ? "text-rose-700" : "text-gray-900",
                                            ].join(" ")}
                                        >
                                            {EVENT_LABEL[a.eventCode] ?? a.eventCode}
                                        </span>
                                        <span className="text-gray-600">
                                            {a.actorName || "Sistema"}
                                            {a.sku ? <span className="text-gray-400"> · {a.sku}</span> : null}
                                            {a.errorMessage ? <span className="text-rose-600"> · {a.errorMessage}</span> : null}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Skeleton de carga — filas grises animadas mientras se cargan los productos del lote. */
function ProductSkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-b-0 animate-pulse">
                    <td className="py-2.5 pl-5 pr-2">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-48 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-5 w-16 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-32 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                    </td>
                </tr>
            ))}
        </>
    );
}
