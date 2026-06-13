// views\Customers\Reportes\ClientesPorCategoria\TopClientesPorCategoriaView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { DataTable } from "@/components/ui/table";
import {
    getTopClientesPorCategoria,
    getCategoriasFiltro,
} from "@/app/fetchWithAuth/api-clientes/reportes/api-top-clientes-categoria";
import { Pagination } from "@/components/ui/pagination";

/* ============================================================
   Tipos
============================================================ */

interface TopCliente {
    clientId: string;
    clientName: string;
    category: string;
    brand: string;
    salesChannelId: string;
    salesChannelName: string;
    totalSales: number;
    totalOrders: number;
    verified: boolean;
    modifiedAt: string;
    sellerName: string;
    sellerEmail: string;
    // status: "Activo" | "Inactivo";
}

type Opt = { label: string; value: string };

/* ============================================================
   Helpers UI
============================================================ */

const formatMoney = (value: number) =>
    value.toLocaleString("es-CL");

/* ============================================================
   Filtros
============================================================ */

interface Filters {
    category: string;
    brand: string;
    salesChannel: string;
}

/* ============================================================
   Columns
============================================================ */

function getColumns(router: ReturnType<typeof useRouter>) {
    return [
        {
            header: "ID",
            accessorKey: "clientId",
            cell: (row: TopCliente) => (
                <div className="text-sm">
                    <div className="font-semibold text-gray-900">
                        #{row.clientId}
                    </div>
                </div>
            ),
        },
        {
            header: "Cliente",
            accessorKey: "clientName",
            // cell: (row: TopCliente) => (
            //     <div className="text-sm">
            //         <div className="text-gray-500 text-sm">
            //             {row.clientName}
            //         </div>
            //     </div>
            // ),
        },
        {
            header: "Categoría",
            accessorKey: "category",
        },
        {
            header: "Ventas totales",
            accessorKey: "totalSales",
            cell: (row: TopCliente) => (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                    {formatMoney(row.totalSales)}
                </span>
            ),
        },
        {
            header: "Total de pedidos",
            accessorKey: "totalOrders",
        },
        {
            header: "Verificado",
            accessorKey: "verified",
            cell: (row: TopCliente) => (
                <span className="text-sm">
                    {row.verified ? "Sí" : "No"}
                </span>
            ),
        },
        {
            header: "Fecha modificación",
            accessorKey: "modifiedAt",
        },
        {
            header: "Vendedor",
            accessorKey: "sellerName",
            cell: (row: TopCliente) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                        {row.sellerName.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                            {row.sellerName}
                        </span>
                        <span className="text-xs text-gray-500">
                            {row.sellerEmail}
                        </span>
                    </div>
                </div>
            ),
        },
        // {
        //     header: "Estado",
        //     accessorKey: "status",
        //     cell: (row: TopCliente) => (
        //         <div
        //             className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
        //                 row.status
        //             )}`}
        //         >
        //             {row.status}
        //         </div>
        //     ),
        // },
    ];
}

/* ============================================================
   Página
============================================================ */

