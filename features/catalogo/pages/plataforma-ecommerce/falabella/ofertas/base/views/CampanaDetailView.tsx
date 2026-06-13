// Detalle de una campaña de ofertas Falabella: cabecera + items + acciones.
// Las acciones que ESCRIBEN a Falabella (activar/finalizar) están gateadas con
// confirmación y soportan dry-run + aplicar 1 SKU de prueba.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Trash2, Upload, Eye, Play, FlaskConical, Square, Table as TableIcon, Pencil } from "lucide-react";

import { ActionButton, IconButton } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/table";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useCampanasApi } from "../api/campanas-api";
import { CampanaStatusPill, ItemStatusPill } from "../components/CampanaStatusPill";
import { fmtFecha, fmtClp } from "../helpers/format";
import type { CampanaDetail, CampanaItem, ApplyResult, PreviewResult, PreviewItem, CampanaConflict } from "../types/campana-types";

const EDITABLE = new Set(["draft", "scheduled"]);

type DetailTab = "resumen" | "editar";
const TABS: TabItem[] = [
    { id: "resumen", label: "Resumen e ítems", icon: TableIcon },
    { id: "editar", label: "Editar y aplicar", icon: Pencil },
];

export function CampanaDetailView() {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const params = useParams();
    const id = String((params as any)?.id ?? "");
    const api = useCampanasApi();

    const [detail, setDetail] = useState<CampanaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [skusText, setSkusText] = useState("");
    const [conflicts, setConflicts] = useState<CampanaConflict[] | null>(null);
    const [pendingItems, setPendingItems] = useState<{ sku: string; precio_oferta?: number }[]>([]);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
    const [oneSku, setOneSku] = useState("");
    const [tab, setTab] = useState<DetailTab>("resumen");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setDetail(await api.get(id));
        } catch (e: any) {
            setError(e?.message || "No se pudo cargar la campaña");
        } finally {
            setLoading(false);
        }
    }, [api, id]);

    useEffect(() => {
        if (id) load();
    }, [id, load]);

    const parseSkusText = useCallback((text: string) => {
        return Array.from(
            new Set(text.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)),
        ).map((sku) => ({ sku }));
    }, []);

    const doAddItems = useCallback(
        async (items: { sku: string; precio_oferta?: number }[], confirm = false) => {
            if (!items.length) { setError("No hay SKUs para agregar"); return; }
            setBusy(true); setError(null); setMsg(null); setConflicts(null);
            try {
                const res = await api.addItems(id, items, confirm);
                if (res.needsConfirmation) {
                    setConflicts(res.conflicts);
                    setPendingItems(items);
                    setBusy(false);
                    return;
                }
                setMsg(`Agregados: ${res.added}. Omitidos: ${res.skipped.length}.`);
                setSkusText(""); setPendingItems([]);
                await load();
            } catch (e: any) {
                setError(e?.message || "No se pudieron agregar los SKUs");
            } finally {
                setBusy(false);
            }
        },
        [api, id, load],
    );

    const handleUpload = useCallback(
        async (file: File) => {
            setBusy(true); setError(null); setMsg(null);
            try {
                const parsed = await api.parseItems(file);
                if (parsed.errors?.length) {
                    setMsg(`Archivo con ${parsed.errors.length} advertencia(s); ${parsed.total} SKUs válidos.`);
                }
                await doAddItems(parsed.items);
            } catch (e: any) {
                setError(e?.message || "No se pudo procesar el archivo");
            } finally {
                setBusy(false);
            }
        },
        [api, doAddItems],
    );

    const runPreview = useCallback(async () => {
        setBusy(true); setError(null); setApplyResult(null);
        try { setPreview(await api.preview(id)); }
        catch (e: any) { setError(e?.message || "No se pudo calcular el preview"); }
        finally { setBusy(false); }
    }, [api, id]);

    const runActivate = useCallback(
        async (opts: { dryRun?: boolean; onlySkus?: string[] | null }) => {
            setBusy(true); setError(null); setPreview(null); setApplyResult(null);
            try {
                const res = await api.activate(id, opts);
                setApplyResult(res);
                if (!opts.dryRun) await load();
            } catch (e: any) {
                setError(e?.message || "Falló la activación");
            } finally {
                setBusy(false);
            }
        },
        [api, id, load],
    );

    const runFinish = useCallback(async () => {
        setBusy(true); setError(null);
        try { setApplyResult(await api.finish(id)); await load(); }
        catch (e: any) { setError(e?.message || "Falló la finalización"); }
        finally { setBusy(false); }
    }, [api, id, load]);

    const removeItem = useCallback(
        async (sku: string) => {
            setBusy(true); setError(null);
            try { await api.removeItem(id, sku); await load(); }
            catch (e: any) { setError(e?.message || "No se pudo quitar el SKU"); }
            finally { setBusy(false); }
        },
        [api, id, load],
    );

    const isEditable = detail ? EDITABLE.has(detail.status) : false;

    const columns: Column<CampanaItem>[] = [
        { header: "SKU", accessorKey: "sku", cell: (i) => <span className="font-mono text-gray-800">{i.sku}</span> },
        { header: "Precio normal", accessorKey: "base_price", cell: (i) => <span className="tabular-nums text-gray-600">{fmtClp(i.base_price)}</span> },
        { header: "Precio oferta", accessorKey: "special_price", cell: (i) => <span className="tabular-nums font-semibold text-gray-800">{fmtClp(i.special_price)}</span> },
        { header: "Tipo", accessorKey: "is_override", cell: (i) => (
            <span className="text-xs text-gray-500">{i.is_override ? "Manual" : "% global"}</span>
        ) },
        { header: "Estado", accessorKey: "apply_status", cell: (i) => <ItemStatusPill status={i.apply_status} /> },
        { header: "", accessorKey: "id", disableRowClick: true, cell: (i) => (
            isEditable ? (
                <IconButton
                    icon={Trash2}
                    size="sm"
                    label="Quitar SKU"
                    title="Quitar SKU"
                    disabled={busy}
                    onClick={() => removeItem(i.sku)}
                    className="hover:text-rose-600"
                />
            ) : null
        ) },
    ];

    const previewColumns: Column<PreviewItem>[] = [
        { header: "SKU", accessorKey: "sku", cell: (p) => <span className="font-mono text-gray-800">{p.sku}</span> },
        { header: "Normal", accessorKey: "base_price", cell: (p) => <span className="tabular-nums text-gray-600">{fmtClp(p.base_price)}</span> },
        { header: "Oferta", accessorKey: "special_price", cell: (p) => (
            p.base_desconocido
                ? <span className="text-amber-600">sin precio base</span>
                : <span className="tabular-nums font-semibold text-gray-800">{fmtClp(p.special_price)}</span>
        ) },
        { header: "Desc.", accessorKey: "descuento_pct", cell: (p) => (
            p.descuento_pct != null ? <span className="text-gray-700">-{p.descuento_pct}%</span> : <span className="text-gray-400">—</span>
        ) },
    ];

    const input = "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Ofertas`}
                title={detail?.nombre || "Campaña"}
                badge={detail ? { label: detail.status, tone: detail.status === "active" ? "live" : detail.status === "draft" ? "draft" : "paused" } : undefined}
                actions={
                    <>
                        <ActionButton variant="secondary" size="sm" onClick={() => router.push(`${platform.basePath}/ofertas`)}>
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </ActionButton>
                        <ActionButton variant="secondary" size="sm" onClick={load} disabled={loading || busy}>
                            <RefreshCw className="w-4 h-4" /> Refrescar
                        </ActionButton>
                    </>
                }
            />

            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs tabs={TABS} value={tab} onChange={(id) => setTab(id as DetailTab)} />
            </div>

            {(error || msg) && (
                <div className="bg-gray-100 px-6 pt-4 space-y-2">
                    {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
                    {msg && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</div>}
                </div>
            )}

            <div className="flex-1 bg-gray-100 px-6 py-6 space-y-4">
                {/* ── Tab: Resumen e ítems ── */}
                {tab === "resumen" && (
                <>
                {detail && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                        <div className="flex items-center gap-2"><span className="text-gray-500">Estado:</span> <CampanaStatusPill status={detail.status} /></div>
                        <div><span className="text-gray-500">Vigencia:</span> <b className="tabular-nums">{fmtFecha(detail.starts_at)} → {fmtFecha(detail.ends_at)}</b></div>
                        {detail.discount_pct != null && <div><span className="text-gray-500">Descuento:</span> <b>-{detail.discount_pct}%</b></div>}
                        <div><span className="text-gray-500">SKUs:</span> <b>{detail.items?.length ?? 0}</b></div>
                    </div>
                )}

                {/* Items de la campaña */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">SKUs de la campaña</div>
                    {detail && detail.items?.length > 0 ? (
                        <DataTable data={detail.items} columns={columns} showStatusBorder={false} />
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">{loading ? "Cargando…" : "Sin SKUs todavía."}</div>
                    )}
                </div>
                </>
                )}

                {/* ── Tab: Editar y aplicar ── */}
                {tab === "editar" && (
                <>
                {/* Agregar SKUs (solo draft/scheduled) */}
                {isEditable && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                        <h3 className="font-semibold text-sm text-gray-700">Agregar SKUs</h3>
                        <textarea
                            className={input + " font-mono"}
                            rows={3}
                            value={skusText}
                            onChange={(e) => setSkusText(e.target.value)}
                            placeholder="SKUs separados por coma, espacio o salto de línea…"
                        />
                        <div className="flex flex-wrap gap-2">
                            <ActionButton variant="primary" size="sm" disabled={busy} onClick={() => doAddItems(parseSkusText(skusText))}>
                                Agregar SKUs
                            </ActionButton>
                            <ActionButton variant="secondary" size="sm" disabled={busy} onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4" /> Subir Excel
                            </ActionButton>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.currentTarget.value = ""; }} />
                        </div>

                        {conflicts && conflicts.length > 0 && (
                            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 space-y-2">
                                <div>Estos SKUs ya están en otra campaña que se solapa:</div>
                                <ul className="text-xs list-disc pl-5">
                                    {conflicts.slice(0, 10).map((c) => (
                                        <li key={`${c.sku}-${c.campaign_id}`}><b className="font-mono">{c.sku}</b> → “{c.campaign_nombre}” ({c.status})</li>
                                    ))}
                                </ul>
                                <ActionButton variant="primary" size="sm" disabled={busy} onClick={() => doAddItems(pendingItems, true)}>
                                    Agregar de todas formas
                                </ActionButton>
                            </div>
                        )}
                    </div>
                )}

                {/* Acciones de aplicación */}
                {detail && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                        <h3 className="font-semibold text-sm text-gray-700">Aplicar a Falabella</h3>
                        <p className="text-xs text-gray-500">Activar escribe el precio especial en Falabella (ProductUpdate por SKU). Prueba primero con simulación o 1 SKU.</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <ActionButton variant="secondary" size="sm" disabled={busy} onClick={runPreview}>
                                <Eye className="w-4 h-4" /> Preview precios
                            </ActionButton>
                            <ActionButton variant="secondary" size="sm" disabled={busy} onClick={() => runActivate({ dryRun: true })}>
                                <FlaskConical className="w-4 h-4" /> Simular (dry-run)
                            </ActionButton>
                            <div className="inline-flex items-center gap-1">
                                <input className={input + " w-40"} value={oneSku} onChange={(e) => setOneSku(e.target.value)} placeholder="SKU de prueba" />
                                <ActionButton variant="secondary" size="sm" disabled={busy || !oneSku.trim()} onClick={() => runActivate({ onlySkus: [oneSku.trim()] })}>
                                    Aplicar 1 SKU
                                </ActionButton>
                            </div>
                            <ActionButton variant="primary" size="sm" disabled={busy || detail.status === "finished"} onClick={() => { if (window.confirm("¿Aplicar la campaña COMPLETA a Falabella? Se enviará un ProductUpdate por cada SKU.")) runActivate({}); }}>
                                <Play className="w-4 h-4" /> Aplicar todo
                            </ActionButton>
                            {detail.status === "active" && (
                                <ActionButton variant="secondary" size="sm" disabled={busy} onClick={() => { if (window.confirm("¿Finalizar la campaña ahora? Se expirará el precio especial de cada SKU en Falabella.")) runFinish(); }}>
                                    <Square className="w-4 h-4" /> Finalizar ahora
                                </ActionButton>
                            )}
                        </div>

                        {applyResult && (
                            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                                <div className="font-semibold mb-1">{applyResult.dry_run ? "Simulación" : "Resultado"} — total {applyResult.total}, ok {applyResult.applied ?? applyResult.expired ?? 0}, errores {applyResult.errors}</div>
                                <div className="max-h-48 overflow-auto space-y-0.5">
                                    {applyResult.results.map((r) => (
                                        <div key={r.sku} className="flex gap-2">
                                            <span className="font-mono">{r.sku}</span>
                                            <span className={r.status === "error" ? "text-rose-600" : "text-gray-600"}>{r.status}</span>
                                            {r.error && <span className="text-rose-500 truncate">{r.error}</span>}
                                            {r.would_send && <span className="text-gray-400 truncate">{JSON.stringify(r.would_send)}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Preview de precios */}
                {preview && (
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-100">Preview de precios{preview.discount_pct != null ? ` (-${preview.discount_pct}% global)` : ""}</div>
                        <DataTable data={preview.items} columns={previewColumns} showStatusBorder={false} />
                    </div>
                )}
                </>
                )}
            </div>
        </div>
    );
}
