// views\CatalogoView\MonitoreoCompetencia\General\GeneralMonitorCompetencia.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getGeneralKpis,
    getHistorialPreciosGlobal,
    getDominanciaCompetidores,
    getCoberturaProductos,
    getCoberturaCategorias,
    getCoberturaMarcas,
    GeneralKpis,
    HistorialPreciosRow,
    DominanciaCompetidor,
    CoberturaItem,
} from "@/app/fetchWithAuth/api-catalogo/apis-monitor-competencia/api-general-monitor-competencia";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

import { PageHeader } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

/* ──────────────────────────────
   KPI
────────────────────────────── */
const KPI = ({ title, value, subtitle }: any) => (
    <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="text-sm text-blue-600 font-semibold">{title}</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
        {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
    </div>
);

export default function GeneralMonitorCompetencia() {
    const [filters, setFilters] = useState({
        canal: "Todas",
        categoria: "",
    });

    const [kpis, setKpis] = useState<GeneralKpis | null>(null);
    const [historial, setHistorial] = useState<HistorialPreciosRow[]>([]);
    const [dominancia, setDominancia] = useState<DominanciaCompetidor[]>([]);
    const [cobProductos, setCobProductos] = useState<CoberturaItem[]>([]);
    const [cobCategorias, setCobCategorias] = useState<CoberturaItem[]>([]);
    const [cobMarcas, setCobMarcas] = useState<CoberturaItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const [
                k,
                h,
                d,
                cp,
                cc,
                cm,
            ] = await Promise.all([
                getGeneralKpis(filters),
                getHistorialPreciosGlobal(filters),
                getDominanciaCompetidores(filters),
                getCoberturaProductos(filters),
                getCoberturaCategorias(filters),
                getCoberturaMarcas(filters),
            ]);

            setKpis(k);
            setHistorial(h);
            setDominancia(d);
            setCobProductos(cp);
            setCobCategorias(cc);
            setCobMarcas(cm);
        } catch (err: any) {
            setErrorMessage(
                err?.message || "Error al cargar monitor de competencia."
            );
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const tiendas = useMemo(() => {
        if (!historial.length) return [];
        const keys = new Set<string>();
        historial.forEach((r) =>
            Object.keys(r).forEach((k) => k !== "fecha" && keys.add(k))
        );
        return Array.from(keys);
    }, [historial]);


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
                            General
                        </div>
                    </div>
                }
                filters={[
                    {
                        id: "canal",
                        label: "Canal",
                        type: "select",
                        value: filters.canal,
                        options: [
                            { label: "Todas", value: "Todas" },
                            { label: "MIMBRAL", value: "MIMBRAL" },
                            { label: "MERCADOLIBRE", value: "MERCADOLIBRE" },
                            { label: "SODIMAC", value: "SODIMAC" },
                            { label: "FALABELLA", value: "FALABELLA" },
                        ],
                    },
                    // {
                    //     id: "categoria",
                    //     label: "Categoría",
                    //     type: "text",
                    //     value: filters.categoria,
                    // },
                ]}
                onFilterChange={(id, value) => {
                    setFilters((f) => ({ ...f, [id]: value }));
                }}
                filterTitle
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
                                            Cargando…
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
                                        Error al cargar monitor de competencia
                                    </h3>
                                    <p className="mt-2 text-sm">
                                        {errorMessage}
                                    </p>
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
                        <>
                            {/* Posicionamiento, Margen y Saturación */}
                            <div className="px-2 border-b bg-[#E8EAF7] font-semibold">
                                Posicionamiento, Margen y Saturación
                            </div>
                            {/* KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <KPI
                                    title="Margen Promedio Actual"
                                    value={`${kpis?.margen_promedio_general.toFixed(1)}%`}
                                />
                                <KPI
                                    title="Productos - El Más Barato"
                                    value={kpis?.productos_lider}
                                />
                                <KPI
                                    title="Productos - 2do Más Barato"
                                    value={kpis?.productos_posicion_2}
                                />
                                <KPI
                                    title="Productos - 3ro Más Barato"
                                    value={kpis?.productos_posicion_3}
                                />
                            </div>

                            {/* Gráfico */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="text-sm font-semibold text-blue-600 mb-4">
                                    Dispersión de Precios con la Competencia
                                </div>

                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historial}>
                                            <XAxis dataKey="fecha" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            {tiendas.map((t) => (
                                                <Line
                                                    key={t}
                                                    dataKey={t}
                                                    type="monotone"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Relación y dominancia de Competidores */}
                            <div className="px-2 border-b bg-[#E8EAF7] font-semibold">
                                Relación y dominancia de Competidores
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {dominancia[0] && (
                                    <KPI
                                        title="SKU - Competidor Más Dominante"
                                        value={dominancia[0].competidor}
                                        subtitle={`Te gana en ${dominancia[0].ganados_por_competencia} SKUs`}
                                    />
                                )}
                                {cobProductos[0] && (
                                    <KPI
                                        title="Productos - Mayor Coincidencia"
                                        value={cobProductos[0].competidor}
                                        subtitle={`${cobProductos[0].porcentaje.toFixed(1)}%`}
                                    />
                                )}
                                {cobCategorias[0] && (
                                    <KPI
                                        title="Categoría - Mayor Coincidencia"
                                        value={cobCategorias[0].competidor}
                                        subtitle={`${cobCategorias[0].porcentaje.toFixed(1)}%`}
                                    />
                                )}
                                {cobMarcas[0] && (
                                    <KPI
                                        title="Marca - Mayor Coincidencia"
                                        value={cobMarcas[0].competidor}
                                        subtitle={`${cobMarcas[0].porcentaje.toFixed(1)}%`}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

}
