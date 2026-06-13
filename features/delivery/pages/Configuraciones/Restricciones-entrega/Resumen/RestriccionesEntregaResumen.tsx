// app/views/Logistica/RestriccionesEntrega/Detail/RestriccionesEntregaResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { DeliveryRestriction, RestriccionesEntregaFields } from "@/features/delivery/components/configuraciones/restricciones-entrega/RestriccionesEntregaFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

const DELIVERY_AREA_AVAILABILITY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/delivery-area-availability`;

/** Estado inicial (mock) */
const EMPTY: DeliveryRestriction = {
    availability: "notAvailable",
    status: "Activo",
    timezone: "",
    days: [],
    windows: [],
    address: "",
    locationCity: "",
    locationState: "",
    locationCountry: "",
    postalCode: "",
    numerationStart: null,
    numerationEnd: null,
};

interface ApiWindow {
    id?: number | string;
    deliveryAreaAvailabilityId?: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
}

interface ApiDeliveryAreaAvailabilityDetail {
    id?: string;
    timezone?: string;
    availability?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    locationStreet?: string;
    locationNumber?: number | null;
    locationPostalCode?: string;
    status?: string;
    windows?: ApiWindow[];
}

interface UpdateDeliveryAreaAvailabilityPayload {
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
            postalCode: string;
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
    status: "active" | "inactive";
}

function unwrapDetailPayload(raw: any): ApiDeliveryAreaAvailabilityDetail {
    if (!raw || typeof raw !== "object") return {};

    const looksLikeDetail = (obj: any) =>
        obj &&
        typeof obj === "object" &&
        (
            "locationPostalCode" in obj ||
            "locationCity" in obj ||
            "locationStreet" in obj ||
            "timezone" in obj ||
            "availability" in obj ||
            "windows" in obj
        );

    if (looksLikeDetail(raw)) return raw;
    if (looksLikeDetail(raw.data)) return raw.data;
    if (looksLikeDetail(raw.result)) return raw.result;
    if (looksLikeDetail(raw.item)) return raw.item;
    if (looksLikeDetail(raw.payload)) return raw.payload;

    return raw;
}

const DAY_LABELS: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
};

const DAY_ORDER: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7,
};

function mapApiAvailability(value?: string): DeliveryRestriction["availability"] {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "available") return "available";
    if (normalized === "not_available" || normalized === "not available" || normalized === "notavailable") return "notAvailable";
    return "notAvailable";
}

function mapApiStatus(value?: string): DeliveryRestriction["status"] {
    return String(value ?? "").trim().toLowerCase() === "active" ? "Activo" : "Inactivo";
}

const DAY_TO_API: Record<string, string> = {
    lunes: "monday",
    martes: "tuesday",
    miercoles: "wednesday",
    "miércoles": "wednesday",
    jueves: "thursday",
    viernes: "friday",
    sabado: "saturday",
    sábado: "saturday",
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

function buildWindowsPayload(record: DeliveryRestriction): UpdateDeliveryAreaAvailabilityPayload["windows"] {
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

function buildUpdatePayload(record: DeliveryRestriction): UpdateDeliveryAreaAvailabilityPayload {
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
                country: String(record.locationCountry ?? "").trim(),
                postalCode: String(record.postalCode ?? "").trim(),
                ...(hasLat ? { lat } : {}),
                ...(hasLng ? { lng } : {}),
            },
        },
        windows: buildWindowsPayload(record),
        status: mapRecordStatus(record.status),
    };
}

function mapApiToRecord(api: ApiDeliveryAreaAvailabilityDetail, fallbackId: string): DeliveryRestriction {
    const windows = Array.isArray(api.windows)
        ? api.windows
            .map((w) => {
                const dayRaw = String(w?.dayOfWeek ?? "").trim().toLowerCase();
                const day = DAY_LABELS[dayRaw] ?? dayRaw;
                const from = String(w?.startTime ?? "").trim();
                const to = String(w?.endTime ?? "").trim();
                if (!day || !from || !to) return null;
                return { day, from, to, maxShippingQty: 50, maxItems: 0, maxPackages: 0 };
            })
            .filter(Boolean) as Array<{ day: string; from: string; to: string; maxShippingQty: number; maxItems: number; maxPackages: number }>
        : [];

    const days = Array.from(
        new Set(
            (Array.isArray(api.windows) ? api.windows : [])
                .map((w) => String(w?.dayOfWeek ?? "").trim().toLowerCase())
                .filter(Boolean)
        )
    )
        .sort((a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99))
        .map((d) => DAY_LABELS[d] ?? d);

    const address = [
        api.locationStreet,
        api.locationCity,
        api.locationState,
        api.locationCountry,
    ]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(", ");

    const locationNumber =
        api.locationNumber == null || Number.isNaN(Number(api.locationNumber))
            ? null
            : Number(api.locationNumber);

    return {
        id: String(api.id ?? fallbackId),
        availability: mapApiAvailability(api.availability),
        status: mapApiStatus(api.status),
        timezone: String(api.timezone ?? ""),
        days,
        windows,
        address,
        locationCity: String(api.locationCity ?? ""),
        locationState: String(api.locationState ?? ""),
        locationCountry: String(api.locationCountry ?? ""),
        postalCode: String(api.locationPostalCode ?? ""),
        numerationStart: locationNumber,
        numerationEnd: locationNumber,
    };
}

export default function RestriccionesEntregaResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<DeliveryRestriction | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Mantener refs estables (evitar loops en header)
    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    /* ---------- cargar detalle real ---------- */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                if (!recordId) {
                    if (mounted) setRecord({ ...EMPTY });
                    return;
                }

                if (!BASE_DELIVERY_SERVICE) {
                    throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
                }

                const response = await fetchWithAuth<any>(
                    `${DELIVERY_AREA_AVAILABILITY_ENDPOINT}/${encodeURIComponent(String(recordId))}`
                );

                const apiDetail = unwrapDetailPayload(response);
                const mapped = mapApiToRecord(apiDetail || {}, String(recordId));
                if (mounted) setRecord(mapped);
            } catch (error) {
                console.error("GET delivery-area-availability/{id} error:", error);
                if (mounted) setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    /* ---------- handlers ---------- */
    const handleChange = (field: keyof DeliveryRestriction, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentId = String(current?.id ?? recordId ?? "").trim();
        if (!current || !currentId) return;

        setSaving(true);
        try {
            const payload = buildUpdatePayload(current);

            await fetchWithAuth<any>(
                `${DELIVERY_AREA_AVAILABILITY_ENDPOINT}/${encodeURIComponent(currentId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                }
            );

            setRecord((prev) => (prev ? { ...prev, status: current.status } : prev));
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth, recordId]);

    /* ---------- acciones header (calcadas) ---------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/configuraciones/restricciones-entrega"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Restricciones de entrega</div>
                    <div className="text-2xl font-semibold text-gray-900">#{id}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? { text: record.status, variant: record.status === "Activo" ? "success" : "gray" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record]
    );

    return (
        <div className="p-6 bg-white">
            {loading || !record ? (
                <div>Cargando…</div>
            ) : (
                <RestriccionesEntregaFields record={record} readOnly={false} onChange={handleChange} />
            )}
        </div>
    );
}
