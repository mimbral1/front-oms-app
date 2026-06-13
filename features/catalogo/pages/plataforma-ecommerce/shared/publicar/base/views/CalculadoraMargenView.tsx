// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/views/CalculadoraMargenView.tsx
//
// Vista standalone de la calculadora de margen (item "Calculadora de margen"
// del sidebar OPERACIÓN). Decisión #6 del MIGRATION_PLAN: mismo componente
// como widget embebido + página standalone con prop `mode`.
//
// Ramifica por marketplace:
//   - Falabella → calculadora REAL contra el backend (comisión por categoría +
//     cofinanciamiento con peso volumétrico). SKU + picker de categoría + dims.
//   - ML / otros → quick-calc manual client-side (placeholder; el cálculo ML
//     completo vive en el modal del wizard/editor).
//
// Look OMS: EcommercePageHeader + Card + ActionButton.

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Calculator as CalculatorIcon,
    Loader2,
    Search,
} from "lucide-react";

import { Card, ActionButton } from "@/components/ui";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useAuth } from "@/app/context/auth/AuthContext";
import { resolveMarketplaceKey } from "../../../productos/base/utils/marketplace";
import { useCatalogoList } from "../../../catalogo/base/hooks/useCatalogoList";
import type { MarketplaceProduct } from "../../../catalogo/base/types/catalogo-types";
import { FeedStatusCard } from "../../../feeds/base/FeedStatusCard";
import {
    CalculadoraMargenPanel,
    type CalculadoraModalSnapshot,
} from "../components/CalculadoraMargenModal";
import {
    cambiarPrecioMl,
    cambiarPrecioFala,
    fetchHistorialPrecio,
    fetchHistorialPrecioFala,
    CalculadoraError,
    type HistorialPrecioEntry,
} from "@/features/catalogo/services/calculadoraMargen";

export interface CalculadoraMargenViewProps {
    /** "standalone" = página completa, "embedded" = solo el form. */
    mode?: "standalone" | "embedded";
    /** SKU pre-rellenado (desde wizard o desde URL). */
    initialSku?: string;
    initialPrecio?: number;
}

/** Formatea CLP. "—" si no hay dato. */
function clp(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(Number(n))) return "—";
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(Number(n));
}

// ── Falabella: calculadora REAL (backend) ────────────────────────────────────

