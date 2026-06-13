"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { DELIVERY_SHIPPING_TYPE_ENDPOINT } from "@/lib/http/endpoints";

import { MetodoEntregaFields, MetodoEntrega } from "@/features/delivery/components/configuraciones/metodos-entrega/MetodosEntregaFields";

type ApiShippingType = {
    id?: string | null;
    refId?: string | null;
    origin?: string | null;
    code?: string | null;
    title?: string | null;
    allowRoutes?: boolean | null;
    allowPackages?: boolean | null;
    allowWindows?: boolean | null;
    minFulfillmentTime?: number | null;
    thresholdEndStatus?: string | null;
    thresholdDateReference?: string | null;
    thresholdCautionMinutes?: number | null;
    thresholdWarningMinutes?: number | null;
    thresholdCriticalMinutes?: number | null;
    thresholdTriggerCriticalWebhook?: boolean | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    needRoute?: boolean | null;
};

type UpdateShippingTypePayload = {
    refId: string;
    origin: string;
    code: string;
    title: string;
    allowRoutes: boolean;
    allowPackages: boolean;
    allowWindows: boolean;
    minFulfillmentTime: number;
    status: "active" | "inactive";
    needRoute: boolean;
};

const CODE_MODALIDAD_MAP: Record<string, string> = {
    delivery: "Delivery",
    expressDelivery: "Express Delivery",
    storePickUp: "Store Pick Up",
    driveThrough: "Drive Through",
};

const MODALIDAD_CODE_MAP: Record<string, string> = {
    Delivery: "delivery",
    "Express Delivery": "expressDelivery",
    "Store Pick Up": "storePickUp",
    "Drive Through": "driveThrough",
};

const toFlag = (value?: boolean | null): string => (value ? "true" : "false");
const toText = (value?: string | null): string => String(value || "");
const toNumericText = (value?: number | null): string =>
    typeof value === "number" && Number.isFinite(value) ? String(value) : "";
const toBoolean = (value: string): boolean => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "true" || normalized === "si" || normalized === "sí" || normalized === "yes";
};

const mapApiToRecord = (item: ApiShippingType): MetodoEntrega => {
    const rawCode = toText(item.code);
    const modalidad = CODE_MODALIDAD_MAP[rawCode] || rawCode;
    const status = String(item.status || "").toLowerCase() === "active" ? "Activo" : "Inactivo";

    return {
        id: toText(item.id),
        refId: toText(item.refId),
        modalidad,
        rutas: toFlag(item.allowRoutes),
        bultos: toFlag(item.allowPackages),
        titulo: toText(item.title),
        programado: toFlag(item.allowWindows),
        creacion: toText(item.dateCreated),
        modificado: toText(item.dateModified),
        status,
        origen: toText(item.origin),
        tiempo_min_fulfillment: toNumericText(item.minFulfillmentTime),
        needRoute: toFlag(item.needRoute),
        thresholdendStatus: toText(item.thresholdEndStatus),
        thresholddateReference: toText(item.thresholdDateReference),
        thresholdcautionInMinutes: toNumericText(item.thresholdCautionMinutes),
        thresholdwarningInMinutes: toNumericText(item.thresholdWarningMinutes),
        thresholdcriticalInMinutes: toNumericText(item.thresholdCriticalMinutes),
        thresholdtriggerCriticalWebhook: toFlag(item.thresholdTriggerCriticalWebhook),
    };
};

export function MetodoEntregaEditView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<MetodoEntrega | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const run = async () => {
            if (!recordId) {
                setRecord(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadError(null);
            try {
                const response = await fetch(`${DELIVERY_SHIPPING_TYPE_ENDPOINT}/${encodeURIComponent(recordId)}`, {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} al cargar metodo de entrega ${recordId}`);
                }

                const payload = (await response.json()) as ApiShippingType;
                setRecord(mapApiToRecord(payload));
            } catch (error) {
                setRecord(null);
                setLoadError(error instanceof Error ? error.message : "Error al cargar el metodo de entrega");
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [recordId]);

    const handleChange = (field: keyof MetodoEntrega, value: string) => {
        if (record) setRecord({ ...record, [field]: value });
    };

    const buildUpdatePayload = (value: MetodoEntrega): UpdateShippingTypePayload => {
        const minFulfillment = Number(value.tiempo_min_fulfillment);
        const status: "active" | "inactive" =
            String(value.status).toLowerCase() === "activo" || String(value.status).toLowerCase() === "active"
                ? "active"
                : "inactive";

        return {
            refId: value.refId.trim(),
            origin: value.origen.trim(),
            code: MODALIDAD_CODE_MAP[value.modalidad] || value.modalidad.trim().toLowerCase().replace(/\s+/g, ""),
            title: value.titulo.trim(),
            allowRoutes: toBoolean(value.rutas),
            allowPackages: toBoolean(value.bultos),
            allowWindows: toBoolean(value.programado),
            minFulfillmentTime: Number.isFinite(minFulfillment) ? minFulfillment : 0,
            status,
            needRoute: toBoolean(value.needRoute),
        };
    };

    const updateShippingType = async () => {
        if (!record || !record.id) return;

        setIsSaving(true);
        try {
            const payload = buildUpdatePayload(record);
            const response = await fetch(`${DELIVERY_SHIPPING_TYPE_ENDPOINT}/${encodeURIComponent(record.id)}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al actualizar metodo de entrega ${record.id}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                disabled: isSaving,
                onClick: async () => {
                    try {
                        await updateShippingType();
                    } catch (error) {
                        console.error("Error al aplicar cambios", error);
                    }
                },
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                disabled: isSaving,
                onClick: async () => {
                    try {
                        await updateShippingType();
                        router.push("/delivery/configuraciones/metodos-entrega");
                    } catch (error) {
                        console.error("Error al guardar cambios", error);
                    }
                },
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
                onClick: () => router.push("/delivery/configuraciones/metodos-entrega"),
            },
        ],
        [isSaving, record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Método entrega
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.refId ?? "—"}</div>
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
        [record?.refId, headerActions]
    );

    if (loading) return <p className="p-4">Cargando…</p>;
    if (loadError) return <p className="p-4 text-red-500">{loadError}</p>;
    if (!record)
        return <p className="p-4 text-red-500">Registro no encontrado</p>;

    return (
        <div className="p-6 bg-white">
            <MetodoEntregaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
