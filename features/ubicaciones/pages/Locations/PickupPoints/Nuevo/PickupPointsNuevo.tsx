// app/views/Pickup/Points/New/PickupPointNuevoView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { PickupFields, PickupPoint } from "@/features/ubicaciones/components/locations/pickuppoints/PuntosPickupFields";

/* Registro inicial vacío (mock) */
const initialRecord: PickupPoint = {
    name: "",
    refId: "",
    locationName: "",
    scheduleScheme: "",
    startDay: "",
    startTime: "",
    status: "Activo",
    created: { username: "—", email: "—", date: "—" },
    modified: { username: "—", email: "—", date: "—" },
};

export default function PickupPointNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<PickupPoint>({ ...initialRecord });

    const handleChange = <K extends keyof PickupPoint>(field: K, value: PickupPoint[K]) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Save", record),
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => {
                    console.log("Save & create new", record);
                    setRecord({ ...initialRecord }); // limpiar formulario
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/ubicaciones/pickup-points"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            // Título estilo "Nuevo" como en Precios/Unidades
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Puntos de pickup
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo registro</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <PickupFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
