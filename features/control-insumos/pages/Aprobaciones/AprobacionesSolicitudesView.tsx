// views\ControlInsumos\Aprobaciones\AprobacionesSolicitudesView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

// sub-vistas
import SolicitudesPendientesView from "@/features/control-insumos/components/aprobaciones/SolicitudesPendientesView";
import HistorialAprobacionesView from "@/features/control-insumos/components/aprobaciones/HistorialAprobacionesView";

type ViewMode = "pendientes" | "historial";

export default function AprobacionesSolicitudesView() {

    const [mode, setMode] = useState<ViewMode>("pendientes");

    /* ----------------------- HEADER DINÁMICO ----------------------- */

    const title =
        mode === "pendientes"
            ? "Aprobaciones de Solicitudes · Pendientes"
            : "Aprobaciones de Solicitudes · Historial";

    const description =
        mode === "pendientes"
            ? "Esta sección está destinada a la jefatura para gestionar aprobaciones."
            : "Consulta el historial de solicitudes aprobadas o rechazadas.";

    const headerActions = useMemo<Action[]>(() => [
        {
            label: "Actualizar",
            variant: "secondary",
            icon: <ArrowPathIcon className="h-5 w-5" />,
            onClick: () => window.location.reload(),
        },
    ], []);

    usePageHeader(
        () =>
        ({
            title,
            description,
            action: headerActions,
        } as PageHeaderProps),
        [headerActions, mode]
    );

    /* ---------------------------- TABS ----------------------------- */

    const tabs = [
        { key: "pendientes", label: "Solicitudes Pendientes" },
        { key: "historial", label: "Historial de Aprobaciones" },
    ] as const;

    return (
        <div className="space-y-6 p-6 bg-[#e8eaf5] min-h-screen">

            {/* selector  */}
            <div className="flex flex-wrap items-center gap-2">
                {tabs.map((t) => {
                    const active = mode === t.key;
                    return (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={active}
                            onClick={() => setMode(t.key as ViewMode)}
                            className={[
                                "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                                active
                                    ? "border-blue-500 bg-white text-blue-700"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                                    active
                                        ? "bg-blue-600 ring-blue-600"
                                        : "bg-white ring-gray-300 group-hover:ring-blue-400",
                                ].join(" ")}
                            />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Vista interna */}
            <div className="rounded-xl shadow-sm">
                {mode === "pendientes" && <SolicitudesPendientesView />}
                {mode === "historial" && <HistorialAprobacionesView />}
            </div>
        </div>
    );
}
