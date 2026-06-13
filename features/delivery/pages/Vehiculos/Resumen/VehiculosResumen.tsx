"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { VehiculosFields, Vehiculos } from "@/features/delivery/components/vehiculos/VehiculoFields";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

type ApiVehicleDetailItem = {
    id?: string;
    refId?: string | null;
    referenceId?: string | null;
    name?: string | null;
    companyId?: string | null;
    plate?: string | null;
    brand?: string | null;
    model?: string | null;
    year?: number | string | null;
    capacity?: number | string | null;
    vehicleTypeId?: string | null;
    companyName?: string | null;
    status?: string | null;
    dateModified?: string | null;
};

type ApiOptionItem = {
    id?: string | null;
    companyId?: string | null;
    vehicleTypeId?: string | null;
    name?: string | null;
    companyName?: string | null;
};

type SelectOption = {
    value: string;
    label: string;
};

function mergeOptions(base: SelectOption[], extra: SelectOption[]): SelectOption[] {
    const map = new Map<string, string>();

    for (const option of base) {
        const key = option.value.trim().toLowerCase();
        if (key && option.label) map.set(key, option.label);
    }
    for (const option of extra) {
        const key = option.value.trim().toLowerCase();
        if (key && option.label && !map.has(key)) {
            map.set(key, option.label);
        }
    }

    return Array.from(map.entries()).map(([value, label]) => ({ value: value.toUpperCase(), label }));
}

function mapStatus(value: string | null | undefined): "Activo" | "Inactivo" {
    const status = String(value || "").trim().toLowerCase();
    return status === "inactive" || status === "inactivo" ? "Inactivo" : "Activo";
}

function mapApiVehicleToRecord(item: ApiVehicleDetailItem): Vehiculos {
    return {
        ID: String(item.id ?? ""),
        type: String(item.vehicleTypeId ?? "-"),
        refID: String(item.refId ?? item.referenceId ?? "-"),
        name: String(item.name ?? "-"),
        company: String(item.companyId ?? "-"),
        placa: String(item.plate ?? "-"),
        model: String(item.model ?? "-"),
        brand: String(item.brand ?? "-"),
        year: String(item.year ?? "-"),
        capacity: String(item.capacity ?? "0"),
        user: {
            img: "",
            name: "Sistema",
            email: "-",
        },
        modified: String(item.dateModified ?? ""),
        status: mapStatus(item.status),
    };
}

export function VehiculosEditView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();

    const [record, setRecord] = useState<Vehiculos | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyOptions, setCompanyOptions] = useState<SelectOption[]>([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState<SelectOption[]>([]);

    const toOptionList = (raw: any): SelectOption[] => {
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
    };

    useEffect(() => {
        if (!token) return;

        let mounted = true;

        const loadSelectOptions = async () => {
            try {
                const [companiesRes, vehicleTypesRes] = await Promise.all([
                    fetchWithAuthDelivery<any>(`${BASE_DELIVERY_SERVICE}/company`, { method: "GET" }),
                    fetchWithAuthDelivery<any>(`${BASE_DELIVERY_SERVICE}/vehicle-type`, { method: "GET" }),
                ]);

                if (!mounted) return;
                setCompanyOptions((prev) => mergeOptions(toOptionList(companiesRes), prev));
                setVehicleTypeOptions(toOptionList(vehicleTypesRes));
            } catch (error) {
                console.error("Error cargando catálogos de vehículo:", error);
                if (!mounted) return;
                setCompanyOptions([]);
                setVehicleTypeOptions([]);
            }
        };

        loadSelectOptions();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuthDelivery, token]);

    useEffect(() => {
        if (!recordId || !token) {
            setLoading(false);
            return;
        }

        let mounted = true;

        const loadVehicleById = async () => {
            setLoading(true);
            try {
                const res = await fetchWithAuthDelivery<ApiVehicleDetailItem>(`vehicle/${recordId}`, {
                    method: "GET",
                });

                const mapped = res ? mapApiVehicleToRecord(res) : null;
                if (mounted) {
                    setRecord(mapped);

                    const fallbackCompanyOption: SelectOption[] =
                        res?.companyId && res?.companyName
                            ? [{ value: String(res.companyId), label: String(res.companyName) }]
                            : [];
                    if (fallbackCompanyOption.length > 0) {
                        setCompanyOptions((prev) => mergeOptions(prev, fallbackCompanyOption));
                    }
                }
            } catch (error) {
                console.error("Error cargando vehículo:", error);
                if (mounted) setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadVehicleById();

        return () => {
            mounted = false;
        };
    }, [recordId, fetchWithAuthDelivery, token]);

    const handleChange = (field: keyof Vehiculos, value: string) => {
        if (record) setRecord({ ...record, [field]: value });
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

    const handleSave = useCallback(async () => {
        if (!record?.ID) return false;

        const payload = {
            refId: toRefId(record.refID),
            name: record.name,
            companyId: record.company,
            plate: record.placa,
            brand: record.brand,
            model: record.model,
            year: toNumber(record.year),
            capacity: toNumber(record.capacity),
            vehicleTypeId: record.type,
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
            status: toApiStatus(record.status),
        };

        setSaving(true);
        try {
            await fetchWithAuthDelivery(`${BASE_DELIVERY_SERVICE}/vehicle/${record.ID}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            return true;
        } catch (error) {
            console.error("Error actualizando vehículo:", error);
            return false;
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
                    const ok = await handleSave();
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
                // onClick: () => router.push("/Pricing/Price/New"),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/flota/vehiculos"),
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
                        Vehículo
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
