// app/views/Pricing/Price/New/PriceCreatePage.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { VehiculosFields, Vehiculos } from "@/features/delivery/components/vehiculos/VehiculoFields";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import {
    DELIVERY_COMPANY_ENDPOINT,
    DELIVERY_VEHICLE_ENDPOINT,
    DELIVERY_VEHICLE_TYPE_ENDPOINT,
} from "@/lib/http/endpoints";

type ApiOptionItem = {
    id?: string | null;
    companyId?: string | null;
    vehicleTypeId?: string | null;
    name?: string | null;
    companyName?: string | null;
    maxWeight?: number | string | null;
};

type SelectOption = {
    value: string;
    label: string;
};

function toOptionList(raw: any): SelectOption[] {
    const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.items)
                ? raw.data.items
                : Array.isArray(raw?.items)
                    ? raw.items
                    : [];

    const map = new Map<string, string>();

    for (const item of list as ApiOptionItem[]) {
        const rawValue = String(item?.id ?? item?.companyId ?? item?.vehicleTypeId ?? "").trim();
        const rawLabel = String(item?.name ?? item?.companyName ?? "").trim();
        if (!rawValue || !rawLabel) continue;

        const key = rawValue.toLowerCase();
        if (!map.has(key)) map.set(key, rawLabel);
    }

    return Array.from(map.entries()).map(([value, label]) => ({ value: value.toUpperCase(), label }));
}

function toVehicleTypeMaxWeightMap(raw: any): Record<string, string> {
    const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.items)
                ? raw.data.items
                : Array.isArray(raw?.items)
                    ? raw.items
                    : [];

    const map: Record<string, string> = {};

    for (const item of list as ApiOptionItem[]) {
        const rawValue = String(item?.id ?? item?.vehicleTypeId ?? "").trim().toLowerCase();
        if (!rawValue) continue;

        const weight = Number(item?.maxWeight);
        if (!Number.isFinite(weight)) continue;

        map[rawValue] = String(weight);
    }

    return map;
}

export function VehiculosCreateView() {
    const router = useRouter();
    const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();

    const initial: Vehiculos = {
        ID: "",
        type: "",
        refID: "",
        name: "",
        company: "",
        placa: "",
        model: "",
        brand: "",
        year: "",
        capacity: "",
        user: {
            img: "",
            name: "",
            email: "",
        },
        modified: "",
        status: "Inactivo",
    };

    const [record, setRecord] = useState<Vehiculos>(initial);
    const [saving, setSaving] = useState(false);
    const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState<SelectOption[]>([]);
    const [vehicleTypeMaxWeightMap, setVehicleTypeMaxWeightMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!token) return;

        let mounted = true;

        const loadSelectOptions = async () => {
            try {
                const [companiesRes, vehicleTypesRes] = await Promise.all([
                    fetchWithAuthDelivery<any>(DELIVERY_COMPANY_ENDPOINT, { method: "GET" }),
                    fetchWithAuthDelivery<any>(DELIVERY_VEHICLE_TYPE_ENDPOINT, { method: "GET" }),
                ]);

                if (!mounted) return;
                setCompanyOptions(toOptionList(companiesRes));
                setVehicleTypeOptions(toOptionList(vehicleTypesRes));
                setVehicleTypeMaxWeightMap(toVehicleTypeMaxWeightMap(vehicleTypesRes));
            } catch (error) {
                console.error("Error cargando catálogos de vehículo:", error);
                if (!mounted) return;
                setCompanyOptions([]);
                setVehicleTypeOptions([]);
                setVehicleTypeMaxWeightMap({});
            }
        };

        loadSelectOptions();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuthDelivery, token]);

    const handleChange = (field: keyof Vehiculos, value: string) => {
        setRecord((prev) => {
            if (field === "type") {
                const maxWeight = vehicleTypeMaxWeightMap[String(value).trim().toLowerCase()] ?? "";
                return { ...prev, type: value, capacity: maxWeight };
            }
            return { ...prev, [field]: value };
        });
    };

    const toNumber = (value: string) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const toRefId = (value: string) => {
        const normalized = String(value ?? "").trim();
        return normalized === "-" ? "" : normalized;
    };

    const toApiStatus = (value: string): "active" | "inactive" =>
        String(value).trim().toLowerCase() === "activo" ? "active" : "inactive";

    const createVehicle = async (current: Vehiculos) => {
        const payload = {
            refId: toRefId(current.refID),
            name: current.name,
            companyId: current.company,
            plate: current.placa,
            brand: current.brand,
            model: current.model,
            year: toNumber(current.year),
            capacity: toNumber(current.capacity),
            vehicleTypeId: current.type,
            locationStart: {
                formattedAddress: "",
                lat: null,
                lng: null,
            },
            locationEnd: {
                formattedAddress: "",
                lat: null,
                lng: null,
            },
            status: toApiStatus(current.status),
        };

        setSaving(true);
        try {
            await fetchWithAuthDelivery(DELIVERY_VEHICLE_ENDPOINT, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            return true;
        } catch (error) {
            console.error("Error creando vehículo:", error);
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
                    await createVehicle(record);
                },
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: async () => {
                    const ok = await createVehicle(record);
                    if (ok) router.push("/delivery/flota/vehiculos");
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
                    const ok = await createVehicle(record);
                    if (ok) setRecord(initial);
                },
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/flota/vehiculos"),
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
                        Vehículo
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo vehículo</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <VehiculosFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                companyOptions={companyOptions}
                vehicleTypeOptions={vehicleTypeOptions}
            />
        </div>
    );
}
