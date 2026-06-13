// views\ControlInsumos\TrasladoAlmacenes\TrasladoEntreAlmacenesView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import TrasladosListado from "@/features/control-insumos/components/trasladoalmacenes/TrasladosListado";
import CrearTrasladoView from "@/features/control-insumos/components/trasladoalmacenes/CrearTrasladoView";

type ViewMode = "listado" | "crear";

export default function TrasladoEntreAlmacenesView() {
    const [mode, setMode] = useState<ViewMode>("listado");

    /* ---------------- HEADER DINÁMICO ---------------- */

    const title =
        mode === "listado"
            ? "Traslados entre almacenes"
            : "Crear Nuevo Traslado";

    const description =
        mode === "listado"
            ? "Consulta y gestiona todos los traslados realizados entre bodegas."
            : "Complete el formulario para crear un nuevo traslado de insumos.";

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

    /* ---------------- TABS ---------------- */

    const tabs = [
        { key: "listado", label: "Traslados entre almacenes" },
        { key: "crear", label: "Crear traslado" },
    ] as const;

    return (
        <div className="space-y-6 p-6 bg-[#e8eaf5] min-h-screen">

            {/* selector tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {tabs.map((t) => {
                    const active = mode === t.key;
                    return (
                        <button
                            key={t.key}
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

            {/* contenido */}
            <div className="rounded-xl  shadow-sm">
                {mode === "listado" && <TrasladosListado />}
                {mode === "crear" && <CrearTrasladoView />}
            </div>
        </div>
    );
}
