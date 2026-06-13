// views\Almacen\AlmacenesView\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { AlmacenFields, Warehouse } from "@/features/almacenes/components/almacenesview/AlmacenFields";
import { XCircleIcon } from "@heroicons/react/24/outline";

const initial: Warehouse = {
    name: "",
    refId: "",
    location: "",
    group: "",
    canalesVenta: "",
    canalesVentaPicking: "",
    tareas: "",
    limitarSellers: "false",
    pickuppointsIds: "",
    status: "Inactivo",

    inbound: "",
    slotting: "",
    consolidacion: "",
    outbound: "",
    cambiosDevoluciones: "",

    slots: "",
    ocupacionPercent: "",

    prioridad: "",

    maxPedidos: "",
    bultos: "",
    items: "",
};

export default function NuevoAlmacenView() {
    const router = useRouter();
    const [record, setRecord] = useState<Warehouse>(initial);

    const handleChange = (field: keyof Warehouse, value: string) => {
        setRecord((r) => ({ ...r, [field]: value }));
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Guardar (nuevo)", record),
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
                    console.log("Guardar & limpiar (nuevo)", record);
                    setRecord(initial);
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/almacenes"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Almacenes</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo almacén</div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.status,
                variant: record.status === "Activo" ? "success" : "warning",
            },
        } as PageHeaderProps),
        [headerActions, record.status]
    );

    return (
        <div className="p-6 bg-white">
            {/* En nuevo, SIEMPRE editable */}
            <AlmacenFields record={record} onChange={handleChange} hideMetaSections />
        </div>
    );
}
