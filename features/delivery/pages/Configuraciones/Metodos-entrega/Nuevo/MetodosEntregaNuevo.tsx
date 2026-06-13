// app/views/Pricing/Price/New/PriceCreatePage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { DELIVERY_SHIPPING_TYPE_ENDPOINT } from "@/lib/http/endpoints";

import { MetodoEntregaFields, MetodoEntrega } from "@/features/delivery/components/configuraciones/metodos-entrega/MetodosEntregaFields";

type ShippingTypePayload = {
    id?: string;
    refId: string;
    origin: string;
    code: string;
    title: string;
    allowRoutes: boolean;
    allowPackages: boolean;
    allowWindows: boolean;
    minFulfillmentTime: number;
    thresholdEndStatus: string | null;
    thresholdDateReference: string | null;
    thresholdCautionMinutes: number | null;
    thresholdWarningMinutes: number | null;
    thresholdCriticalMinutes: number | null;
    thresholdTriggerCriticalWebhook: boolean | null;
    status: "active" | "inactive";
    needRoute: boolean;
};

const MODALIDAD_CODE_MAP: Record<string, string> = {
    Delivery: "delivery",
    "Express Delivery": "expressDelivery",
    "Store Pick Up": "storePickUp",
    "Drive Through": "driveThrough",
};

const INITIAL_METODO_ENTREGA: MetodoEntrega = {
    id: "",
    refId: "",
    modalidad: "Delivery",
    rutas: "",
    bultos: "",
    titulo: "",
    programado: "",
    creacion: "",
    modificado: "",
    status: "Inactivo",
    origen: "",
    tiempo_min_fulfillment: "",
    needRoute: "true",
    thresholdendStatus: "readyForDelivery",
    thresholddateReference: "initialDate",
    thresholdcautionInMinutes: "180",
    thresholdwarningInMinutes: "120",
    thresholdcriticalInMinutes: "60",
    thresholdtriggerCriticalWebhook: "true",
};

export function MetodoEntregaCreateView() {
    const router = useRouter();

    const [record, setRecord] = useState<MetodoEntrega>(INITIAL_METODO_ENTREGA);
    const [isSaving, setIsSaving] = useState(false);

    const toBoolean = (value: string): boolean => String(value).toLowerCase() === "true";
    const toNullableString = (value: string): string | null => {
        const trimmed = String(value || "").trim();
        return trimmed ? trimmed : null;
    };
    const toNullableNumber = (value: string): number | null => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    };
    const toNullableBoolean = (value: string): boolean | null => {
        const normalized = String(value || "").trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
        return null;
    };

    const buildPayload = (value: MetodoEntrega): ShippingTypePayload => {
        const minFulfillment = Number(value.tiempo_min_fulfillment);
        const status = String(value.status).toLowerCase() === "activo" || String(value.status).toLowerCase() === "active"
            ? "active"
            : "inactive";

        const payload: ShippingTypePayload = {
            refId: value.refId.trim(),
            origin: value.origen.trim(),
            code: MODALIDAD_CODE_MAP[value.modalidad] || value.modalidad.trim().toLowerCase().replace(/\s+/g, ""),
            title: value.titulo.trim(),
            allowRoutes: toBoolean(value.rutas),
            allowPackages: toBoolean(value.bultos),
            allowWindows: toBoolean(value.programado),
            minFulfillmentTime: Number.isFinite(minFulfillment) ? minFulfillment : 0,
            thresholdEndStatus: toNullableString(value.thresholdendStatus),
            thresholdDateReference: toNullableString(value.thresholddateReference),
            thresholdCautionMinutes: toNullableNumber(value.thresholdcautionInMinutes),
            thresholdWarningMinutes: toNullableNumber(value.thresholdwarningInMinutes),
            thresholdCriticalMinutes: toNullableNumber(value.thresholdcriticalInMinutes),
            thresholdTriggerCriticalWebhook: toNullableBoolean(value.thresholdtriggerCriticalWebhook),
            status,
            needRoute: toBoolean(value.needRoute),
        };

        const id = value.id?.trim();
        if (id) {
            payload.id = id;
        }

        return payload;
    };

    const createShippingType = async (value: MetodoEntrega) => {
        setIsSaving(true);
        try {
            const payload = buildPayload(value);
            const response = await fetch(DELIVERY_SHIPPING_TYPE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al crear metodo de entrega`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: keyof MetodoEntrega, value: string) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
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
                        await createShippingType(record);
                    } catch (error) {
                        console.error("Error al crear metodo de entrega", error);
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
                        await createShippingType(record);
                        router.push("/delivery/configuraciones/metodos-entrega");
                    } catch (error) {
                        console.error("Error al guardar metodo de entrega", error);
                    }
                },
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                disabled: isSaving,
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: async () => {
                    try {
                        await createShippingType(record);
                        setRecord({ ...INITIAL_METODO_ENTREGA });
                    } catch (error) {
                        console.error("Error al guardar y crear nuevo", error);
                    }
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/Pricing/Price"),
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
                    <div className="text-2xl font-semibold text-gray-900">Nuevo método entrega</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <MetodoEntregaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
