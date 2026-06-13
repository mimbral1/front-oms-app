"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";

import {
    getCategoriasPorMarca,
    getResumenMarcas,
} from "@/app/fetchWithAuth/api-catalogo/apis-monitor-competencia/api-marca-monitor-competencia";
import { Column } from "@/components/ui/table";
import DataTableExpandable from "@/components/ui/table/DataTableExpandable";
import { Pagination } from "@/components/ui/pagination";

/* =========================================================================================
   Tipos UI
========================================================================================= */
type ResumenMarca = {
    id: string;
    marca: string;
    total_productos: number;
    porcentaje_mas_baratos: number;
    porcentaje_segundo_mas_barato: number;
    porcentaje_mas_caro: number;
    precio_promedio: number;
};

/* =========================================================================================
   Helpers
========================================================================================= */

function getBgByPercent(
    value: number,
    type: "mas_barato" | "segundo" | "mas_caro"
) {
    if (type === "mas_barato") {
        if (value >= 40) return "bg-green-100 text-green-700";
        if (value >= 20) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    }

    if (type === "segundo") {
        if (value >= 30) return "bg-green-100 text-green-700";
        if (value >= 15) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    }

    if (value <= 10) return "bg-green-100 text-green-700";
    if (value <= 25) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

const formatCLP = (n: number) => `$${n.toLocaleString("es-CL")}`;

/* =========================================================================================
   Vista
========================================================================================= */
export default function MarcaMonitorCompetencia() {
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rows, setRows] = useState<ResumenMarca[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const [openId, setOpenId] = useState<string | null>(null);

    const [categoriasPorMarca, setCategoriasPorMarca] = useState<
        Record<string, string[]>
    >({});
    const [loadingCategorias, setLoadingCategorias] = useState<
        Record<string, boolean>
    >({});

    const headerActions = [
        {
            label: "Actualizar",
            variant: "secondary" as const,
            onClick: () => fetchData(),
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    /* ===================== Fetch principal ===================== */

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await getResumenMarcas(currentPage, pageSize);

            const mapped: ResumenMarca[] = response.data.map((m) => ({
                id: m.marca,
                marca: m.marca,
                total_productos: m.total_skus,
                porcentaje_mas_baratos: Number(
                    ((m.skus_mas_baratos / m.total_skus) * 100).toFixed(0)
                ),
                porcentaje_segundo_mas_barato: Number(
                    ((m.skus_segundos_mas_baratos / m.total_skus) * 100).toFixed(0)
                ),
                porcentaje_mas_caro: Number(
                    ((m.skus_bajo_margen / m.total_skus) * 100).toFixed(0)
                ),
                precio_promedio: 0,
            }));

            setRows(mapped);
            setTotalRecords(response.total);
        } catch (err: any) {
            console.error("Error cargando marcas:", err);
            setErrorMessage(
                typeof err === "string"
                    ? err
                    : err?.message || "Error al cargar marcas."
            );
            setRows([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ===================== Expand handler ===================== */

    const handleToggle = async (row: ResumenMarca) => {
        const marca = row.marca;

        setOpenId((prev) => (prev === marca ? null : marca));

        if (!categoriasPorMarca[marca]) {
            try {
                setLoadingCategorias((prev) => ({
                    ...prev,
                    [marca]: true,
                }));

                const res = await getCategoriasPorMarca(marca);

                setCategoriasPorMarca((prev) => ({
                    ...prev,
                    [marca]: res.data || [],
                }));
            } catch {
                setCategoriasPorMarca((prev) => ({
                    ...prev,
                    [marca]: [],
                }));
            } finally {
                setLoadingCategorias((prev) => ({
                    ...prev,
                    [marca]: false,
                }));
            }
        }
    };

    /* ===================== Columnas ===================== */

    const columns: Column<ResumenMarca>[] = [
        {
            header: "Marca",
            accessorKey: "marca",
            cell: (r) => (
                <span className="font-medium text-gray-900">
                    {r.marca}
                </span>
            ),
        },
        { header: "# SKUs", accessorKey: "total_productos" },
        {
            header: "% Más Barato",
            accessorKey: "porcentaje_mas_baratos",
            cell: (r) => (
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBgByPercent(r.porcentaje_mas_baratos, "mas_barato")}`}>
                    {r.porcentaje_mas_baratos}%
                </div>
            ),
        },
        {
            header: "% 2do Más Barato",
            accessorKey: "porcentaje_segundo_mas_barato",
            cell: (r) => (
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBgByPercent(r.porcentaje_segundo_mas_barato, "segundo")}`}>
                    {r.porcentaje_segundo_mas_barato}%
                </div>
            ),
        },
        {
            header: "% Más Caro",
            accessorKey: "porcentaje_mas_caro",
            cell: (r) => (
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBgByPercent(r.porcentaje_mas_caro, "mas_caro")}`}>
                    {r.porcentaje_mas_caro}%
                </div>
            ),
        },
        {
            header: "Precio Prom.",
            accessorKey: "precio_promedio",
            cell: (r) => formatCLP(r.precio_promedio),
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title={
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Monitor de Competencia
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                            Marcas
                        </div>
                    </div>
                }
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">

                    {loading ? (
                        <div className="bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando marcas…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : errorMessage ? (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">
                                        Error al cargar marcas
                                    </h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
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
                        <>
                            <div className="rounded-xl shadow-sm">
                                <DataTableExpandable<ResumenMarca>
                                    data={rows}
                                    columns={columns}
                                    dataType="General"
                                    showStatusBorder={false}
                                    rowBgClass="bg-white"
                                    rowPaddingY={12}
                                    expandedId={openId}
                                    getRowId={(row) => row.id}
                                    onToggle={handleToggle}
                                    renderDetail={(row) => {
                                        const list = categoriasPorMarca[row.marca];
                                        const loadingSub = loadingCategorias[row.marca];

                                        if (loadingSub) {
                                            return (
                                                <div className="px-4 py-4 text-sm text-gray-500">
                                                    <ArrowPathIcon className="h-4 w-4 inline animate-spin mr-2" />
                                                    Cargando categorías…
                                                </div>
                                            );
                                        }

                                        if (!list || list.length === 0) {
                                            return (
                                                <div className="px-4 py-4 text-sm text-gray-500">
                                                    Sin categorías registradas.
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="rounded-lg border bg-gray-50">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full table-fixed">
                                                        <thead>
                                                            <tr className="text-left text-xs text-gray-500">
                                                                <th className="px-3 py-2">Categoría</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm text-gray-700">
                                                            {list.map((c) => (
                                                                <tr key={`${row.marca}-${c}`} className="border-t">
                                                                    <td className="px-3 py-2">
                                                                        {c}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </div>

                            {/* paginacion */}
                            <Pagination
                                currentPage={currentPage}
                                totalRecords={totalRecords}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}