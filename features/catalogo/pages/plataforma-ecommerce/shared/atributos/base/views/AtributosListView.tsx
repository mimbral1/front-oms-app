// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/views/AtributosListView.tsx
//
// Vista de LISTADO de atributos maestros. Replica el TAB 1 ("Mis Atributos")
// del monolito `atributos.ts`, pero con chrome Janis y consumiendo
// `useFetchWithAuthPim` en vez de `fetch` directo.
//
// Patrón shared/<feature>/base/ — la misma vista se reexporta desde
// `<mkt>/atributos/index.ts` con alias `Meli*`, `Fala*`, `Vtex*`.

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { RefreshCw, Plus } from "lucide-react";
import { JanisTopBar, PillBtn } from "../../../../_shared/janis";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useAtributosList } from "../hooks/useAtributosList";
import { AtributosListToolbar } from "../components/AtributosListToolbar";
import { AtributosTable } from "../components/AtributosTable";
import { AtributosPagination } from "../components/AtributosPagination";

export function AtributosListView() {
    const router = useRouter();
    const platform = useEcommercePlatform();

    const {
        rows,
        total,
        page,
        pageSize,
        filters,
        loading,
        error,
        setFilters,
        setPageSize,
        setPage,
        reload,
    } = useAtributosList();

    const handleRowClick = useCallback(
        (row: { id: number }) => {
            router.push(`${platform.basePath}/atributos/${row.id}`);
        },
        [platform.basePath, router],
    );

    const handleNew = useCallback(() => {
        router.push(`${platform.basePath}/atributos/nuevo`);
    }, [platform.basePath, router]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <JanisTopBar
                eyebrow={`${platform.name} · Catálogo`}
                title="Atributos"
                badge={
                    total > 0
                        ? { label: `${total.toLocaleString("es-CL")} atributos`, tone: "active" }
                        : undefined
                }
                actions={
                    <>
                        <PillBtn
                            variant="ghost"
                            onClick={reload}
                            icon={<RefreshCw className="w-4 h-4" />}
                        >
                            Refrescar
                        </PillBtn>
                        <PillBtn
                            variant="primary"
                            onClick={handleNew}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Nuevo atributo
                        </PillBtn>
                    </>
                }
            />

            <AtributosListToolbar
                filters={filters}
                pageSize={pageSize}
                onChangeFilter={setFilters}
                onChangePageSize={setPageSize}
                rightSummary={
                    total > 0
                        ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total.toLocaleString("es-CL")}`
                        : null
                }
            />

            <div className="flex-1 bg-[#f3f4f6] px-6 py-6">
                <AtributosTable
                    rows={rows}
                    loading={loading}
                    error={error}
                    onRowClick={handleRowClick}
                />
            </div>

            <AtributosPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
            />
        </div>
    );
}
