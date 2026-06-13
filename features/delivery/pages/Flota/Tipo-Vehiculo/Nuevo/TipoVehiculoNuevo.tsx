// app/views/Pricing/Price/New/PriceCreatePage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { TypeVehicleFields, TypeVehicle } from "@/features/delivery/components/flota/tipo-vehiculo/TypeVehicleFields";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { DELIVERY_VEHICLE_TYPE_ENDPOINT } from "@/lib/http/endpoints";

export function TypeVehicleCreateView() {
    const router = useRouter();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

    const initial: TypeVehicle = {
        id: "",
        Refid: "",
        name: "",
        motivo: "",
        origin: "",
        companyId: "",
        icono: "",
        fuelConsumption: "",
        envios_max: '',
        items_max: '',
        volumen_maximo: '',
        maxDistance: "",
        maxWeight: "",
        status: "Inactivo"
    }

    const [record, setRecord] = useState<TypeVehicle>(initial);
    const [saving, setSaving] = useState(false);

    const handleChange = (field: keyof TypeVehicle, value: string) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    const toNumber = (value: string) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const toApiStatus = (value: string): "active" | "inactive" =>
        String(value).trim().toLowerCase() === "activo" ? "active" : "inactive";

    const normalizeVehicleType = (value: string) => String(value || "").trim().toLowerCase();

    const buildPayload = (current: TypeVehicle) => ({
        referenceId: current.Refid,
        name: current.name,
        origin: current.origin,
        type: normalizeVehicleType(current.motivo),
        maxShippingQuantity: toNumber(current.envios_max),
        maxProductQuantity: toNumber(current.items_max),
        maxVolume: toNumber(current.volumen_maximo),
        maxDistance: toNumber(current.maxDistance),
        maxWeight: toNumber(current.maxWeight),
        fuelConsumption: toNumber(current.fuelConsumption),
        icon: current.icono,
        status: toApiStatus(current.status),
    });

    const createVehicleType = async (current: TypeVehicle) => {
        const payload = buildPayload(current);

        setSaving(true);
        try {
            await fetchWithAuthDelivery(DELIVERY_VEHICLE_TYPE_ENDPOINT, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            return true;
        } catch (error) {
            console.error("Error creando tipo de vehículo:", error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: async () => {
                    await createVehicleType(record);
                },
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: async () => {
                    const ok = await createVehicleType(record);
                    if (ok) router.push("/delivery/flota/tipo-de-vehiculo");
                },
                disabled: saving,
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
                onClick: async () => {
                    const ok = await createVehicleType(record);
                    if (ok) setRecord(initial);
                },
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/flota/tipo-de-vehiculo"),
                disabled: saving,
            },
        ],
        [record, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Tipo vehículo
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo tipo vehículo</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <TypeVehicleFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
