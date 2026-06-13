// views\CatalogoView\MonitoreoCompetencia\Competidor\CompetidorMonitorCompetencia.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import {
    getCompetidoresResumen,
    CompetidorResumenApi,
} from "@/app/fetchWithAuth/api-catalogo/apis-monitor-competencia/api-competidor-monitor-competencia";
import { Column, DataTable } from "@/components/ui/table";

/* =========================================================================================
   Tipos UI
========================================================================================= */
type CompetidorResumen = {
    competidor: string;
    productos_coincidentes: number;
    ganados_por_competencia: number;
    ganados_por_nosotros: number;
    diferencial_promedio: number;
};

/* =========================================================================================
   Helpers
========================================================================================= */
function bgByDiff(value: number) {
    if (value <= 0) return "bg-green-100 text-green-700";
    if (value <= 10) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

/* =========================================================================================
   Vista
========================================================================================= */
export default function CompetidorMonitorCompetencia() {
    const router = useRouter();
    const [rows, setRows] = useState<CompetidorResumen[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const data: CompetidorResumenApi[] =
                await getCompetidoresResumen();

            const mapped: CompetidorResumen[] = data.map((c) => ({
                competidor: c.Competidor,
                productos_coincidentes: c.SKUsComparables,
                ganados_por_competencia: c.SKUsEllosMasBarato,
                ganados_por_nosotros: c.SKUsNosotrosMasBarato,
                diferencial_promedio: c.DeltaPromedioPorcentaje,
            }));

            setRows(mapped);
        } catch (err: any) {
            console.error("Error cargando competidores:", err);
            setErrorMessage(
                typeof err === "string"
                    ? err
                    : err?.message ||
                    "Error al cargar comparativa de competidores."
            );
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns: Column<CompetidorResumen>[] = [
        {
            header: "Competidor",
            accessorKey: "competidor",
            cell: (r) => (
                <span className="font-medium text-gray-900">
                    {r.competidor}
                </span>
            ),
        },
        {
            header: "SKUs Coincidentes",
            accessorKey: "productos_coincidentes",
        },
        {
            header: "Gana Competidor",
            accessorKey: "ganados_por_competencia",
        },
        {
            header: "Ganamos Nosotros",
            accessorKey: "ganados_por_nosotros",
        },
        {
            header: "Diferencial Promedio",
            accessorKey: "diferencial_promedio",
            cell: (r) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${bgByDiff(
                        r.diferencial_promedio
                    )}`}
                >
                    {r.diferencial_promedio.toFixed(2)}%
                </div>
            ),
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
                            Competidor
                        </div>
                    </div>
                }
                description="Pulsa sobre algún competidor para ver su detalle"
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">

                    {/* ===================== Loading ===================== */}
                    {loading ? (
                        <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando competidores...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : errorMessage ? (
                        /* ===================== Error ===================== */
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
                                        Error al cargar competidores
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
                    ) : rows.length === 0 ? (

                        <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm py-10">
                            <p className="text-lg font-medium text-gray-700">
                                No hay competidores para mostrar
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Intenta nuevamente más tarde.
                            </p>
                        </div>
                    ) : (
                        /* ===================== Tabla ===================== */
                        <div className="rounded-xl shadow-sm">
                            <DataTable
                                data={rows}
                                columns={columns}
                                dataType="General"
                                showStatusBorder={false}
                                rowBgClass="bg-white"
                                rowPaddingY={12}
                                onRowClick={(row: CompetidorResumen) =>
                                    router.push(`/monitor-competidores/competidor/${row.competidor}`)
                                }
                            />
                        </div>

                    )}

                </div>
            </div>
        </div >
    );
}
