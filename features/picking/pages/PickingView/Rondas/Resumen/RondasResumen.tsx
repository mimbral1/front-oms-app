"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    XCircleIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { RondasFields, Ronda } from "@/features/picking/components/pickingview/rondas/RondasFields";
import {
    PICKING_PICKERS_BY_CONFIG_API,
    PICKING_SESSIONS_API,
} from "@/lib/http/endpoints";

const SESSION_API_BASE = PICKING_SESSIONS_API;
const PICKERS_BY_CONFIG_API = PICKING_PICKERS_BY_CONFIG_API;

type PickerOption = { label: string; value: string };

type SessionResponse = {
    data?: {
        summary?: {
            sessionId?: string;
            status?: {
                code?: string;
                name?: string;
            };
            resumen?: {
                picker?: {
                    id?: string;
                    name?: string;
                    email?: string;
                };
                pickingPoint?: {
                    id?: string;
                    name?: string;
                };
                ola?: {
                    id?: string;
                    display?: string;
                    dateStart?: string;
                    dateEnd?: string;
                };
                otros?: {
                    completed?: boolean;
                    repickedItems?: boolean;
                    skippedItems?: boolean;
                    hasCandidateItems?: boolean;
                };
            };
        };
        items?: Array<{
            items?: Array<{
                sessionItemId?: string;
            }>;
        }>;
        orders?: Array<{
            shippingTypeCode?: string;
            shippingTypeCodes?: string[];
            delivery?: {
                type?: string;
            };
        }>;
    };
};

type PickersByConfigResponse = {
    items?: Array<{
        pickerId?: string;
        userName?: string;
        userEmail?: string;
    }>;
};

const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

const mockRecord: Ronda = {
    id: "#250723-X9LBPP",
    pickerId: "1",
    pickerNombre: "Manuel Vilche",
    pickerEmail: "manuel.vilche@janiscommerce.com",
    pickingPoint: "Palermo",
    olaDisplay: "250724-47VX62",
    olaInicio: "2025/07/24 09:00",
    olaFin: "2025/07/24 13:00",
    completado: true,
    itemsRepickeados: false,
    itemsSalteados: false,
    hasItemsCandidate: false,
    status: "Pendiente",
};

export default function RondasResumenView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const [record, setRecord] = useState<Ronda>({ ...mockRecord });
    const [pickerOptions, setPickerOptions] = useState<PickerOption[]>([]);
    const [loading, setLoading] = useState(false);

    const handleChange = <K extends keyof Ronda>(field: K, value: Ronda[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        const sessionId = params?.id;
        if (!sessionId || typeof sessionId !== "string") return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const sessionRes = await fetch(`${SESSION_API_BASE}/${encodeURIComponent(sessionId)}/summary`, {
                    method: "GET",
                    cache: "no-store",
                });

                const sessionPayload = (await sessionRes.json()) as SessionResponse;

                const summary = sessionPayload?.data?.summary;
                const resumen = summary?.resumen;
                const picker = resumen?.picker;
                const ola = resumen?.ola;
                const otros = resumen?.otros;
                const groupedItems = sessionPayload?.data?.items || [];
                const orders = sessionPayload?.data?.orders || [];
                if (!summary || !resumen || cancelled) return;

                const shippingTypeCodeSet = new Set<string>();
                orders.forEach((order) => {
                    if (order?.shippingTypeCode) {
                        shippingTypeCodeSet.add(order.shippingTypeCode);
                    }

                    (order?.shippingTypeCodes || []).forEach((code) => {
                        if (code) shippingTypeCodeSet.add(code);
                    });

                    const deliveryType = String(order?.delivery?.type || "").toLowerCase();
                    if (deliveryType.includes("domicilio")) {
                        shippingTypeCodeSet.add("HOME_DELIVERY");
                    }
                });

                const shippingTypeCodes =
                    shippingTypeCodeSet.size > 0
                        ? Array.from(shippingTypeCodeSet)
                        : ["HOME_DELIVERY"];

                if (resumen?.pickingPoint?.id) {
                    const qs = new URLSearchParams({
                        pickingPointId: resumen.pickingPoint.id,
                        shippingTypeCodes: shippingTypeCodes.join(","),
                        validateSession: "true",
                    });

                    const pickersRes = await fetch(`${PICKERS_BY_CONFIG_API}?${qs.toString()}`, {
                        method: "GET",
                        cache: "no-store",
                    });

                    const pickersPayload = (await pickersRes.json()) as PickersByConfigResponse;
                    const nextOptions = (pickersPayload?.items || [])
                        .filter((item) => item?.pickerId)
                        .map((item) => ({
                            value: item.pickerId as string,
                            label: `${item.userName || "Sin nombre"} - ${item.userEmail || "Sin email"}`,
                        }));

                    setPickerOptions(nextOptions);
                } else {
                    setPickerOptions([]);
                }

                const hasItems = groupedItems.some((group) => (group.items || []).length > 0);

                const next: Ronda = {
                    id: summary.sessionId || sessionId,
                    pickerId: picker?.id || "",
                    pickerNombre: picker?.name || "",
                    pickerEmail: picker?.email || "",
                    pickingPoint: resumen?.pickingPoint?.name || "-",
                    olaDisplay: ola?.display || ola?.id || "-",
                    olaInicio: formatDate(ola?.dateStart),
                    olaFin: formatDate(ola?.dateEnd || null),
                    completado: !!otros?.completed,
                    itemsRepickeados: !!otros?.repickedItems,
                    itemsSalteados: !!otros?.skippedItems,
                    hasItemsCandidate: typeof otros?.hasCandidateItems === "boolean"
                        ? otros.hasCandidateItems
                        : hasItems,
                    status: summary.status?.name || summary.status?.code || "Pendiente",
                };

                setRecord(next);
            } catch (error) {
                console.error("Error cargando ronda:", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [params?.id]);

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => { },
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-5 w-5" />,
                onClick: () => router.push("/picking/rondas"),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/rondas"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Rondas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record.id}
                    </div>
                </div>
            ),
            action: actions,
            status: {
                text: record.status,
                variant: String(record.status).toLowerCase() === "finalizada" ? "success" : "warning",
            },
        } as PageHeaderProps),
        [actions, record.status]
    );

    return (
        <div className="p-6 bg-white">
            {loading ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Cargando ronda...
                </div>
            ) : (
                <RondasFields
                    record={record}
                    onChange={handleChange}
                    pickerOptions={pickerOptions}
                />
            )}
        </div>
    );
}
