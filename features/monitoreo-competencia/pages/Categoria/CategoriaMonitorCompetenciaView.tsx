// views\MonitoreoCompetencia\Categoria\CategoriaMonitorCompetenciaView.tsx

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DataTableExpandable from "@/components/ui/table/DataTableExpandable";
import type { Column } from "@/components/ui/table";
import {
    getCategoriasMonitor,
    getSubcategoriasMonitor,
    CategoriaApi,
    SubcategoriaApi,
} from "@/app/fetchWithAuth/api-catalogo/apis-monitor-competencia/api-categoria-monitor-competencia";

/* =========================================================================================
   Tipos UI
========================================================================================= */
type CategoriaResumen = {
    categoria: string;
    total_productos: number;
    mas_baratos: number;
    bajo_margen: number;
};

type ProductoCategoria = {
    sku: string;
    nombre: string;
    marca: string;
    marketplace: string;
    precio_mimbral: number;
    precio_competencia: number;
    delta_porcentual: number;
};

type CategoriaRow = {
    id: string; // usamos categoria como id estable
    categoria: string;
    total_skus: number;
    pct_mas_barato: number;
    pct_bajo_margen: number;
};

/* =========================================================================================
   Constantes
========================================================================================= */
const PAGE_SIZE = 10;

/* =========================================================================================
   Helpers
========================================================================================= */
const clp = (n: number) => `$${n.toLocaleString("es-CL")}`;

function bgByDelta(delta: number) {
    if (delta <= 0) return "bg-green-100 text-green-700";
    if (delta <= 10) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

function bgByPercent(value: number) {
    if (value >= 60) return "bg-green-100 text-green-700";
    if (value >= 40) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

/* =========================================================================================
   Vista
========================================================================================= */
export default function CategoriaMonitorCompetencia() {
    /* ===================== Estado ===================== */
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [categorias, setCategorias] = useState<CategoriaApi[]>([]);
    const [subcategorias, setSubcategorias] = useState<
        Record<string, SubcategoriaApi[]>
    >({});


    const [rows, setRows] = useState<CategoriaRow[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);

    /* ===================== Fetch ===================== */
    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const [cats, subs] = await Promise.all([
                getCategoriasMonitor(),
                getSubcategoriasMonitor(),
            ]);

            setCategorias(cats);

            const mapped: CategoriaRow[] = cats.map((c) => ({
                id: c.categoria,
                categoria: c.categoria,
                total_skus: c.total_skus,
                pct_mas_barato: Math.round((c.skus_mas_baratos / c.total_skus) * 100),
                pct_bajo_margen: Math.round((c.skus_bajo_margen / c.total_skus) * 100),
            }));

            setRows(mapped);
            setOpenId(null);

            const map: Record<string, SubcategoriaApi[]> = {};
            subs.forEach((s) => {
                const key = s.categoria_padre;
                if (!map[key]) map[key] = [];
                map[key].push(s);
            });
            setSubcategorias(map);

        } catch (err: any) {
            console.error("Error cargando categorías:", err);
            setErrorMessage(
                typeof err === "string"
                    ? err
                    : err?.message || "Error al cargar categorías."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    /* ==================== Columnas =================== */

    const columns = useMemo<Column<CategoriaRow>[]>(() => [
        {
            header: "Categoría",
            accessorKey: "categoria",
        },
        {
            header: "# SKUs",
            accessorKey: "total_skus",
            cell: (r) => (
                <div className="text-left">{r.total_skus}</div>
            ),
        },
        {
            header: "% Más Barato",
            accessorKey: "pct_mas_barato",
            cell: (r) => (
                <div className={`text-center ${bgByPercent(r.pct_mas_barato)}`}>
                    {r.pct_mas_barato}%
                </div>
            ),
        },
        {
            header: "% Bajo Margen",
            accessorKey: "pct_bajo_margen",
            cell: (r) => (
                <div className={`text-center ${bgByPercent(r.pct_bajo_margen)}`}>
                    {r.pct_bajo_margen}%
                </div>
            ),
        },
    ], []);

    /* ===================== Render ===================== */
    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title={
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Monitor de competencia
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                            Categoría
                        </div>
                    </div>
                }
            />

            <div className="flex-1 p-6">
                <div className="space-y-8">
                    {loading ? (
                        <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando categorías…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : errorMessage ? (
                        <div
                            className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">
                                        Error al cargar categorías
                                    </h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
                                    <div className="mt-4">
                                        <div className="-mx-2 -my-1.5 flex">
                                            <button
                                                type="button"
                                                onClick={fetchData}
                                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DataTableExpandable<CategoriaRow>
                            data={rows}
                            columns={columns}
                            dataType="General"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            showStatusBorder={false}
                            expandedId={openId}
                            getRowId={(row) => row.id}
                            onToggle={(row) =>
                                setOpenId((prev) => (prev === row.id ? null : row.id))
                            }
                            renderDetail={(row) => {
                                const list = subcategorias[row.id] || [];

                                if (list.length === 0) {
                                    return (
                                        <div className="px-4 py-4 text-sm text-gray-500">
                                            Sin subcategorías registradas.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="rounded-lg border bg-gray-50">
                                        <div className="overflow-x-auto">
                                            <table className="w-full table-fixed">
                                                <thead>
                                                    <tr className="text-left text-xs text-gray-500">
                                                        <th className="px-3 py-2">Subcategoría</th>
                                                        <th className="px-3 py-2 text-center"># SKUs</th>
                                                        <th className="px-3 py-2 text-center">% Más Barato</th>
                                                        <th className="px-3 py-2 text-center">% Bajo Margen</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm text-gray-700">
                                                    {list.map((s) => {
                                                        const pctMasBarato = Math.round(
                                                            (s.skus_mas_baratos / s.total_skus) * 100
                                                        );
                                                        const pctBajoMargen = Math.round(
                                                            (s.skus_bajo_margen / s.total_skus) * 100
                                                        );

                                                        return (
                                                            <tr key={`${row.id}-${s.subcategoria}`} className="border-t">
                                                                <td className="px-3 py-2">
                                                                    {s.subcategoria}
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    {s.total_skus}
                                                                </td>
                                                                <td className={`px-3 py-2 text-center ${bgByPercent(pctMasBarato)}`}>
                                                                    {pctMasBarato}%
                                                                </td>
                                                                <td className={`px-3 py-2 text-center ${bgByPercent(pctBajoMargen)}`}>
                                                                    {pctBajoMargen}%
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            }}
                        />

                    )}
                </div>
            </div>
        </div>
    );

}
