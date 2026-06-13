"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import PaqueteFields, { PaqueteRecord } from "@/features/delivery/components/seguimiento/paquetes/PaqueteFields";

/* Estado inicial vacío */
const EMPTY: PaqueteRecord = {
    id: "",
    refId: "",
    ean: "",
    shippingId: "",
    status: "",
    trackingStatus: "",
    trackingDate: "",
    fechaCreacion: "",
    fechaModificacion: "",
    locationLat: "",
    locationLng: "",
    senderWarehouseId: "",
    receiverWarehouseId: "",
    location: "",
    orderId: "",
    packageTypeId: "",
    currency: "",
    nombre: "",
    descripcion: "",
    costoAdquisicion: "",
    ancho: "",
    alto: "",
    largo: "",
    cubage: "",
    pesoMaximo: "",
};

export default function PaqueteNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<PaqueteRecord>({ ...EMPTY });

    const handleChange = <K extends keyof PaqueteRecord>(field: K, value: PaqueteRecord[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleSave = () => {
        console.log("Guardar paquete (nuevo):", record);
        // aquí va el POST con fetch-with-auth cuando tengas API
    };

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-4 w-4" />, onClick: handleSave },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleSave },
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
                onClick: () => setRecord({ ...EMPTY }),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-4 w-4" />, onClick: () => router.push("/delivery/seguimiento/paquetes") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Tipo de paquete
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return <PaqueteFields record={record} onChange={handleChange} />;
}
