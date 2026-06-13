// views\Delivery\Tms\SimulacionRuta\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowUturnLeftIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { SimulacionRuta, SimulacionRutaFields } from "@/features/delivery/components/tms/simulacionruta/SimulacionRutaFields";

/* ----------------------------- Mocks ----------------------------- */
const MOCKS: Record<string, SimulacionRuta> = {
    "SIM-250228-TAL-01": {
        id: "SIM-250228-TAL-01",
        envio: "",
        fecha_entrega_desde: "2025-02-28T00:00",
        fecha_entrega_hasta: "2025-02-28T23:59",
        fecha_creacion: "2025-02-20T09:30",
        fecha_envio: "",
        tipo_entrega: "Envio a domicilio,Express 24hs",
        tipo_vehiculo: "",
        inventario: "Talca Centro",
        rutas: "",
        entregas: "",
        estado: "Borrador",
        usuario_creador: { iniciales: "CG", nombre: "Camilo G.", email: "cgutierrez@mimbral.cl" },
    },
};

const EMPTY: SimulacionRuta = {
    envio: "",
    fecha_entrega_desde: "",
    fecha_entrega_hasta: "",
    fecha_creacion: "",
    fecha_envio: "",
    tipo_entrega: "",
    tipo_vehiculo: "",
    inventario: "",
    rutas: "",
    entregas: "",
    estado: "Borrador",
    usuario_creador: { iniciales: "—", nombre: "—", email: "—" },
};

export default function SimulacionRutaResumenView() {
    const router = useRouter();
    const params = useParams() as { id?: string }; // leemos /simulacion-ruta/[id]
    const simId = params?.id ?? "SIM-250228-TAL-01";

    const [record, setRecord] = useState<SimulacionRuta>(EMPTY);

    useEffect(() => {
        setRecord(MOCKS[simId] ?? { ...EMPTY, id: simId });
    }, [simId]);

    const handleChange = useCallback(
        <K extends keyof SimulacionRuta>(field: K, value: SimulacionRuta[K]) => {
            setRecord((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <ArrowUturnLeftIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/tms/simulacion-ruta"),
            },
            {
                label: "Nueva simulación",
                variant: "success",
                icon: <PlusCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/tms/simulacion-ruta/nuevo"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">TMS</div>
                    <div className="text-2xl font-semibold text-gray-900">Simular rutas</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    // mismo comportamiento que en "Nuevo", pero empujando con el id de la URL
    const handleSimular = useCallback(() => {
        const current = recordRef.current;
        const params = new URLSearchParams({
            from: current.fecha_entrega_desde || "",
            to: current.fecha_entrega_hasta || "",
            inv: current.inventario || "",
            entrega: Array.isArray(current.tipo_entrega)
                ? current.tipo_entrega.join(",")
                : String(current.tipo_entrega || ""),
            vehiculo: Array.isArray(current.tipo_vehiculo)
                ? current.tipo_vehiculo.join(",")
                : String(current.tipo_vehiculo || ""),
        });

        router.push(`/delivery/tms/simulacion-ruta/${simId}/simular?${params.toString()}`);
    }, [router, simId]);

    return (
        <div className="p-6 bg-white">
            <SimulacionRutaFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                onSimular={handleSimular}
            />
        </div>
    );
}
