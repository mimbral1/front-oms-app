// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/views/ProductosAPublicarView.tsx
//
// Bandeja cross-lote "Productos a publicar". Lista filas disponibles/asignadas/
// publicadas de TODOS los lotes activos (ML), con su uploader. El publicador
// toma (claim exclusivo), hace llenado masivo de título/medidas/peso, y abre
// cada fila en el wizard para completar y publicar.

"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CheckSquare, Hand, Inbox, PencilLine, RotateCcw, UserCheck } from "lucide-react";

import { ActionButton } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { SimpleModal } from "@/components/ui/modal";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { RowStatusPill } from "../components/RowStatusPill";
import { usePoolBandeja, type PoolFilter } from "../hooks/usePoolBandeja";
import { useCargaMasivaApi } from "../api/carga-masiva-api";
import type { BulkRow } from "../types/carga-masiva-types";

export interface ProductosAPublicarViewProps {
    accountId: number;
}

const FILTERS: TabItem[] = [
    { id: "disponible", label: "Disponibles", icon: Inbox },
    { id: "lo-mio", label: "Asignados", icon: UserCheck },
    { id: "publicado", label: "Publicados", icon: CheckSquare },
];

/** Key estable de una fila cross-lote. */
function rowKey(r: BulkRow): string {
    return `${r.batchId ?? "?"}#${r.rowNumber}`;
}

/** Agrupa filas seleccionadas por batchId (claim/release son por-lote). */
function groupByBatch(rows: BulkRow[]): Map<string, number[]> {
    const m = new Map<string, number[]>();
    for (const r of rows) {
        if (!r.batchId) continue;
        const arr = m.get(r.batchId) ?? [];
        arr.push(r.rowNumber);
        m.set(r.batchId, arr);
    }
    return m;
}

