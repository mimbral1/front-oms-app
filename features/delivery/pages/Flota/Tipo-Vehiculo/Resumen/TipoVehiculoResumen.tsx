"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { TypeVehicleFields, TypeVehicle } from "@/features/delivery/components/flota/tipo-vehiculo/TypeVehicleFields";
import { useFetchWithAuthDelivery } from "@/lib/http/client";

type ApiVehicleTypeItem = {
    id?: string;
    referenceId?: string | null;
    name?: string | null;
    origin?: string | null;
    type?: string | null;
    icon?: string | null;
    maxShippingQuantity?: number | string | null;
    maxProductQuantity?: number | string | null;
    maxVolume?: number | string | null;
    maxDistance?: number | string | null;
    maxWeight?: number | string | null;
    fuelConsumption?: number | string | null;
    status?: string | null;
    userCreated?: string | null;
    dateCreated?: string | null;
    userModified?: string | null;
    dateModified?: string | null;
    companyId?: string | null;
};

function mapStatus(value: string | null | undefined): "Activo" | "Inactivo" | "" {
    const status = String(value || "").trim().toLowerCase();
    if (status === "active" || status === "activo") return "Activo";
    if (status === "inactive" || status === "inactivo") return "Inactivo";
    return "";
}

function normalizeVehicleType(value: string): string {
    return String(value || "").trim().toLowerCase();
}

function mapApiVehicleTypeToRecord(item: ApiVehicleTypeItem): TypeVehicle {
    const createdDate = item.dateCreated ? new Date(item.dateCreated).toLocaleString("es-CL") : "-";
    const modifiedDate = item.dateModified ? new Date(item.dateModified).toLocaleString("es-CL") : "-";

    return {
        id: String(item.id ?? ""),
        Refid: String(item.referenceId ?? ""),
        name: String(item.name ?? ""),
        motivo: String(item.type ?? ""),
        origin: String(item.origin ?? ""),
        companyId: String(item.companyId ?? ""),
        icono: String(item.icon ?? ""),
        fuelConsumption: String(item.fuelConsumption ?? "0"),
        envios_max: String(item.maxShippingQuantity ?? "0"),
        items_max: String(item.maxProductQuantity ?? "0"),
        volumen_maximo: String(item.maxVolume ?? "0"),
        maxDistance: String(item.maxDistance ?? "0"),
        maxWeight: String(item.maxWeight ?? "0"),
        status: mapStatus(item.status),
        userCreated: String(item.userCreated ?? "-"),
        dateCreated: createdDate,
        userModified: String(item.userModified ?? "-"),
        dateModified: modifiedDate,
        created: {
            user: item.userCreated ?? "-",
            date: createdDate,
        },
        modified: {
            user: item.userModified ?? "-",
            date: modifiedDate,
        },
    };
}

export function TypeVehicleEditView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();

    const [record, setRecord] = useState<TypeVehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!recordId || !token) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadVehicleTypeById = async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuthDelivery<ApiVehicleTypeItem>(`vehicle-type/${recordId}`, {
                    method: "GET",
                });

                const mapped = res ? mapApiVehicleTypeToRecord(res) : null;
                if (mounted) setRecord(mapped);
            } catch (error) {
                console.error("Error cargando tipo de vehículo:", error);
                if (mounted) setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadVehicleTypeById();

        return () => {
            mounted = false;
        };
    }, [recordId, fetchWithAuthDelivery, token]);

    const handleChange = (field: keyof TypeVehicle, value: string) => {
        if (record) setRecord({ ...record, [field]: value });
    };

    const toNumber = (value: string) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const toApiStatus = (value: string): "active" | "inactive" =>
        String(value).trim().toLowerCase() === "activo" ? "active" : "inactive";

    const handleSave = useCallback(async () => {
        if (!record?.id) return;

        const payload = {
            referenceId: record.Refid,
            name: record.name,
            origin: record.origin,
            type: normalizeVehicleType(record.motivo),
            maxShippingQuantity: toNumber(record.envios_max),
            maxProductQuantity: toNumber(record.items_max),
            maxVolume: toNumber(record.volumen_maximo),
            maxDistance: toNumber(record.maxDistance),
            maxWeight: toNumber(record.maxWeight),
            fuelConsumption: toNumber(record.fuelConsumption),
            icon: record.icono,
            status: toApiStatus(record.status),
        };

        setSaving(true);
        try {
            await fetchWithAuthDelivery(`vehicle-type/${record.id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
        } catch (error) {
            console.error("Error actualizando tipo de vehículo:", error);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuthDelivery, record]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: async () => {
                    await handleSave();
                    router.push("/delivery/flota/tipo-de-vehiculo");
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
                // onClick: () => router.push("/Pricing/Price/New"),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/flota/tipo-de-vehiculo"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Tipo vehículo
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.name ?? "—"}</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? {
                    text: record.status,
                    variant: record.status === "Activo" ? "success" : "warning",
                }
                : undefined,
        } as PageHeaderProps),
        [record?.name, headerActions]
    );

    if (loading) return <p className="p-4">Cargando…</p>;
    if (!record)
        return <p className="p-4 text-red-500">Registro no encontrado</p>;

    return (
        <div className="p-6">
            <TypeVehicleFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
