// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/OfertaItems.tsx
//
// Tab "ÍTEMS" del detail view. Presentational: lista los SKUs de la campaña
// (una página a la vez, server-side por status) con su descuento, precio nuevo,
// stock comprometido y status individual.
//
// El wiring (conteos de header, toggle de status server-side, búsqueda
// desacoplada contra el catálogo) vive en `OfertasDetailView` y baja por props.
// Este componente NO hace fetch ni filtra client-side: solo renderiza.
//
// Look OMS: container white rounded-xl + table bordered + search OMS, sin pills
// de color en el header.

"use client";

import { RefreshCw, Search } from "lucide-react";
import type { CampaignSku } from "../types/oferta-types";
import type { ItemStatusFilter } from "../hooks/useOfertaItems";
import type { PromotionCounts } from "../hooks/usePromotionCounts";
import type { RawPromotionItem } from "../api/ofertas-api";
import type { ProductMatch } from "../types/elegibilidad-types";

/** Resultado de la búsqueda desacoplada: catálogo + estado en ESTA campaña. */
export interface OfertaSearchFound {
    match: ProductMatch;
    promo: RawPromotionItem;
}

export interface OfertaItemsProps {
    /**
     * Items de la página actual (acumulados con "Cargar más"). Vienen del hook
     * `useOfertaItems` que pagina server-side por `statusItem` + cross-ref con
     * el catálogo. NO de `oferta.skus`, que está vacío por design.
     */
    items: ReadonlyArray<CampaignSku>;
    /** True mientras corre el primer fetch — muestra skeleton. */
    initialLoading?: boolean;
    /** True mientras carga una página adicional ("Cargar más"). */
    loadingMore?: boolean;
    /** Mensaje de error fatal (impide mostrar la lista). */
    error?: string | null;
    /** True cuando hay más páginas que traer. */
    hasMore?: boolean;
    /** Trae la siguiente página. */
    onLoadMore?: () => void;
    /** Callback para re-fetch (botón "Reintentar" del error). */
    onReload?: () => void;

    // ── Conteos del header (independientes de los items cargados) ──────────────
    /** Conteos baratos provistos por `usePromotionCounts`. `null` mientras carga. */
    counts: PromotionCounts | null;

    // ── Filtro server-side ─────────────────────────────────────────────────────
    /** Status server-side activo. */
    statusItem: ItemStatusFilter;
    /** Cambia el status server-side (re-fetch desde la primera página). */
    onChangeStatus: (s: ItemStatusFilter) => void;

    // ── Búsqueda desacoplada ───────────────────────────────────────────────────
    /** Query controlado del buscador. */
    searchQuery: string;
    /** Actualiza el texto del buscador (sin disparar la búsqueda). */
    onSearchQueryChange: (q: string) => void;
    /** Dispara la búsqueda contra el catálogo (Enter o botón "Buscar"). */
    onSearchSubmit: () => void;
    /** Limpia la búsqueda y restaura la tabla paginada. */
    onSearchClear: () => void;
    /** True mientras corre la búsqueda contra el catálogo. */
    searching?: boolean;
    /** Error de la búsqueda. */
    searchError?: string | null;
    /**
     * Resultados de la búsqueda. `null` = no hay búsqueda activa (mostrar tabla).
     * `[]` = búsqueda hecha sin coincidencias en esta campaña.
     */
    searchResults: ReadonlyArray<OfertaSearchFound> | null;
}

const HEADER = [
    "text-xs uppercase tracking-wider text-gray-500 font-semibold",
    "py-3 px-3 bg-gray-50 border-b border-gray-200 text-left",
].join(" ");

const CELL = "py-2.5 px-3 border-b border-gray-100 align-middle";

/** Estado del item en ESTA campaña (a partir del status crudo de ML). */
function promoStatusLabel(status: RawPromotionItem["status"]): string {
    switch (status) {
        case "started":
            return "Participa";
        case "candidate":
            return "Puede optar";
        case "pending":
            return "Programada";
        case "finished":
            return "Finalizada";
        default:
            return status;
    }
}

