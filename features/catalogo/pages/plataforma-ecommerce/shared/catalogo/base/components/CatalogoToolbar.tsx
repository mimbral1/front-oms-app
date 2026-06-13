// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/components/CatalogoToolbar.tsx
//
// Toolbar OMS del catálogo: dropdown Estado + search + dropdown Calidad + view
// toggle (list/grid).
//
// 2026-05-18 — el filtro de Estado pasa de `<Tabs>` global a un `<select>`
// dropdown estilo OMS pedidos (consistencia con el resto del sistema, soporta
// más opciones sin saturar la barra: agregamos "Cerrados" y "En revisión").

"use client";

import { LayoutGrid, List, Loader2, Search } from "lucide-react";
import type {
    CatalogoListFilters,
    CatalogoStatusFilter,
    CatalogoViewMode,
    ReputationFilter,
} from "../types/catalogo-types";

export interface CatalogoToolbarProps {
    filters: CatalogoListFilters;
    total: number;
    viewMode: CatalogoViewMode;
    /** True cuando el modo "search across all pages" está cargando. */
    searchAllLoading?: boolean;
    /** True cuando ML reportó más SKUs de los que el cap de search permite cargar. */
    searchAllTruncated?: boolean;
    onChangeFilter: (next: Partial<CatalogoListFilters>) => void;
    onChangeViewMode: (mode: CatalogoViewMode) => void;
}

/**
 * Opciones del dropdown de Estado. Orden pensado para uso real del seller:
 *   1. Activos (caso típico, default)
 *   2. Pausados (segundo más usado)
 *   3. Cerrados (auditoría)
 *   4. En revisión (cuando ML está revisando)
 *   5. Sin publicar / Con errores (compat, no son estados ML reales)
 *   6. Todos
 */
const STATUS_OPTIONS: Array<{ value: CatalogoStatusFilter; label: string }> = [
    { value: "activos", label: "Activos" },
    { value: "pausados", label: "Pausados" },
    { value: "cerrados", label: "Cerrados" },
    { value: "en-revision", label: "En revisión" },
    { value: "sin-publicar", label: "Sin publicar" },
    { value: "con-errores", label: "Con errores" },
    { value: "todos", label: "Todos los estados" },
];

// "Catálogo" se separa al final porque NO es un level de calidad — es un tipo
// de publicación (catalog_listing=true en ML). Cuando el usuario lo elige,
// vemos SOLO esos items (ocultos en el default "todas"). Ver hook
// `useCatalogoList.filteredRows` para la lógica.
const QUALITY_OPTIONS: Array<{ value: ReputationFilter; label: string }> = [
    { value: "todas", label: "Calidad: todas" },
    { value: "green", label: "Buena" },
    { value: "yellow", label: "Regular" },
    { value: "red", label: "Mala" },
    { value: "catalogo", label: "Solo catálogo" },
];

const SELECT_CLASSES = [
    "h-9 px-3 text-sm border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm",
    "outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
    "appearance-none cursor-pointer pr-8",
    "bg-[url('data:image/svg+xml;utf8,<svg fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%221.5%22 viewBox=%220 0 20 20%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M5 8l5 5 5-5%22/></svg>')] bg-no-repeat bg-[right_8px_center] bg-[length:14px]",
].join(" ");

export function CatalogoToolbar({
    filters,
    total,
    viewMode,
    searchAllLoading = false,
    searchAllTruncated = false,
    onChangeFilter,
    onChangeViewMode,
}: CatalogoToolbarProps) {
    const searchActive = (filters.search ?? "").trim().length > 0;

    return (
        <div className="bg-white px-6 border-b border-gray-200 py-3 flex items-center gap-3 flex-wrap">
            {/* Search — busca cross-páginas cuando se activa (modo "search all") */}
            <div className="flex flex-col gap-0.5">
                <label
                    htmlFor="catalogo-search"
                    className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500"
                >
                    Buscar
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                        id="catalogo-search"
                        type="search"
                        value={filters.search ?? ""}
                        onChange={(e) => onChangeFilter({ search: e.target.value })}
                        placeholder="SKU, nombre o item id (todo el catálogo)…"
                        className="w-96 pl-9 pr-9 h-9 text-sm bg-white border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="Buscar en todo el catálogo"
                    />
                    {searchAllLoading && (
                        <Loader2
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 animate-spin"
                            aria-label="Cargando todas las páginas…"
                        />
                    )}
                </div>
            </div>

            {searchActive && searchAllTruncated && (
                <span
                    className="self-end mb-1 inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-medium ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200"
                    title="El catálogo es muy grande y solo cargamos las primeras 3.000 SKUs. Ajusta el filtro de estado para reducir el conjunto."
                >
                    Búsqueda truncada
                </span>
            )}

            {/* Estado dropdown — reemplaza las status tabs */}
            <div className="flex flex-col gap-0.5">
                <label
                    htmlFor="catalogo-estado"
                    className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500"
                >
                    Estado
                </label>
                <select
                    id="catalogo-estado"
                    value={filters.status ?? "activos"}
                    onChange={(e) =>
                        onChangeFilter({
                            status: e.target.value as CatalogoStatusFilter,
                        })
                    }
                    className={SELECT_CLASSES}
                    aria-label="Filtrar por estado de la publicación"
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Calidad de publicación (renombrado desde "Reputación") */}
            <div className="flex flex-col gap-0.5">
                <label
                    htmlFor="catalogo-calidad"
                    className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500"
                >
                    Calidad
                </label>
                <select
                    id="catalogo-calidad"
                    value={filters.reputation ?? "todas"}
                    onChange={(e) =>
                        onChangeFilter({
                            reputation: e.target.value as ReputationFilter,
                        })
                    }
                    className={SELECT_CLASSES}
                    aria-label="Filtrar por calidad de publicación"
                    title="Calidad mide cuán optimizada está la publicación clásica del seller. Los items de catálogo (content de la ficha ML compartida) se ven solo eligiendo 'Solo catálogo'."
                >
                    {QUALITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="ml-auto self-end mb-1 flex items-center gap-3 text-xs text-gray-500">
                <span className="tabular-nums">
                    {total.toLocaleString("es-CL")} ítem{total === 1 ? "" : "s"}
                </span>
                <div className="inline-flex border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => onChangeViewMode("list")}
                        className={[
                            "px-2.5 h-9 border-r border-gray-300 transition-colors grid place-items-center",
                            viewMode === "list"
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-500 hover:bg-gray-50",
                        ].join(" ")}
                        aria-label="Vista lista"
                        aria-pressed={viewMode === "list"}
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeViewMode("grid")}
                        className={[
                            "px-2.5 h-9 transition-colors grid place-items-center",
                            viewMode === "grid"
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-500 hover:bg-gray-50",
                        ].join(" ")}
                        aria-label="Vista grid"
                        aria-pressed={viewMode === "grid"}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