export function ProductosAPublicarView({ accountId }: ProductosAPublicarViewProps) {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const api = useCargaMasivaApi();
    const { rows, filter, setFilter, busy, error, userId, reload, claim, release } =
        usePoolBandeja(accountId);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkErr, setBulkErr] = useState<string | null>(null);
    const [form, setForm] = useState({ title: "", largo: "", ancho: "", alto: "", peso: "" });

    const selectedRows = useMemo(
        () => rows.filter((r) => selected.has(rowKey(r))),
        [rows, selected],
    );

    const toggle = useCallback((r: BulkRow) => {
        setSelected((prev) => {
            const next = new Set(prev);
            const k = rowKey(r);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelected((prev) =>
            prev.size === rows.length ? new Set() : new Set(rows.map(rowKey)),
        );
    }, [rows]);

    const clearSelection = useCallback(() => setSelected(new Set()), []);

    const doClaim = useCallback(async () => {
        const groups = groupByBatch(selectedRows);
        for (const [batchId, rowNumbers] of Array.from(groups.entries())) {
            await claim(batchId, rowNumbers);
        }
        clearSelection();
    }, [selectedRows, claim, clearSelection]);

    const doRelease = useCallback(async () => {
        const groups = groupByBatch(selectedRows);
        for (const [batchId, rowNumbers] of Array.from(groups.entries())) {
            await release(batchId, rowNumbers);
        }
        clearSelection();
    }, [selectedRows, release, clearSelection]);

    const openRow = useCallback(
        (r: BulkRow) => {
            if (!r.batchId || !r.sku) return;
            const q = new URLSearchParams({
                sku: r.sku,
                batchId: r.batchId,
                rowNumber: String(r.rowNumber),
                from: "carga-masiva",
            });
            router.push(`${platform.basePath}/publicar?${q.toString()}`);
        },
        [router, platform.basePath],
    );

    const applyBulk = useCallback(async () => {
        if (!userId) {
            setBulkErr("Usuario no identificado.");
            return;
        }
        const mapped: Record<string, unknown> = {};
        if (form.title.trim()) mapped.title = form.title.trim();
        const pkg: Record<string, number> = {};
        if (Number(form.largo) > 0) pkg.length_cm = Number(form.largo);
        if (Number(form.ancho) > 0) pkg.width_cm = Number(form.ancho);
        if (Number(form.alto) > 0) pkg.height_cm = Number(form.alto);
        if (Number(form.peso) > 0) pkg.weight_g = Number(form.peso);
        if (Object.keys(pkg).length) mapped.package = pkg;
        if (!Object.keys(mapped).length) {
            setBulkErr("Completa al menos un campo.");
            return;
        }
        setBulkBusy(true);
        setBulkErr(null);
        try {
            for (const r of selectedRows) {
                if (!r.batchId) continue;
                await api.updateRow(r.batchId, r.rowNumber, { mapped, updatedBy: userId });
            }
            setBulkOpen(false);
            setForm({ title: "", largo: "", ancho: "", alto: "", peso: "" });
            clearSelection();
            await reload();
        } catch (e) {
            setBulkErr((e as Error)?.message ?? "Error aplicando el llenado masivo.");
        } finally {
            setBulkBusy(false);
        }
    }, [userId, form, selectedRows, api, clearSelection, reload]);

    const allChecked = rows.length > 0 && selected.size === rows.length;

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Productos a publicar`}
                title="Bandeja de publicación"
                actions={
                    selected.size > 0 ? (
                        <>
                            <ActionButton variant="success" size="sm" onClick={doClaim} disabled={busy}>
                                <Hand className="w-4 h-4" />
                                Tomar {selected.size}
                            </ActionButton>
                            <ActionButton variant="secondary" size="sm" onClick={() => setBulkOpen(true)} disabled={busy}>
                                <PencilLine className="w-4 h-4" />
                                Llenado masivo
                            </ActionButton>
                            <ActionButton variant="secondary" size="sm" onClick={doRelease} disabled={busy}>
                                <RotateCcw className="w-4 h-4" />
                                Soltar {selected.size}
                            </ActionButton>
                        </>
                    ) : undefined
                }
            />

            {/* Filtros */}
            <div className="bg-white px-6 border-b border-gray-200 flex items-center gap-2">
                <Tabs
                    tabs={FILTERS}
                    value={filter}
                    onChange={(id) => { clearSelection(); setFilter(id as PoolFilter); }}
                />
                <span className="ml-auto text-[11.5px] text-gray-500 tabular-nums">
                    {busy ? "Cargando…" : `${rows.length.toLocaleString("es-CL")} productos`}
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
                                <th className="py-2 pl-5 pr-2 w-10">
                                    <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Seleccionar todo" />
                                </th>
                                <th className="text-left py-2 px-2">SKU</th>
                                <th className="text-left py-2 px-2">Nombre</th>
                                <th className="text-right py-2 px-2 w-20">Margen</th>
                                <th className="text-left py-2 px-2 w-28">Subido por</th>
                                <th className="text-left py-2 px-2 w-28">Estado</th>
                                <th className="text-left py-2 px-2 w-28">Asignado a</th>
                                <th className="text-right py-2 pl-2 pr-5 w-24">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {busy && rows.length === 0 ? (
                                <PoolSkeletonRows count={6} />
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-gray-500 text-[12.5px]">
                                        Sin productos en este filtro
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => {
                                    const mine = r.assignedTo != null && r.assignedTo === userId;
                                    const k = rowKey(r);
                                    return (
                                        <tr
                                            key={k}
                                            className={[
                                                "border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60",
                                                selected.has(k) ? "bg-blue-50/40" : "",
                                            ].join(" ")}
                                        >
                                            <td className="py-2 pl-5 pr-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(k)}
                                                    onChange={() => toggle(r)}
                                                    aria-label={`Seleccionar ${r.sku}`}
                                                />
                                            </td>
                                            <td className="py-2 px-2 font-medium text-gray-900 tabular-nums">
                                                {r.sku || <span className="text-gray-400 italic">—</span>}
                                            </td>
                                            <td className="py-2 px-2 text-gray-700">
                                                {r.title ?? <span className="text-gray-400 italic">(sin nombre)</span>}
                                            </td>
                                            <td className="py-2 px-2 text-right tabular-nums text-gray-700">
                                                {r.margen != null ? `${Math.round(r.margen * 100)}%` : "—"}
                                            </td>
                                            <td className="py-2 px-2 text-gray-500 tabular-nums">
                                                {r.uploadedByName || (r.uploadedBy != null ? `#${r.uploadedBy}` : "—")}
                                            </td>
                                            <td className="py-2 px-2">
                                                <RowStatusPill status={r.status ?? "ok"} />
                                            </td>
                                            <td className="py-2 px-2 text-gray-600">
                                                {mine ? (
                                                    <span className="text-emerald-700 font-medium">Tú</span>
                                                ) : r.assignedTo != null ? (
                                                    <span className="text-gray-500">{r.assignedToName || `#${r.assignedTo}`}</span>
                                                ) : (
                                                    <span className="text-gray-400">Libre</span>
                                                )}
                                            </td>
                                            <td className="py-2 pl-2 pr-5 text-right">
                                                {mine ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRow(r)}
                                                        className="text-[11.5px] text-blue-700 hover:underline"
                                                    >
                                                        Rellenar →
                                                    </button>
                                                ) : (
                                                    <span className="text-[11.5px] text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Llenado masivo */}
            <SimpleModal
                open={bulkOpen}
                title={`Llenado masivo · ${selected.size} productos`}
                onClose={() => setBulkOpen(false)}
                maxWidth="sm:max-w-lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Aplica estos campos a las <strong>{selected.size}</strong> filas seleccionadas.
                        Los vacíos no se tocan. El resto (categoría, atributos, imágenes) se completa en el wizard.
                    </p>
                    <div>
                        <label className="block text-[11.5px] font-medium text-gray-700 mb-1">Título / Nombre</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            className="w-full h-9 rounded-md border border-gray-300 px-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                            placeholder="(dejar vacío para no tocar)"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {([
                            { key: "largo", label: "Largo (cm)" },
                            { key: "ancho", label: "Ancho (cm)" },
                            { key: "alto", label: "Alto (cm)" },
                            { key: "peso", label: "Peso (g)" },
                        ] as const).map(({ key, label }) => (
                            <div key={key}>
                                <label className="block text-[10.5px] font-medium text-gray-600 mb-1">{label}</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form[key]}
                                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                                    className="w-full h-9 rounded-md border border-gray-300 px-2 text-sm tabular-nums text-right outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                    {bulkErr && (
                        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                            {bulkErr}
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <ActionButton variant="secondary" size="sm" onClick={() => setBulkOpen(false)} disabled={bulkBusy}>
                            Cancelar
                        </ActionButton>
                        <ActionButton variant="success" size="sm" onClick={applyBulk} disabled={bulkBusy} loading={bulkBusy}>
                            <CheckCircle2 className="w-4 h-4" />
                            Aplicar a {selected.size}
                        </ActionButton>
                    </div>
                </div>
            </SimpleModal>
        </div>
    );
}

/** Skeleton de carga — filas grises animadas mientras se carga la bandeja. */
function PoolSkeletonRows({ count }: { count: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-b-0 animate-pulse">
                    <td className="py-2.5 pl-5 pr-2">
                        <div className="h-4 w-4 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-48 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-12 rounded bg-gray-200 ml-auto" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-5 w-16 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 px-2">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="py-2.5 pl-2 pr-5">
                        <div className="h-4 w-16 rounded bg-gray-200 ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
}