function FalabellaCalculadoraBody({ initialSku }: { initialSku: string }) {
    // useCatalogoList es platform-aware: con el marketplace Falabella activo,
    // lista productos Falabella (fal_skus) como MarketplaceProduct. Seedeamos la
    // búsqueda con el SKU de la URL si vino (?sku=).
    const { filteredRows, loading, searchAllLoading, filters, setFilters, error, reload } =
        useCatalogoList(initialSku ? { search: initialSku } : undefined);
    const { token, user } = useAuth();
    const userId = Number(user?.id) || 0;
    const userName = user?.nombre ?? null;
    const userEmail = user?.email ?? null;

    const [selected, setSelected] = useState<MarketplaceProduct | null>(null);
    const [pending, setPending] = useState<{ row: MarketplaceProduct; precio: number; utilidad: number | null } | null>(null);
    const [busyChange, setBusyChange] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);
    // feed_id del ProductUpdate en curso (Falabella es async). Mientras esté seteado,
    // mostramos FeedStatusCard que pollea hasta resolver.
    const [activeFeedId, setActiveFeedId] = useState<string | null>(null);

    const [histRows, setHistRows] = useState<HistorialPrecioEntry[]>([]);
    const [histLoading, setHistLoading] = useState(false);
    const [histError, setHistError] = useState<string | null>(null);
    const [histReloadKey, setHistReloadKey] = useState(0);

    // Tras un reload(), re-busca la fila seleccionada y refresca `selected` si el
    // precio cambió (para que el precio mostrado refleje el nuevo valor).
    useEffect(() => {
        if (!selected) return;
        const fresh = filteredRows.find((p) => p.sku === selected.sku);
        if (!fresh || fresh === selected) return;
        if (fresh.precio !== selected.precio || fresh.precio_original !== selected.precio_original) {
            setSelected(fresh);
        }
         
    }, [filteredRows, selected]);

    // Autoselección por match exacto de SKU (UX "busco el SKU → su detalle").
    const q = (filters.search ?? "").trim().toLowerCase();
    useEffect(() => {
        if (!q) return;
        const exact = filteredRows.find((p) => p.sku?.toLowerCase() === q);
        if (exact) setSelected(exact);
         
    }, [q, filteredRows]);

    // Historial de precio del SKU seleccionado. Recarga al cambiar de SKU o tras
    // un cambio de precio (histReloadKey bumped al resolver el feed).
    useEffect(() => {
        if (!selected) { setHistRows([]); return; }
        let alive = true;
        setHistLoading(true); setHistError(null);
        fetchHistorialPrecioFala(selected.sku, token)
            .then((rows) => { if (alive) setHistRows(rows); })
            .catch((e) => { if (alive) setHistError(e instanceof CalculadoraError ? e.message : (e as Error)?.message ?? "Error al cargar el historial"); })
            .finally(() => { if (alive) setHistLoading(false); });
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.sku, histReloadKey, token]);

    const busy = loading || searchAllLoading;
    const hasQuery = q.length > 0;

    // Falabella no usa item_id ML. La categoría sale de categoria_marketplace.id;
    // si es null, fcom la resuelve por fal_skus.fala_category_id (fallback backend).
    const buildSnapshot = (p: MarketplaceProduct): CalculadoraModalSnapshot => ({
        sku: p.sku,
        categoryId: p.categoria_marketplace?.id ?? null,
        currentPrice: Number(p.precio) || 0,
        itemId: null,
        largoRaw: null,
        anchoRaw: null,
        altoRaw: null,
        pesoRaw: null,
    });

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={filters.search ?? ""}
                        onChange={(e) => setFilters({ search: e.target.value })}
                        placeholder="Buscar por SKU o nombre…"
                        className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    />
                </div>
                {busy && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
                    </span>
                )}
            </div>

            {error && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <Card title="Productos publicados">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                <th className="text-left font-semibold py-2 pr-3">Producto</th>
                                <th className="text-right font-semibold py-2 px-3">Precio publicado</th>
                                <th className="text-right font-semibold py-2 pl-3">Calculadora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasQuery &&
                                filteredRows.map((p) => {
                                    const isSel = selected?.sku === p.sku;
                                    return (
                                        <tr
                                            key={p.sku}
                                            className={`border-b border-gray-100 last:border-0 ${isSel ? "bg-indigo-50/50" : ""}`}
                                        >
                                            <td className="py-2 pr-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {p.imagenes?.[0] ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={p.imagenes[0]} alt="" className="w-9 h-9 rounded object-cover bg-gray-100 shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded bg-gray-100 shrink-0" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="text-gray-900 truncate max-w-[360px]">{p.titulo}</div>
                                                        <div className="text-[11px] text-gray-400 tabular-nums">{p.sku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums text-gray-900"><PrecioConOferta row={p} /></td>
                                            <td className="py-2 pl-3 text-right">
                                                <ActionButton variant="secondary" onClick={() => { setSelected(p); setActiveFeedId(null); setOkMsg(null); setErr(null); }}>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <CalculatorIcon className="w-3.5 h-3.5" />
                                                        Calcular
                                                    </span>
                                                </ActionButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {!hasQuery && (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-sm text-gray-400">
                                        Busca un producto por SKU o nombre para calcular su margen.
                                    </td>
                                </tr>
                            )}
                            {hasQuery && !busy && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-10 text-center text-sm text-gray-400">
                                        No hay productos para esa búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                    Elige un producto para simular precio y margen. El envío usa el peso facturable =
                    max(peso real, largo×ancho×alto/4000); la comisión sale de la planilla Falabella por categoría.
                </p>
            </Card>

            {selected && (
                <Card title={`Cálculo — ${selected.titulo}`}>
                    <CalculadoraMargenPanel
                        snapshot={buildSnapshot(selected)}
                        marketplace="fala"
                        showConfirm
                        confirmLabel="Cambiar precio en Falabella"
                        onConfirm={(precio, meta) => {
                            setErr(null);
                            setOkMsg(null);
                            setActiveFeedId(null);
                            setPending({ row: selected, precio, utilidad: meta?.utilidad ?? null });
                        }}
                    />
                    {okMsg && (
                        <div className="mt-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{okMsg}</div>
                    )}
                    {activeFeedId && (
                        <div className="mt-3">
                            <FeedStatusCard
                                feedId={activeFeedId}
                                onResolved={() => { setOkMsg(null); setHistReloadKey((k) => k + 1); reload(); }}
                            />
                        </div>
                    )}
                </Card>
            )}

            {selected && (
                <Card title="Historial de precio">
                    {histLoading && <div className="py-6 text-center text-sm text-gray-400">Cargando…</div>}
                    {histError && (
                        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-center justify-between">
                            <span>{histError}</span>
                            <button type="button" className="underline" onClick={() => setHistReloadKey((k) => k + 1)}>Reintentar</button>
                        </div>
                    )}
                    {!histLoading && !histError && histRows.length === 0 && (
                        <div className="py-6 text-center text-sm text-gray-400">Sin cambios de precio registrados.</div>
                    )}
                    {!histLoading && !histError && histRows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                        <th className="text-left font-semibold py-2 pr-3">Fecha</th>
                                        <th className="text-right font-semibold py-2 px-3">Precio</th>
                                        <th className="text-left font-semibold py-2 px-3">Usuario</th>
                                        <th className="text-left font-semibold py-2 px-3">Estado</th>
                                        <th className="text-right font-semibold py-2 pl-3">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {histRows.map((h) => (
                                        <tr key={h.id} className="border-b border-gray-100 last:border-0">
                                            <td className="py-2 pr-3 text-gray-600 tabular-nums">{new Date(h.createdAt).toLocaleString("es-CL")}</td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                {h.precioOld != null && <span className="text-gray-400 line-through mr-1">{clp(h.precioOld)}</span>}
                                                <span className="font-medium text-gray-900">{clp(h.precioNew)}</span>
                                            </td>
                                            <td className="py-2 px-3 text-gray-600">{h.userName ?? "—"}</td>
                                            <td className="py-2 px-3 text-gray-600">{h.estado ?? "—"}</td>
                                            <td className="py-2 pl-3 text-right">
                                                {h.precioNew != null && (
                                                    <ActionButton variant="secondary" onClick={() => { setErr(null); setOkMsg(null); setActiveFeedId(null); setPending({ row: selected, precio: h.precioNew as number, utilidad: null }); }}>
                                                        Volver a este precio
                                                    </ActionButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {pending && (
                <ConfirmCambioPrecioModal
                    row={pending.row}
                    nuevoPrecio={pending.precio}
                    utilidad={pending.utilidad}
                    busy={busyChange}
                    error={err}
                    title="Cambiar precio en Falabella"
                    feedAsync
                    onCancel={() => { if (!busyChange) { setPending(null); setErr(null); } }}
                    onConfirm={async () => {
                        setBusyChange(true);
                        setErr(null);
                        try {
                            const r = await cambiarPrecioFala(pending.row.sku, pending.precio, { token, userId, userName, userEmail });
                            const newPrecio = pending.precio;
                            const sku = pending.row.sku;
                            setPending(null);
                            if (r.feed_id) {
                                setActiveFeedId(String(r.feed_id));
                                setOkMsg(`Cambio de precio de ${sku} a ${clp(newPrecio)} encolado (feed ${r.feed_id}). Sigue el estado abajo.`);
                            } else {
                                setOkMsg(`Cambio de precio de ${sku} enviado, pero no se obtuvo ID de feed; revísalo en el editor/bitácora.`);
                                setHistReloadKey((k) => k + 1);
                            }
                        } catch (e) {
                            setErr(e instanceof CalculadoraError ? e.message : (e as Error)?.message ?? "Error al cambiar el precio");
                        } finally {
                            setBusyChange(false);
                        }
                    }}
                />
            )}
        </div>
    );
}

// ── ML: precio con oferta + modal de confirmación ───────────────────────────

function PrecioConOferta({ row }: { row: MarketplaceProduct }) {
    const livePrice = getPrecioVivoMl(row);
    const originalPrice = getPrecioOriginalMl(row);
    const pct = getOfertaPctMl(row);
    const hasOffer = originalPrice != null && originalPrice > livePrice;
    if (!hasOffer) {
        return <span className="font-medium text-gray-900 tabular-nums">{clp(livePrice)}</span>;
    }
    return (
        <span className="inline-flex items-baseline gap-1.5">
            <span className="text-[11px] text-gray-400 line-through tabular-nums">{clp(originalPrice)}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{clp(livePrice)}</span>
            {pct != null && pct > 0 && (
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-md px-1.5 py-0.5 tabular-nums">
                    −{pct}%
                </span>
            )}
        </span>
    );
}

function getPrecioOfertaMl(row: MarketplaceProduct): number | null {
    const precio = Number(row.oferta_precio);
    if (row.tiene_oferta === true && Number.isFinite(precio) && precio > 0) {
        return precio;
    }
    if (
        row.tiene_oferta === true &&
        row.precio_original != null &&
        Number(row.precio_original) > Number(row.precio)
    ) {
        return Number(row.precio);
    }
    return null;
}

function getPrecioVivoMl(row: MarketplaceProduct): number {
    return getPrecioOfertaMl(row) ?? (Number(row.precio) || 0);
}

function getPrecioOriginalMl(row: MarketplaceProduct): number | null {
    const oferta = getPrecioOfertaMl(row);
    if (oferta == null) return null;
    const original =
        Number(row.oferta_precio_orig) ||
        Number(row.precio_original) ||
        Number(row.precio);
    return Number.isFinite(original) && original > oferta ? original : null;
}

function getOfertaPctMl(row: MarketplaceProduct): number | null {
    if (row.oferta_pct != null && Number(row.oferta_pct) > 0) {
        return Number(row.oferta_pct);
    }
    const oferta = getPrecioOfertaMl(row);
    const original = getPrecioOriginalMl(row);
    if (oferta == null || original == null || original <= 0) return null;
    return Math.round(((original - oferta) / original) * 100);
}

function ConfirmCambioPrecioModal({
    row, nuevoPrecio, utilidad, busy, error, onCancel, onConfirm,
    title = "Cambiar precio en ML",
    feedAsync = false,
}: {
    row: MarketplaceProduct;
    nuevoPrecio: number;
    utilidad: number | null;
    busy: boolean;
    error: string | null;
    onCancel: () => void;
    onConfirm: () => void;
    /** Título del modal. Default ML; Falabella pasa "Cambiar precio en Falabella". */
    title?: string;
    /** Falabella: muestra nota de feed-async en vez de la advertencia de deal ML. */
    feedAsync?: boolean;
}) {
    const livePrice = getPrecioVivoMl(row);
    const originalPrice = getPrecioOriginalMl(row);
    const hasOffer = originalPrice != null && originalPrice > livePrice;
    const base = hasOffer ? originalPrice! : livePrice;
    return (
        <div className="fixed inset-0 bg-gray-900/40 grid place-items-center z-50 p-4" onClick={() => !busy && onCancel()}>
            <div className="bg-white rounded-xl shadow-2xl max-w-[460px] w-full" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                    <p className="text-[12px] text-gray-500 mt-0.5">{row.titulo}</p>
                </div>
                <div className="px-5 py-4 space-y-3 text-sm">
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">Precio base actual</span><span className="tabular-nums">{clp(base)}</span></div>
                        {hasOffer && (
                            <div className="flex justify-between"><span className="text-gray-500">Oferta vigente</span><span className="tabular-nums">{clp(livePrice)}</span></div>
                        )}
                        <div className="flex justify-between font-semibold"><span>Nuevo precio base</span><span className="tabular-nums">{clp(nuevoPrecio)}</span></div>
                    </div>
                    {!feedAsync && hasOffer && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                            Cambias el <strong>precio base</strong>. Si hay un deal activo, ML puede bloquear el cambio (tendrías que quitar el deal primero en el Panel de Ofertas).
                        </div>
                    )}
                    {feedAsync && (
                        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] text-blue-800">
                            El cambio se encola como <strong>feed</strong> en Sellercenter (ProductUpdate). No es instantáneo: se confirma en unos minutos y verás el estado debajo del cálculo.
                        </div>
                    )}
                    {utilidad != null && utilidad < 0 && (
                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                            Este precio deja <strong>margen negativo</strong>.
                        </div>
                    )}
                    {error && (
                        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-[12px] text-rose-700">{error}</div>
                    )}
                </div>
                <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
                    <ActionButton variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</ActionButton>
                    <ActionButton variant="primary" onClick={onConfirm} disabled={busy}>
                        {busy ? "Cambiando…" : "Confirmar cambio"}
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

// ── ML: lista buscable → seleccionar → panel inline ─────────────────────────

function CalculadoraListBody() {
    const { filteredRows, loading, searchAllLoading, filters, setFilters, error, reload } =
        useCatalogoList();
    const { token, user } = useAuth();
    const userId = Number(user?.id) || 0;
    const userName = user?.nombre ?? null;
    const userEmail = user?.email ?? null;

    const [selected, setSelected] = useState<MarketplaceProduct | null>(null);
    const [pending, setPending] = useState<{ row: MarketplaceProduct; precio: number; utilidad: number | null } | null>(null);
    const [busyChange, setBusyChange] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const [histRows, setHistRows] = useState<HistorialPrecioEntry[]>([]);
    const [histLoading, setHistLoading] = useState(false);
    const [histError, setHistError] = useState<string | null>(null);
    const [histReloadKey, setHistReloadKey] = useState(0);

    // Tras un reload(), re-busca la fila seleccionada en filteredRows por
    // item_id/sku y refresca `selected` si el precio/oferta cambió, para que el
    // precio con oferta refleje el nuevo valor. Guard contra loops: solo
    // actualiza cuando algún campo relevante difiere.
    useEffect(() => {
        if (!selected) return;
        const fresh = filteredRows.find((p) =>
            selected.item_id
                ? p.item_id === selected.item_id
                : p.sku === selected.sku,
        );
        if (!fresh || fresh === selected) return;
        const changed =
            fresh.precio !== selected.precio ||
            fresh.precio_original !== selected.precio_original ||
            fresh.tiene_oferta !== selected.tiene_oferta ||
            fresh.oferta_precio !== selected.oferta_precio ||
            fresh.oferta_precio_orig !== selected.oferta_precio_orig ||
            fresh.oferta_pct !== selected.oferta_pct;
        if (changed) setSelected(fresh);
         
    }, [filteredRows, selected]);

    // Autoselección: si el texto buscado coincide EXACTO con un sku o item_id
    // (MLC) de los resultados, lo seleccionamos (UX "busco el SKU → su detalle").
    const q = (filters.search ?? "").trim().toLowerCase();
    useEffect(() => {
        if (!q) return;
        const exact = filteredRows.find(
            (p) =>
                p.sku?.toLowerCase() === q ||
                (p.item_id ?? "").toLowerCase() === q,
        );
        if (exact) setSelected(exact);
         
    }, [q, filteredRows]);

    // Historial de precio del SKU seleccionado. Se recarga al cambiar de SKU o
    // tras un cambio de precio (histReloadKey bumped en el modal onConfirm).
    useEffect(() => {
        if (!selected) { setHistRows([]); return; }
        let alive = true;
        setHistLoading(true); setHistError(null);
        fetchHistorialPrecio(selected.sku, token)
            .then((rows) => { if (alive) setHistRows(rows); })
            .catch((e) => { if (alive) setHistError(e instanceof CalculadoraError ? e.message : (e as Error)?.message ?? "Error al cargar el historial"); })
            .finally(() => { if (alive) setHistLoading(false); });
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.sku, histReloadKey, token]);

    const busy = loading || searchAllLoading;
    // La tabla queda vacía hasta que el usuario busca: no listamos todo el
    // catálogo de entrada, solo lo que se busca por SKU/MLC/nombre.
    const hasQuery = q.length > 0;

    const buildSnapshot = (p: MarketplaceProduct): CalculadoraModalSnapshot => ({
        sku: p.sku,
        categoryId: p.categoria_marketplace?.id ?? null,
        currentPrice: getPrecioVivoMl(p),
        // Precio que ve el comprador hoy: oferta si existe, si no precio base.
        itemPrice: getPrecioVivoMl(p),
        itemId: p.item_id ?? null,
        largoRaw: null,
        anchoRaw: null,
        altoRaw: null,
        pesoRaw: null,
    });

    return (
        <div className="px-6 pt-6 pb-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={filters.search ?? ""}
                        onChange={(e) => setFilters({ search: e.target.value })}
                        placeholder="Buscar por SKU, MLC o nombre…"
                        className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                    />
                </div>
                {busy && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
                    </span>
                )}
            </div>

            {error && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <Card title="Productos publicados">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                <th className="text-left font-semibold py-2 pr-3">Producto</th>
                                <th className="text-right font-semibold py-2 px-3">Precio publicado</th>
                                <th className="text-right font-semibold py-2 pl-3">Calculadora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hasQuery &&
                                filteredRows.map((p) => {
                                const isSel = selected?.item_id
                                    ? selected.item_id === p.item_id
                                    : selected?.sku === p.sku;
                                return (
                                    <tr
                                        key={p.item_id || p.sku}
                                        className={`border-b border-gray-100 last:border-0 ${isSel ? "bg-indigo-50/50" : ""}`}
                                    >
                                        <td className="py-2 pr-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {p.imagenes?.[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.imagenes[0]} alt="" className="w-9 h-9 rounded object-cover bg-gray-100 shrink-0" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded bg-gray-100 shrink-0" />
                                                )}
                                                <div className="min-w-0">
                                                    <div className="text-gray-900 truncate max-w-[360px]">{p.titulo}</div>
                                                    <div className="text-[11px] text-gray-400 tabular-nums">{p.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3 text-right tabular-nums text-gray-900"><PrecioConOferta row={p} /></td>
                                        <td className="py-2 pl-3 text-right">
                                            <ActionButton variant="secondary" onClick={() => setSelected(p)}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalculatorIcon className="w-3.5 h-3.5" />
                                                    Calcular
                                                </span>
                                            </ActionButton>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!hasQuery && (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center text-sm text-gray-400">
                                        Busca un producto por SKU, MLC o nombre para calcular su margen.
                                    </td>
                                </tr>
                            )}
                            {hasQuery && !busy && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-10 text-center text-sm text-gray-400">
                                        No hay productos para esa búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                    Elige un producto para simular precio y margen. El envío sale de la
                    publicación real de ML; la comisión, de la categoría.
                </p>
            </Card>

            {selected && (
                <Card title={`Cálculo — ${selected.titulo}`}>
                    <CalculadoraMargenPanel
                        snapshot={buildSnapshot(selected)}
                        marketplace="ml"
                        allowBackendDims
                        showConfirm
                        confirmLabel="Cambiar precio en ML"
                        onConfirm={(precio, meta) => {
                            setErr(null);
                            setOkMsg(null);
                            setPending({ row: selected, precio, utilidad: meta?.utilidad ?? null });
                        }}
                    />
                    {okMsg && (
                        <div className="mt-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">{okMsg}</div>
                    )}
                </Card>
            )}

            {selected && (
                <Card title="Historial de precio">
                    {histLoading && <div className="py-6 text-center text-sm text-gray-400">Cargando…</div>}
                    {histError && (
                        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700 flex items-center justify-between">
                            <span>{histError}</span>
                            <button type="button" className="underline" onClick={() => setHistReloadKey((k) => k + 1)}>Reintentar</button>
                        </div>
                    )}
                    {!histLoading && !histError && histRows.length === 0 && (
                        <div className="py-6 text-center text-sm text-gray-400">Sin cambios de precio registrados.</div>
                    )}
                    {!histLoading && !histError && histRows.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                        <th className="text-left font-semibold py-2 pr-3">Fecha</th>
                                        <th className="text-right font-semibold py-2 px-3">Precio</th>
                                        <th className="text-left font-semibold py-2 px-3">Usuario</th>
                                        <th className="text-left font-semibold py-2 px-3">Oferta</th>
                                        <th className="text-right font-semibold py-2 pl-3">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {histRows.map((h) => (
                                        <tr key={h.id} className="border-b border-gray-100 last:border-0">
                                            <td className="py-2 pr-3 text-gray-600 tabular-nums">{new Date(h.createdAt).toLocaleString("es-CL")}</td>
                                            <td className="py-2 px-3 text-right tabular-nums">
                                                {h.precioOld != null && <span className="text-gray-400 line-through mr-1">{clp(h.precioOld)}</span>}
                                                <span className="font-medium text-gray-900">{clp(h.precioNew)}</span>
                                            </td>
                                            <td className="py-2 px-3 text-gray-600">{h.userName ?? "—"}</td>
                                            <td className="py-2 px-3 text-gray-600">{h.oferta?.tiene_oferta ? (h.oferta.nombre || h.oferta.deal_ids?.[0] || "Sí") : "—"}</td>
                                            <td className="py-2 pl-3 text-right">
                                                {h.precioNew != null && (
                                                    <ActionButton variant="secondary" onClick={() => { setErr(null); setPending({ row: selected, precio: h.precioNew as number, utilidad: null }); }}>
                                                        Volver a este precio
                                                    </ActionButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {pending && (
                <ConfirmCambioPrecioModal
                    row={pending.row}
                    nuevoPrecio={pending.precio}
                    utilidad={pending.utilidad}
                    busy={busyChange}
                    error={err}
                    onCancel={() => { if (!busyChange) { setPending(null); setErr(null); } }}
                    onConfirm={async () => {
                        setBusyChange(true);
                        setErr(null);
                        try {
                            await cambiarPrecioMl(pending.row.sku, pending.precio, { token, userId, userName, userEmail });
                            setOkMsg(`Precio de ${pending.row.sku} actualizado a ${clp(pending.precio)}.`);
                            setPending(null);
                            await reload();
                            setHistReloadKey((k) => k + 1);
                        } catch (e) {
                            setErr(e instanceof CalculadoraError ? e.message : (e as Error)?.message ?? "Error al cambiar el precio");
                        } finally {
                            setBusyChange(false);
                        }
                    }}
                />
            )}
        </div>
    );
}

export function CalculadoraMargenView({
    mode = "standalone",
    initialSku,
}: CalculadoraMargenViewProps) {
    const platform = useEcommercePlatform();
    const searchParams = useSearchParams();

    const skuFromUrl = searchParams.get("sku") ?? initialSku ?? "";
    const marketplaceKey = resolveMarketplaceKey(platform.name);

    // Falabella conserva el form (aún no tiene enabler de auto-resolución de
    // dims). ML usa la lista buscable con margen por fila + modal.
    const body =
        marketplaceKey === "falabella" ? (
            <FalabellaCalculadoraBody initialSku={skuFromUrl} />
        ) : (
            <CalculadoraListBody />
        );

    if (mode === "embedded") return body;

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Herramientas`}
                title="Calculadora de margen"
            />
            <div className="flex-1 bg-gray-100">{body}</div>
        </div>
    );
}
