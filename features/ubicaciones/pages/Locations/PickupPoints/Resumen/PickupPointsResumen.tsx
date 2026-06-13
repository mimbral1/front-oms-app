// app/views/Pickup/Points/Detail/PickupPointResumenView.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import SaveOutlined from "@mui/icons-material/SaveOutlined";

import { PickupFields, PickupPoint } from "@/features/ubicaciones/components/locations/pickuppoints/PuntosPickupFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

/* --- mock basado en la referencia de la captura --- */
const mockPickup: PickupPoint = {
    id: "s103",
    name: "Windows default",
    refId: "Windows default",
    locationName: "Store 103",
    scheduleScheme: "Windows default",
    startDay: "lunes",
    startTime: "11:00",
    status: "Activo",
    coords: { lat: -33.45, lon: -70.66 },
    created: { username: "Carlos Peña", email: "carlos@mimbral.com", date: "2024-12-02 10:40" },
    modified: { username: "Ana Marin", email: "ana@mimbral.com", date: "2025-01-12 09:15" },
};

export default function PickupPointResumenView() {
    const router = useRouter();

    const [record, setRecord] = useState<PickupPoint>(mockPickup);
    const readOnly = true;

    const handleChange = <K extends keyof PickupPoint>(field: K, value: PickupPoint[K]) => {
        setRecord((r) => ({ ...r, [field]: value }));
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Aplicar sin cerrar", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Guardar", record),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/pickup/points"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Puntos de pickup
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{record.name || "Puntos de pick up"}</div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.status,
                variant: record.status === "Activo" ? "success" : "warning",
            },
        } as PageHeaderProps),
        [headerActions, record.name, record.status]
    );

    return (
        <div className="p-6 bg-white">
            <PickupFields record={record} readOnly={readOnly} onChange={handleChange} />
        </div>
    );
}