export default function TopClientesPorCategoriaView() {
    const router = useRouter();

    const columns = useMemo(() => getColumns(router), [router]);

    const [data, setData] = useState<TopCliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const EMPTY_FILTERS: Filters = {
        category: "",
        brand: "",
        salesChannel: "",
    };

    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getTopClientesPorCategoria({
                categoria: filters.category || undefined,
                marca: filters.brand || undefined,
                canal: filters.salesChannel || undefined,
                page: currentPage,
                pageSize,
            });

            const mapped: TopCliente[] = response.data.map((c) => ({
                clientId: c.cardCode,
                clientName: c.nombre,
                category: c.topCategoria,
                brand: c.topMarca,
                salesChannelId: "",
                salesChannelName: c.topCanal,
                totalSales: c.totalVentas,
                totalOrders: c.cantidadFacturas,
                verified: c.margenRealPct > 0, // puedes ajustar regla si quieres
                modifiedAt: c.ultimaCompra,
                sellerName: c.topVendedor,
                sellerEmail: c.correo ?? "—",
                // status: "Activo",
            }));

            setData(mapped);
            setTotalRecords(response.total);

        } catch (err: any) {
            console.error("Error cargando clientes:", err);
            setError(
                typeof err === "string"
                    ? err
                    : err?.message || "Error al cargar datos"
            );
            setData([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [filters.category, filters.brand, filters.salesChannel, currentPage, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // filtro categorias 

    const [categoryOptions, setCategoryOptions] = useState<Opt[]>([]);
    const [categorySearch, setCategorySearch] = useState("");
    const [brandSearch, setBrandSearch] = useState("");
    const [salesChannelSearch, setSalesChannelSearch] = useState("");

    const hasActiveFilters = useMemo(
        () => Boolean(filters.category || filters.brand || filters.salesChannel),
        [filters.category, filters.brand, filters.salesChannel]
    );

    const resetFilters = useCallback(() => {
        setFilters(EMPTY_FILTERS);
        setCategorySearch("");
        setBrandSearch("");
        setSalesChannelSearch("");
        setCurrentPage(1);
    }, []);

    useEffect(() => {
        const loadCategorias = async () => {
            try {
                const categorias = await getCategoriasFiltro();

                const mapped: Opt[] = [
                    { label: "Todas", value: "" },
                    ...categorias.map((c) => ({
                        label: c,
                        value: c,
                    })),
                ];

                setCategoryOptions(mapped);
            } catch (err) {
                console.error("Error cargando categorías:", err);
                setCategoryOptions([{ label: "Todas", value: "" }]);
            }
        };

        loadCategorias();
    }, []);

    // filtros
    const filterConfig = useMemo(() => {
        const keepDefaultOption = (
            options: Opt[],
            defaultLabel: string,
            defaultValue: string,
            searchTerm: string
        ) => {
            const term = searchTerm.toLowerCase();
            const filtered = options.filter((opt) =>
                opt.label.toLowerCase().includes(term)
            );
            const hasDefault = filtered.some((o) => o.value === defaultValue);
            if (hasDefault) return filtered;
            return [{ label: defaultLabel, value: defaultValue }, ...filtered];
        };

        const filteredCategories = keepDefaultOption(
            categoryOptions,
            "Todas",
            "",
            categorySearch
        );

        const normalize = (v: string) => (v || "").trim();

        const brandOptions: Opt[] = [
            { label: "Todas", value: "" },
            ...Array.from(
                new Set(
                    data
                        .map((row) => normalize(row.brand))
                        .filter(Boolean)
                )
            )
                .sort((a, b) => a.localeCompare(b, "es"))
                .map((value) => ({ label: value, value })),
        ];

        const salesChannelOptions: Opt[] = [
            { label: "Todos", value: "" },
            ...Array.from(
                new Set(
                    data
                        .map((row) => normalize(row.salesChannelName))
                        .filter(Boolean)
                )
            )
                .sort((a, b) => a.localeCompare(b, "es"))
                .map((value) => ({ label: value, value })),
        ];

        const filteredBrands = keepDefaultOption(
            brandOptions,
            "Todas",
            "",
            brandSearch
        );

        const filteredSalesChannels = keepDefaultOption(
            salesChannelOptions,
            "Todos",
            "",
            salesChannelSearch
        );

        return [
            {
                id: "category",
                label: "Categoría",
                type: "select-search" as const,
                value: filters.category,
                options: filteredCategories,
                searchQuery: categorySearch,
                onSearch: setCategorySearch,
                colSpan: "lg:col-span-2 xl:col-span-1 md:col-span-1",
            },
            {
                id: "brand",
                label: "Marca",
                type: "select-search" as const,
                value: filters.brand,
                options: filteredBrands,
                searchQuery: brandSearch,
                onSearch: setBrandSearch,
                colSpan: "lg:col-span-2 xl:col-span-1 md:col-span-1",
            },
            {
                id: "salesChannel",
                label: "Canal",
                type: "select-search" as const,
                value: filters.salesChannel,
                options: filteredSalesChannels,
                searchQuery: salesChannelSearch,
                onSearch: setSalesChannelSearch,
                colSpan: "lg:col-span-2 xl:col-span-1 md:col-span-1",
            },
        ];
    }, [
        filters.category,
        filters.brand,
        filters.salesChannel,
        categoryOptions,
        categorySearch,
        brandSearch,
        salesChannelSearch,
        data,
    ]);

    const headerActions = useMemo(
        () => [
            {
                label: "Actualizar",
                variant: "secondary" as const,
                onClick: () => fetchData(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [fetchData]
    );

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Top clientes por categoría"
                description={hasActiveFilters ? "Mostrando resultados filtrados" : "Selecciona filtros para refinar el reporte"}
                filters={filterConfig}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                action={headerActions}
                filterTitle
                filtersRight={
                    <ClearFiltersButton onClick={resetFilters} disabled={!hasActiveFilters} />
                }
            />

            <div className="flex-1 px-6 py-4">
                <div className="space-y-6">
                    {loading ? (
                        <div className="bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando Reporte Top de clientes por categoría…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-sm">
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">Error al cargar datos</h3>
                                    <p className="mt-2 text-sm">{error}</p>
                                    <button
                                        onClick={fetchData}
                                        className="mt-3 rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={data}
                            columns={columns as any}
                            rowBgClass="bg-white"
                            rowPaddingY={12}
                            showStatusBorder={false}
                        />
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalRecords={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
