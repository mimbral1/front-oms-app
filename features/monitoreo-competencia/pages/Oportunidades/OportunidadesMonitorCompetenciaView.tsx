"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import {
    getResumenOportunidades,
    ResumenOportunidades,
    OportunidadesPorCompetidor,
} from "@/app/fetchWithAuth/api-catalogo/apis-monitor-competencia/api-oportunidades-monitor-competencia";

/* =========================================================================================
   Constantes
========================================================================================= */
const PAGE_SIZE = 10;

/* =========================================================================================
   Helpers
========================================================================================= */
const clp = (n: number) => `$${n.toLocaleString("es-CL")}`;

function bgByFrequency(v: number) {
    if (v <= 1.2) return "bg-green-100 text-green-700";
    if (v <= 2) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

function bgByPercent(v: number) {
    if (v >= 35) return "bg-green-100 text-green-700";
    if (v >= 15) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

/* =========================================================================================
   Vista
========================================================================================= */
export default function OportunidadesMonitorCompetencia() {
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [resumen, setResumen] = useState<ResumenOportunidades | null>(null);
    const [porCompetidor, setPorCompetidor] = useState<OportunidadesPorCompetidor[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await getResumenOportunidades();
            setResumen(res.resumenGeneral);
            setPorCompetidor(res.porCompetidor || []);
        } catch (err: any) {
            console.error("Error cargando oportunidades:", err);
            setErrorMessage(
                typeof err === "string"
                    ? err
                    : err?.message || "Error al cargar oportunidades."
            );
            setResumen(null);
            setPorCompetidor([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    /* ===================== Loading ===================== */
    if (loading) {
        return (
            <div className="overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando oportunidades…
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    /* ===================== Error ===================== */
    if (errorMessage) {
        return (
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
                            Error al cargar oportunidades
                        </h3>
                        <p className="mt-2 text-sm">{errorMessage}</p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={fetchData}
                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    /* ===================== Paginación ===================== */
    const totalPages = Math.max(
        1,
        Math.ceil((porCompetidor?.length || 0) / PAGE_SIZE)
    );
    const slice = (porCompetidor || []).slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

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
                            Oportunidades
                        </div>
                    </div>
                }
            />

            <div className="flex-1 p-6">
                <div className="space-y-8">

                    {/* ===================== Loading ===================== */}
                    {loading && (
                        <div className="overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando oportunidades…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ===================== Error ===================== */}
                    {errorMessage && (
                        <div
                            className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Error al cargar oportunidades
                                    </p>
                                    <p className="text-sm">{errorMessage}</p>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={fetchData}
                                            className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================== CONTENIDO ===================== */}
                    {!loading && !errorMessage && resumen && (
                        <>
                            {/* ===================== Resumen ===================== */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-xs text-gray-500">Valor potencial margen</p>
                                    <p className="text-xl font-semibold">
                                        {clp(resumen.ValorPotencialMargen)}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-xs text-gray-500">Oportunidades de margen</p>
                                    <p className="text-xl font-semibold">
                                        {resumen.OportunidadesMargen}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-xs text-gray-500">Oportunidades crecimiento</p>
                                    <p className="text-xl font-semibold">
                                        {resumen.OportunidadesCrecimiento}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-xs text-gray-500">Productos exclusivos</p>
                                    <p className="text-xl font-semibold text-yellow-600">
                                        {resumen.ProductosExclusivos}
                                    </p>
                                </div>
                            </div>

                            {/* ===================== Guerra de precios ===================== */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Guerra de precios por competidor
                                </h3>

                                <div className="overflow-x-auto border rounded-md bg-white">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Competidor</th>
                                                <th className="px-4 py-2 text-right">Oportunidades</th>
                                                <th className="px-4 py-2 text-right">Valor potencial</th>
                                                <th className="px-4 py-2 text-center">% margen</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slice.map((c) => (
                                                <tr key={c.Competidor} className="border-t">
                                                    <td className="px-4 py-2 font-medium">
                                                        {c.Competidor}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {c.OportunidadesMargen}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        {clp(c.ValorPotencialVsCompetidor)}
                                                    </td>
                                                    <td
                                                        className={`px-4 py-2 text-center font-medium ${bgByPercent(
                                                            (c.OportunidadesMargen / resumen.TotalProductos) * 100
                                                        )}`}
                                                    >
                                                        {(
                                                            (c.OportunidadesMargen / resumen.TotalProductos) * 100
                                                        ).toFixed(1)}
                                                        %
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ===================== Paginación ===================== */}
                                <div className="flex justify-center gap-3 text-sm">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
                                    >
                                        <ArrowLeftIcon className="h-4 w-4" />
                                    </button>

                                    <span>
                                        Página {page} de {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40"
                                    >
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
