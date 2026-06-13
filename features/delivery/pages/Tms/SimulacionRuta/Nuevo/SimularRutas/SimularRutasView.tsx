// views\Delivery\Tms\SimulacionRuta\Nuevo\SimularRutas\SimularRutasView.tsx
"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import SimularRutasPanel from "@/features/delivery/components/tms/simulacionruta/SimularRutasPanel";
import { ArrowDownOnSquareIcon, PlusIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function SimularRutasView() {
    const sp = useSearchParams();
    const router = useRouter();

    const request = useMemo(
        () => ({
            fechaDesde: sp.get("from") || "",
            fechaHasta: sp.get("to") || "",
            inventario: sp.get("inv") || "",
            tiposEntregaCsv: sp.get("entrega") || "",
            tiposVehiculoCsv: sp.get("vehiculo") || "",
        }),
        [sp]
    );

    // Acciones del header (mismas que usas en Rutas/Resumen)
    const headerActions: Action[] = [
        {
            label: "Volver al listado",
            variant: "secondary",
            onClick: () => router.push("delivery/tms/simulacion-ruta"),
            icon: <XCircleIcon className="h-5 w-5" />
        },
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("delivery/tms/simulacion-ruta/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />
        },
        {
            label: "Guardar",
            variant: "success",
            onClick: () => {
                // por ahora lo dejamos como botón sin funcion con motivo de la vista,
                icon: <ArrowDownOnSquareIcon className="h-5 w-5" />
            },
        },
    ];

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">TMS</div>
                    <div className="text-2xl font-semibold text-gray-900">Simular rutas</div>
                </div>
            ),
            action: headerActions,
            sticky: true,
            stickyTop: 0,
        } as unknown as PageHeaderProps),
        [router]
    );

    return (
        <div className="min-h-screen bg-[#f3f4f8]">
            <div className="p-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <SimularRutasPanel request={request} />
                </div>
            </div>
        </div>
    );
}
