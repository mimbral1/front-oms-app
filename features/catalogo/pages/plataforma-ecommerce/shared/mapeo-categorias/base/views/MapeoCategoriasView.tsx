// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/views/MapeoCategoriasView.tsx
//
// Vista de mapeo de categorías. Layout split: 260px tree + 1fr detail.
// Patrón visual: `Mimbral Mercadolibre/categorias.html`.

"use client";

import { useMemo } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { JanisTopBar, PillBtn } from "../../../../_shared/janis";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useCategoriasTree } from "../hooks/useCategoriasTree";
import { CategoriasTree } from "../components/CategoriasTree";
import { CategoriaDetalle } from "../components/CategoriaDetalle";
import type { CategoriaNodo } from "../types/mapeo-categorias-types";

/**
 * Encuentra la ruta de un N3 dentro del árbol. Devuelve [N1, N2, N3] o null.
 */
function findBreadcrumb(
    nodes: CategoriaNodo[],
    targetN3: string,
): CategoriaNodo[] | null {
    for (const n1 of nodes) {
        for (const n2 of n1.subcategorias ?? []) {
            for (const n3 of n2.subcategorias ?? []) {
                if (String(n3.id) === targetN3) {
                    return [n1, n2, n3];
                }
            }
        }
    }
    return null;
}

export function MapeoCategoriasView() {
    const platform = useEcommercePlatform();
    const {
        tree,
        filteredTree,
        loading,
        error,
        search,
        setSearch,
        expanded,
        toggle,
        selectedN3Id,
        setSelectedN3Id,
        reload,
    } = useCategoriasTree();

    const breadcrumb = useMemo<CategoriaNodo[]>(() => {
        if (!selectedN3Id) return [];
        return findBreadcrumb(tree, selectedN3Id) ?? [];
    }, [selectedN3Id, tree]);

    const n3Selected = breadcrumb[breadcrumb.length - 1] ?? null;

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <JanisTopBar
                eyebrow={`${platform.name} · Marketplace`}
                title="Mapeo de categorías"
                badge={
                    loading
                        ? undefined
                        : error
                          ? { label: "Error", tone: "error" }
                          : { label: "Sincronizado", tone: "active" }
                }
                actions={
                    <>
                        <PillBtn
                            variant="ghost"
                            onClick={reload}
                            disabled={loading}
                            icon={<RefreshCw className="w-4 h-4" />}
                        >
                            {loading ? "Cargando…" : "Refrescar árbol"}
                        </PillBtn>
                        <PillBtn
                            variant="primary"
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Nuevo mapeo
                        </PillBtn>
                    </>
                }
            />

            <div className="flex-1 grid grid-cols-[260px_1fr] overflow-hidden bg-white">
                {/* Tree sidebar */}
                <aside className="bg-white border-r border-gray-200 overflow-auto py-3">
                    <div className="px-3 mb-2">
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar categoría…"
                            className="w-full h-7 px-2 text-[12px] bg-gray-50 border border-gray-200 rounded outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>
                    <CategoriasTree
                        nodes={filteredTree}
                        expanded={expanded}
                        selectedN3Id={selectedN3Id}
                        onToggle={toggle}
                        onSelect={setSelectedN3Id}
                        loading={loading}
                        error={error}
                    />
                </aside>

                {/* Detail */}
                <main className="overflow-auto bg-[#f3f4f6]">
                    <CategoriaDetalle breadcrumb={breadcrumb} n3={n3Selected} />
                </main>
            </div>
        </div>
    );
}
