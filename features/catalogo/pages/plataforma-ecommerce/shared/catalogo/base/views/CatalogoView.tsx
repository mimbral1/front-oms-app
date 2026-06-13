// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/views/CatalogoView.tsx
//
// Vista Catálogo — única source of truth para listar productos de un marketplace.
// Reemplaza progresivamente a `MarketplaceProductosBrowse` (legacy en `productos/`)
// hasta su deprecación en Fase 9 del MIGRATION_PLAN.
//
// Look OMS pleno: EcommercePageHeader + Tabs global + Toolbar + ActionButton.
//
// 2026-05-18 — cambios UX:
//   - Status filters movidos del Toolbar a una fila <Tabs> separada (consistente
//     con Editor + Ofertas detail).
//   - Default tab "Activos" (antes era "Todos").
//   - Search ahora busca cross-pages (modo "search all" del hook).
//   - Paginación oculta cuando hay query de search (la búsqueda devuelve TODO).

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, RefreshCw, Upload } from "lucide-react";

import { ActionButton } from "@/components/ui";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useCatalogoList } from "../hooks/useCatalogoList";
import { CatalogoToolbar } from "../components/CatalogoToolbar";
import { CatalogoTable } from "../components/CatalogoTable";
import { CatalogoPagination } from "../components/CatalogoPagination";
import type {
    CatalogoViewMode,
    MarketplaceProduct,
} from "../types/catalogo-types";

export function CatalogoView() {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<CatalogoViewMode>("list");

    const {
        filteredRows,
        rows,
        total,
        page,
        pageSize,
        filters,
        loading,
        searchAllLoading,
        searchAllTruncated,
        isSearchActive,
        error,
        setFilters,
        setPage,
        reload,
    } = useCatalogoList();

    const handleRowClick = useCallback(
        (row: MarketplaceProduct) => {
            // Click en cualquier fila → editor del producto (Fase 7).
            router.push(`${platform.basePath}/editor/${encodeURIComponent(row.sku)}`);
        },
        [platform.basePath, router],
    );

    const handleExport = useCallback(() => {
        // Exporta filas filtradas a CSV en cliente (sin pegar al backend).
        const headers = ["sku", "item_id", "titulo", "precio", "stock", "estado"];
        const lines = filteredRows.map((r) =>
            [r.sku, r.item_id, r.titulo, r.precio, r.stock, r.estado]
                .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                .join(","),
        );
        const csv = `${headers.join(",")}\n${lines.join("\n")}`;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `catalogo-${platform.exportPrefix}-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredRows, platform.exportPrefix]);

    const handleImport = useCallback(() => {
        router.push(`${platform.basePath}/carga-masiva`);
    }, [platform.basePath, router]);

    const handleNewSku = useCallback(() => {
        router.push(`${platform.basePath}/publicar`);
    }, [platform.basePath, router]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            {/* Header + filtros sticky: quedan fijos al hacer scroll del listado */}
            <div className="sticky top-0 z-30 bg-white shadow-sm">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Marketplace`}
                title="Catálogo"
                badge={
                    total > 0
                        ? {
                              label: `${total.toLocaleString("es-CL")} SKUs`,
                              tone: "live",
                          }
                        : undefined
                }
                actions={
                    <>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={reload}
                            disabled={loading || searchAllLoading}
                        >
                            <RefreshCw className="w-4 h-4" />
                            {loading || searchAllLoading ? "Cargando…" : "Actualizar"}
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={handleExport}
                            disabled={filteredRows.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            Exportar
                        </ActionButton>
                        <ActionButton
                            variant="success"
                            size="sm"
                            onClick={handleImport}
                        >
                            <Upload className="w-4 h-4" />
                            Importar Excel
                        </ActionButton>
                        <ActionButton
                            variant="primary"
                            size="sm"
                            onClick={handleNewSku}
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo SKU
                        </ActionButton>
                    </>
                }
            />

            <CatalogoToolbar
                filters={filters}
                total={filteredRows.length}
                viewMode={viewMode}
                searchAllLoading={searchAllLoading}
                searchAllTruncated={searchAllTruncated}
                onChangeFilter={setFilters}
                onChangeViewMode={setViewMode}
            />
            </div>

            {error && (
                <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center justify-between">
                    <span>
                        <strong>Error:</strong> {error}
                    </span>
                    <button
                        type="button"
                        onClick={reload}
                        className="text-rose-700 hover:underline font-medium"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <div className="flex-1 bg-gray-100 px-6 py-6">
                {viewMode === "list" ? (
                    <CatalogoTable
                        rows={filteredRows}
                        loading={loading || (searchAllLoading && rows.length === 0)}
                        error={null /* error ya se muestra arriba */}
                        onRowClick={handleRowClick}
                    />
                ) : (
                    <CatalogoGrid
                        rows={filteredRows}
                        loading={loading || (searchAllLoading && rows.length === 0)}
                        onRowClick={handleRowClick}
                    />
                )}
            </div>

            {/* En modo search activa NO paginamos — la búsqueda ya filtra todo el catálogo. */}
            {!isSearchActive && (
                <CatalogoPagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={setPage}
                />
            )}
        </div>
    );
}

/**
 * Vista grid — implementación mínima. Mostrada cuando el usuario clickea el
 * toggle de "grid view" en el toolbar.
 */
function CatalogoGrid({
    rows,
    loading,
    onRowClick,
}: {
    rows: MarketplaceProduct[];
    loading: boolean;
    onRowClick?: (row: MarketplaceProduct) => void;
}) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm shadow-sm">
                Cargando…
            </div>
        );
    }
    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500 text-sm shadow-sm">
                Sin productos
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rows.map((row) => (
                <button
                    key={row.sku}
                    type="button"
                    onClick={() => onRowClick?.(row)}
                    className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-blue-400 hover:shadow-md transition"
                >
                    <div className="aspect-square rounded-md bg-gray-100 mb-2 overflow-hidden">
                        {row.imagenes?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={row.imagenes[0]}
                                alt={row.titulo}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : null}
                    </div>
                    <div className="text-xs tabular-nums text-gray-500">
                        {row.sku}
                    </div>
                    <div
                        className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em]"
                        title={row.titulo}
                    >
                        {row.titulo}
                    </div>
                    <div className="mt-1 text-sm tabular-nums text-gray-900">
                        ${row.precio?.toLocaleString("es-CL") ?? 0}
                    </div>
                </button>
            ))}
        </div>
    );
}