export function OfertaItems({
    items,
    initialLoading = false,
    loadingMore = false,
    error = null,
    hasMore = false,
    onLoadMore,
    onReload,
    counts,
    statusItem,
    onChangeStatus,
    searchQuery,
    onSearchQueryChange,
    onSearchSubmit,
    onSearchClear,
    searching = false,
    searchError = null,
    searchResults,
}: OfertaItemsProps) {
    const searchActive = searchResults !== null || searching || !!searchError;

    return (
        <div className="px-6 pt-6 pb-10">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header: conteos (de usePromotionCounts) + toggle + buscador */}
                <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-4 flex-wrap">
                    <CountItem label="Total" value={counts?.inscritos} />
                    <CountItem label="Activos" value={counts?.active} />
                    <CountItem label="Pausados" value={counts?.paused} />
                    {/* Elegibles: ocultar el chip si es null. */}
                    {counts && counts.candidate != null && (
                        <CountItem label="Elegibles" value={counts.candidate} />
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        <form
                            className="relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSearchSubmit();
                            }}
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => onSearchQueryChange(e.target.value)}
                                placeholder="Buscar SKU / MLC / nombre…"
                                className="w-60 pl-9 pr-3 h-9 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </form>
                        <button
                            type="button"
                            onClick={onSearchSubmit}
                            disabled={searching || !searchQuery.trim()}
                            className="px-3 h-9 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {searching ? "Buscando…" : "Buscar"}
                        </button>
                        {searchActive && (
                            <button
                                type="button"
                                onClick={onSearchClear}
                                className="px-3 h-9 text-sm border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {searchActive ? (
                    <SearchResults
                        searching={searching}
                        searchError={searchError}
                        results={searchResults}
                    />
                ) : (
                    <PaginatedTable
                        items={items}
                        initialLoading={initialLoading}
                        loadingMore={loadingMore}
                        error={error}
                        hasMore={hasMore}
                        onLoadMore={onLoadMore}
                        onReload={onReload}
                        statusItem={statusItem}
                        onChangeStatus={onChangeStatus}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Tabla paginada (tab normal, sin búsqueda activa) ─────────────────────────

function PaginatedTable({
    items,
    initialLoading,
    loadingMore,
    error,
    hasMore,
    onLoadMore,
    onReload,
    statusItem,
    onChangeStatus,
}: {
    items: ReadonlyArray<CampaignSku>;
    initialLoading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    onLoadMore?: () => void;
    onReload?: () => void;
    statusItem: ItemStatusFilter;
    onChangeStatus: (s: ItemStatusFilter) => void;
}) {
    return (
        <>
            {/* Toggle de status server-side: Activos / Pausados */}
            <div className="px-5 py-2.5 border-b border-gray-200 flex items-center gap-2">
                <div className="inline-flex border border-gray-300 rounded-md overflow-hidden bg-white">
                    {(["active", "paused"] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onChangeStatus(s)}
                            className={[
                                "px-4 h-9 text-xs border-r border-gray-300 last:border-r-0 transition-colors",
                                statusItem === s
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-600 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            {s === "active" ? "Activos" : "Pausados"}
                        </button>
                    ))}
                </div>
                {loadingMore && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400" />
                )}
            </div>

            {error && (
                <div className="px-5 py-2 border-b border-gray-200 bg-rose-50 text-xs text-rose-800 flex items-center gap-3 flex-wrap">
                    <span>
                        <strong>Error:</strong> {error}
                    </span>
                    {onReload && (
                        <button
                            type="button"
                            onClick={onReload}
                            className="underline hover:no-underline"
                        >
                            Reintentar
                        </button>
                    )}
                </div>
            )}

            {/* Estados sin tabla: skeleton inicial / vacío */}
            {initialLoading && items.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    <RefreshCw className="w-4 h-4 inline-block mr-2 animate-spin" />
                    Cargando items de la campaña…
                </div>
            ) : items.length === 0 && !error ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                    {statusItem === "active"
                        ? "Esta campaña no tiene items activos."
                        : "Esta campaña no tiene items pausados."}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className={HEADER + " w-9"} />
                                    <th className={HEADER}>SKU / Producto</th>
                                    <th className={HEADER + " text-right w-24"}>
                                        Precio orig.
                                    </th>
                                    <th className={HEADER + " text-right w-20"}>Desc.</th>
                                    <th className={HEADER + " text-right w-24"}>
                                        Precio nuevo
                                    </th>
                                    <th className={HEADER + " text-right w-20"}>Stock</th>
                                    <th className={HEADER + " text-right w-24"}>
                                        Comprometido
                                    </th>
                                    <th className={HEADER + " text-center w-28"}>
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((sku) => (
                                    <ItemRow key={sku.item_id} sku={sku} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* "Cargar más": paginación incremental server-side */}
                    {hasMore && (
                        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
                            <button
                                type="button"
                                onClick={onLoadMore}
                                disabled={loadingMore}
                                className="inline-flex items-center gap-2 px-4 h-9 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loadingMore && (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                )}
                                {loadingMore ? "Cargando…" : "Cargar más"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

// ─── Resultados de búsqueda desacoplada ───────────────────────────────────────

function SearchResults({
    searching,
    searchError,
    results,
}: {
    searching: boolean;
    searchError: string | null;
    results: ReadonlyArray<OfertaSearchFound> | null;
}) {
    if (searching) {
        return (
            <div className="p-8 text-center text-gray-500 text-sm">
                <RefreshCw className="w-4 h-4 inline-block mr-2 animate-spin" />
                Buscando en el catálogo…
            </div>
        );
    }
    if (searchError) {
        return (
            <div className="p-6 text-sm text-rose-800 bg-rose-50">
                <strong>Error en la búsqueda:</strong> {searchError}
            </div>
        );
    }
    if (!results || results.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 text-sm">
                No se encontró el producto en esta campaña.
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {results.map(({ match, promo }) => {
                const orig = promo.original_price ?? 0;
                const price = promo.price ?? 0;
                return (
                    <div
                        key={promo.id + (match.itemId ?? match.sku)}
                        className="px-5 py-3 flex items-center gap-4 flex-wrap"
                    >
                        <div className="flex-1 min-w-[220px]">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 tabular-nums">
                                    {match.sku || match.itemId}
                                </span>
                                {match.itemId && match.itemId !== match.sku && (
                                    <code className="text-[11px] font-medium text-gray-600 bg-slate-100 rounded-md px-1.5 py-0.5 tabular-nums">
                                        {match.itemId}
                                    </code>
                                )}
                            </div>
                            <div
                                className="text-xs text-gray-500 truncate max-w-[320px]"
                                title={match.titulo}
                            >
                                {match.titulo}
                            </div>
                        </div>
                        <div className="text-sm text-gray-700">
                            <span className="text-xs uppercase tracking-wide font-semibold text-gray-500 mr-1.5">
                                Estado
                            </span>
                            {promoStatusLabel(promo.status)}
                        </div>
                        <div className="text-right tabular-nums">
                            <div className="text-xs text-gray-500">
                                Original ${orig.toLocaleString("es-CL")}
                            </div>
                            <div className="text-sm font-semibold text-blue-700">
                                Oferta ${price.toLocaleString("es-CL")}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ItemRow({ sku }: { sku: CampaignSku }) {
    return (
        <tr className="hover:bg-gray-50">
            <td className={CELL}>
                {sku.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={sku.image}
                        alt={sku.name}
                        loading="lazy"
                        className="w-8 h-8 rounded-md object-cover ring-1 ring-gray-200"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-md bg-gray-100 ring-1 ring-gray-200" />
                )}
            </td>
            <td className={CELL}>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 tabular-nums">
                        {sku.sku}
                    </span>
                    {/* Un SKU SAP puede tener varias publicaciones ML (catalog
                        listings, variantes). Mostramos el item_id MLC abajo
                        para que el seller distinga cada fila aunque el SKU
                        SAP se repita en el listado. */}
                    {sku.item_id && sku.item_id !== sku.sku && (
                        <code className="text-[11px] font-medium text-gray-600 bg-slate-100 rounded-md px-1.5 py-0.5 tabular-nums">
                            {sku.item_id}
                        </code>
                    )}
                </div>
                <div
                    className="text-xs text-gray-500 truncate max-w-[280px]"
                    title={sku.name}
                >
                    {sku.name}
                </div>
            </td>
            <td className={CELL + " text-right tabular-nums text-gray-700"}>
                ${sku.price.toLocaleString("es-CL")}
            </td>
            <td className={CELL + " text-right tabular-nums text-gray-900"}>
                {sku.discount}%
            </td>
            <td className={CELL + " text-right tabular-nums font-semibold text-blue-700"}>
                ${sku.new_price.toLocaleString("es-CL")}
            </td>
            <td className={CELL + " text-right tabular-nums text-gray-900"}>
                {sku.stock.toLocaleString("es-CL")}
            </td>
            <td className={CELL + " text-right tabular-nums text-gray-700"}>
                {sku.stock_committed != null
                    ? sku.stock_committed.toLocaleString("es-CL")
                    : "—"}
            </td>
            <td className={CELL + " text-center"}>
                <ItemStatusPill status={sku.status} />
            </td>
        </tr>
    );
}

function ItemStatusPill({ status }: { status: CampaignSku["status"] }) {
    // Mapa que cubre los 7 estados del lifecycle ML.
    const map: Record<
        CampaignSku["status"],
        { label: string; bg: string }
    > = {
        active: {
            label: "Activo",
            bg: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        },
        paused: {
            label: "Pausado",
            bg: "bg-amber-50 text-amber-700 ring-amber-200",
        },
        finished: {
            label: "Finalizado",
            bg: "bg-slate-50 text-slate-600 ring-slate-200",
        },
        candidate: {
            label: "Candidato",
            bg: "bg-blue-50 text-blue-700 ring-blue-200",
        },
        pending: {
            label: "Pendiente",
            bg: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        },
        sync_requested: {
            label: "Activando…",
            bg: "bg-cyan-50 text-cyan-700 ring-cyan-200",
        },
        restore_requested: {
            label: "Eliminando…",
            bg: "bg-rose-50 text-rose-700 ring-rose-200",
        },
    };
    const m = map[status] ?? map.active;
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${m.bg}`}
        >
            {m.label}
        </span>
    );
}

function CountItem({ label, value }: { label: string; value?: number | null }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                {label}
            </span>
            <span className="text-base font-semibold tabular-nums text-gray-900">
                {value != null ? value.toLocaleString("es-CL") : "—"}
            </span>
        </div>
    );
}
