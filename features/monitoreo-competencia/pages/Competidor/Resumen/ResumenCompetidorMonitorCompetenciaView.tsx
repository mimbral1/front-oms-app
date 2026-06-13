// views/CatalogoView/MonitoreoCompetencia/Competidor/ResumenCompetidorMonitorCompetenciaView.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import {
    getCompetidorDetalle,
} from "@/app/fetchWithAuth/api-catalogo/apis-monitor-competencia/api-competidor-monitor-competencia";

/* =========================================================================================
   Tipos
========================================================================================= */

type CompetidorDetalle = {
    Competidor: string;
    SKUsComparables: number;
    SKUsEllosMasBarato: number;
    SKUsEmpate: number;
    SKUsNosotrosMasBarato: number;
    PorcEllosMasBarato: number;
    PorcNosotrosMasBarato: number;
    PrecioPromedioNuestro: number;
    PrecioPromedioEllos: number;
    DeltaPromedioPorcentaje: number;
    SKUsSomosSegundo: number;
    Estrategia: string;
};

/* =========================================================================================
   Helpers
========================================================================================= */

const formatCLP = (n: number) => `$${n.toLocaleString("es-CL")}`;

function bgByDelta(value: number) {
    if (value <= 0) return "bg-green-100 text-green-700";
    if (value <= 10) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
}

/* =========================================================================================
   Vista
========================================================================================= */

export default function ResumenCompetidorMonitorCompetenciaView() {
    const router = useRouter();
    const { competidor } = useParams();

    const decodedCompetidor =
        typeof competidor === "string"
            ? decodeURIComponent(competidor)
            : "";

    const competidorName = Array.isArray(competidor)
        ? competidor[0]
        : competidor;

    const [data, setData] = useState<CompetidorDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ===================== Cargar detalle ===================== */
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                setErrorMessage(null);

                const decodedCompetidor =
                    typeof competidorName === "string"
                        ? decodeURIComponent(competidorName)
                        : "";

                const result = await getCompetidorDetalle(
                    decodedCompetidor
                );

                if (!mounted) return;

                setData(result);
            } catch (err: any) {
                if (!mounted) return;
                setErrorMessage(
                    err?.message ||
                    "Error al cargar el detalle del competidor."
                );
                setData(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (competidorName) load();

        return () => {
            mounted = false;
        };
    }, [competidorName]);

    /* ===================== Header ===================== */

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/monitor-competidores/competidor"),
                disabled: loading,
            },
        ],
        [router, loading]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Monitor de Competencia
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {decodedCompetidor}
                    </div>
                </div>
            ),
            action: headerActions,
            status: data
                ? {
                    text: data.Estrategia,
                    // variant:
                    //     data.Estrategia === "Agresivo"
                    //         ? "success"
                    //         : "warning",
                }
                : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, data?.Estrategia, decodedCompetidor]
    );

    /* ===================== Loading ===================== */
    if (loading) {
        return (
            <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando detalle...
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
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">
                            Error al cargar competidor
                        </h3>
                        <p className="mt-2 text-sm">{errorMessage}</p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
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

    if (!data) return null;

    /* ===================== Render ===================== */
    return (
        <div className="p-6 bg-white space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* COLUMNA IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="RESUMEN GENERAL"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">SKUs comparables</p>
                                <p className="font-semibold">
                                    {data.SKUsComparables}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">
                                    Delta promedio
                                </p>
                                <div
                                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${bgByDelta(
                                        data.DeltaPromedioPorcentaje
                                    )}`}
                                >
                                    {data.DeltaPromedioPorcentaje.toFixed(2)}%
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-500">
                                    Precio promedio nuestro
                                </p>
                                <p className="font-semibold">
                                    {formatCLP(data.PrecioPromedioNuestro)}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">
                                    Precio promedio ellos
                                </p>
                                <p className="font-semibold">
                                    {formatCLP(data.PrecioPromedioEllos)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* COLUMNA DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="POSICIONAMIENTO"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Ellos más barato</span>
                                <span className="font-semibold">
                                    {data.PorcEllosMasBarato}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Nosotros más barato</span>
                                <span className="font-semibold">
                                    {data.PorcNosotrosMasBarato}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>SKUs empates</span>
                                <span className="font-semibold">
                                    {data.SKUsEmpate}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>SKUs somos segundo</span>
                                <span className="font-semibold">
                                    {data.SKUsSomosSegundo}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}