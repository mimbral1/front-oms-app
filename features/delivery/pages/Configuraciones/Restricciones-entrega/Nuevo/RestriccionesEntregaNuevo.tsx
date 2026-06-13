// app/views/Logistica/RestriccionesEntrega/New/RestriccionesEntregaNuevoView.tsx
"use client";

import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { DeliveryRestriction, RestriccionesEntregaFields } from "@/features/delivery/components/configuraciones/restricciones-entrega/RestriccionesEntregaFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

const DELIVERY_AREA_AVAILABILITY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/delivery-area-availability`;

interface CreateDeliveryAreaAvailabilityPayload {
    timezone: string;
    availability: "available" | "not_available";
    location: {
        type: "address";
        value: {
            street: string;
            number: {
                start: number;
                end: number;
            };
            city: string;
            state: string;
            country: string;
            lat?: number;
            lng?: number;
        };
    };
    windows: Array<{
        days: string[];
        timeSlots: Array<{
            start: string;
            end: string;
        }>;
    }>;
    unavailableWindows: Record<string, Array<{ start: string; end: string }>>;
    status: "active" | "inactive";
}

const DAY_TO_API: Record<string, string> = {
    lunes: "monday",
    martes: "tuesday",
    miercoles: "wednesday",
    "miércoles": "wednesday",
    jueves: "thursday",
    viernes: "friday",
    sabado: "saturday",
    "sábado": "saturday",
    domingo: "sunday",
};

function mapRecordAvailability(value?: string): "available" | "not_available" {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "available") return "available";
    return "not_available";
}

function mapRecordStatus(value?: DeliveryRestriction["status"]): "active" | "inactive" {
    return value === "Activo" ? "active" : "inactive";
}

function normalizeApiDay(value?: string): string | null {
    const normalized = String(value ?? "").trim().toLowerCase();
    return DAY_TO_API[normalized] ?? null;
}

function buildWindowsPayload(record: DeliveryRestriction): CreateDeliveryAreaAvailabilityPayload["windows"] {
    const grouped = new Map<string, { days: Set<string>; start: string; end: string }>();

    (record.windows ?? []).forEach((window) => {
        const start = String(window?.from ?? "").trim();
        const end = String(window?.to ?? "").trim();
        const day = normalizeApiDay(window?.day);
        if (!start || !end || !day) return;

        const key = `${start}-${end}`;
        if (!grouped.has(key)) {
            grouped.set(key, { days: new Set<string>(), start, end });
        }
        grouped.get(key)?.days.add(day);
    });

    return Array.from(grouped.values()).map((entry) => ({
        days: Array.from(entry.days),
        timeSlots: [{ start: entry.start, end: entry.end }],
    }));
}

function buildUnavailableWindowsPayload(record: DeliveryRestriction): CreateDeliveryAreaAvailabilityPayload["unavailableWindows"] {
    const grouped: Record<string, Array<{ start: string; end: string }>> = {};

    (record.windows ?? []).forEach((window) => {
        const day = normalizeApiDay(window?.day);
        const start = String(window?.from ?? "").trim();
        const end = String(window?.to ?? "").trim();
        if (!day || !start || !end) return;

        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({ start, end });
    });

    return grouped;
}

function buildCreatePayload(record: DeliveryRestriction): CreateDeliveryAreaAvailabilityPayload {
    const start = record.numerationStart ?? 0;
    const end = record.numerationEnd ?? start;
    const lat = Number(record.locationLat);
    const lng = Number(record.locationLng);
    const hasLat = Number.isFinite(lat);
    const hasLng = Number.isFinite(lng);

    return {
        timezone: String(record.timezone ?? "").trim(),
        availability: mapRecordAvailability(record.availability),
        location: {
            type: "address",
            value: {
                street: String(record.address ?? "").trim(),
                number: {
                    start: Number.isFinite(Number(start)) ? Number(start) : 0,
                    end: Number.isFinite(Number(end)) ? Number(end) : 0,
                },
                city: String(record.locationCity ?? "").trim(),
                state: String(record.locationState ?? "").trim(),
                country: "Chile",
                ...(hasLat ? { lat } : {}),
                ...(hasLng ? { lng } : {}),
            },
        },
        windows: buildWindowsPayload(record),
        unavailableWindows: buildUnavailableWindowsPayload(record),
        status: mapRecordStatus(record.status),
    };
}

// Registro inicial vacío (mocks)
const initialRecord: DeliveryRestriction = {
    availability: "available",
    status: "Inactivo",
    timezone: "America/Santiago",
    days: [],
    windows: [{ day: "Lunes", from: "08:00", to: "19:00", maxShippingQty: 50, maxItems: 0, maxPackages: 0 }],
    address: "",
    locationCity: "",
    locationState: "",
    locationCountry: "Chile",
    locationLat: null,
    locationLng: null,
    postalCode: "",
    numerationStart: null,
    numerationEnd: null,
};

export default function RestriccionesEntregaNuevoView() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();
    const [record, setRecord] = useState<DeliveryRestriction>({ ...initialRecord });

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const handleChange = (field: keyof DeliveryRestriction, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const handleCreate = useCallback(async (keepOpen: boolean) => {
        const current = recordRef.current;
        if (!current) return;

        if (!BASE_DELIVERY_SERVICE) {
            throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
        }

        const payload = buildCreatePayload(current);
        await fetchWithAuth<any>(DELIVERY_AREA_AVAILABILITY_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (keepOpen) {
            setRecord({ ...initialRecord });
            return;
        }

        router.push("/delivery/configuraciones/restricciones-entrega");
    }, [fetchWithAuth, router]);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => {
                    void handleCreate(false);
                },
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => {
                    void handleCreate(true);
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/configuraciones/restricciones-entrega") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Restricciones de entrega</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <RestriccionesEntregaFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
