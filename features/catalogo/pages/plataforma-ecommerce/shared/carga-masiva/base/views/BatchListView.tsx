// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/views/BatchListView.tsx
//
// Landing del panel de carga masiva: LISTA de lotes (reemplaza al wizard como
// lo primero que se ve). Acciones: "Nueva carga masiva" (→ wizard), ver detalle,
// archivar. Muestra resumen de productos por lote (publicados/asignados/pendientes).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Archive } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { SimpleModal } from "@/components/ui/modal";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useBatchList } from "../hooks/useBatchList";
import { useCargaMasivaStore } from "../store/carga-masiva.store";
import type { BatchSummary } from "../types/carga-masiva-types";

export interface BatchListViewProps {
    accountId: number;
}

const STATUS_LABEL: Record<string, string> = {
    parsing: "Procesando",
    validating: "Validando",
    ready: "Listo",
    publishing: "Publicando",
    done: "Aplicado",
    error: "Error",
    archived: "Archivado",
};

function fmtDate(iso?: string): string {
    if (!iso) return "—";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "—";
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export function BatchListView({ accountId }: BatchListViewProps) {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const { batches, busy, error, includeArchived, setIncludeArchived, archive } = useBatchList(accountId);
    const [toArchive, setToArchive] = useState<BatchSummary | null>(null);
    // Reset del wizard: "Nueva carga masiva" SIEMPRE empieza limpio, sin
    // arrastrar el lote del intake anterior persistido en sessionStorage.
    const resetWizard = useCargaMasivaStore((s) => s.reset);

    const nuevaCarga = () => {
        resetWizard();
        router.push(`${platform.basePath}/carga-masiva/nueva`);
    };

    const openDetail = (b: BatchSummary) =>
        router.push(`${platform.basePath}/carga-masiva/${encodeURIComponent(b.batchId)}`);

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Carga masiva`}
                title="Lotes de carga masiva"
                actions={
                    <ActionButton
                        variant="primary"
                        size="sm"
                        onClick={nuevaCarga}
                    >
                        <Upload className="w-4 h-4" />
                        Nueva carga masiva
                    </ActionButton>
                }
            />

            {/* Filtros */}
            <div className="bg-white px-6 border-b border-gray-200 flex items-center gap-3 h-12">
                <label className="flex items-center gap-2 text-[12.5px] text-gray-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={includeArchived}
                        onChange={(e) => setIncludeArchived(e.target.checked)}
                    />
                    Ver archivados
                </label>
                <span className="ml-auto text-[11.5px] text-gray-500 tabular-nums">
                    {busy ? "Cargando…" : `${batches.length.toLocaleString("es-CL")} lotes`}
                </span>
            </div>

            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex-1 bg-gray-100 px-6 py-6">
                <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
                    <table className="w-full text-[12.5px]">
                        <thead>
                            <tr className="text-[10.5px] uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-2 pl-5 pr-2">Archivo</th>
                                <th className="text-left py-2 px-2 w-32">Subido por</th>
                                <th className="text-left py-2 px-2 w-36">Fecha</th>
                                <th className="text-left py-2 px-2 w-28">Estado</th>
                                <th className="text-left py-2 px-2 w-52">Productos</th>
                                <th className="text-right py-2 pl-2 pr-5 w-40">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {busy && batches.length === 0 ? (
                                <BatchSkeletonRows count={5} />
                            ) : batches.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-gray-500 text-[12.5px]">
                                        Sin lotes — crea uno con &quot;Nueva carga masiva&quot;.
                                    </td>
                                </tr>
                            ) : (
                                batches.map((b) => (
                                    <tr
                                        key={b.batchId}
                                        className={[
                                            "border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60",
                                            b.archived ? "opacity-60" : "",
                                        ].join(" ")}
                                    >
                                        <td className="py-2 pl-5 pr-2">
                                            <button
                                                type="button"
                                                onClick={() => openDetail(b)}
                                                className="text-blue-700 hover:underline font-medium text-left"
                                            >
                                                {b.filename || b.batchId}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-gray-600">
                                            {b.uploadedByName || (b.uploadedBy != null ? `#${b.uploadedBy}` : "—")}
                                        </td>
                                        <td className="py-2 px-2 text-gray-500 tabular-nums">{fmtDate(b.uploadedAt)}</td>
                                        <td className="py-2 px-2 text-gray-700">
                                            {STATUS_LABEL[b.status ?? ""] ?? b.status ?? "—"}
                                        </td>
                                        <td className="py-2 px-2 text-[11.5px] tabular-nums">
                                            <span className="text-emerald-700">{b.publicados ?? 0} pub.</span>{" · "}
                                            <span className="text-blue-700">{b.asignados ?? 0} asig.</span>{" · "}
                                            <span className="text-gray-500">{b.pendientes ?? 0} pend.</span>
                                        </td>
                                        <td className="py-2 pl-2 pr-5 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => openDetail(b)}
                                                className="text-[11.5px] text-blue-700 hover:underline mr-3"
                                            >
                                                Ver detalle
                                            </button>
                                            {!b.archived && (
                                                <button
                                                    type="button"
                                                    onClick={() => setToArchive(b)}
                                                    className="text-[11.5px] text-gray-500 hover:text-rose-700 hover:underline"
                                                >
                                                    Archivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SimpleModal
                open={!!toArchive}
                title="Archivar lote"
                onClose={() => setToArchive(null)}
                maxWidth="sm:max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Vas a archivar <strong>{toArchive?.filename || toArchive?.batchId}</strong>. Se oculta de la
                        lista (es reversible) y no toca los productos ya publicados en ML.
                    </p>
                    <div className="flex justify-end gap-2">
                        <ActionButton variant="secondary" size="sm" onClick={() => setToArchive(null)}>
                            Cancelar
                        </ActionButton>
                        <ActionButton
                            variant="success"
                            size="sm"
                            onClick={async () => {
                                const b = toArchive;
                                setToArchive(null);
                                if (b) await archive(b.batchId);
                            }}
                        >
                            <Archive className="w-4 h-4" />
                            Archivar
                        </ActionButton>
                    </div>
                </div>
            </SimpleModal>
        </div>
    );
}

/** Skeleton de carga — filas grises animadas mientras se cargan los lotes. */
function BatchSkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-b-0 animate-pulse">
                    <td className="py-2.5 pl-5 pr-2">
                        <div className="h-4 w-40 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-28 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-44 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 pl-2 pr-5">
                        <div className="h-4 w-24 rounded bg-gray-200 ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
}
