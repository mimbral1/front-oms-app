"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { EsquemaEntregaFields } from "@/features/delivery/components/configuraciones/esquemas-entrega/EsquemaEntregaFields";
import type { EsquemaEntregaRecord } from "@/features/delivery/components/configuraciones/esquemas-entrega/EsquemaEntregaFields"; // tipos de Fields
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

const WINDOW_SCHEMA_URL = `${BASE_DELIVERY_SERVICE}/window-schema`;

type WindowSchemaWindow = {
    startDay?: string | number | null;
    endDay?: string | number | null;
    startTime?: string | null;
    endTime?: string | null;
    maxShippingQuantity?: number | null;
    maxPackageQuantity?: number | null;
    maxProductQuantity?: number | null;
};

type WindowSchemaNormalizedWindow = {
    dayOfWeek?: string | number | null;
    startTime?: string | null;
    endTime?: string | null;
    maxShippingQuantity?: number | null;
    maxPackageQuantity?: number | null;
    maxProductQuantity?: number | null;
};

type WindowSchemaResponse = {
    id?: string;
    name?: string | null;
    timezone?: string | null;
    defaultProductQuantity?: number | null;
    defaultShippingQuantity?: number | null;
    defaultPackageQuantity?: number | null;
    defaultExtraDeliveryCost?: number | null;
    defaultMinFulfillmentTime?: number | null;
    status?: string | null;
    dateCreated?: string | null;
    userCreated?: string | null;
    dateModified?: string | null;
    userModified?: string | null;
    windows?: WindowSchemaWindow[] | string | null;
    normalizedWindows?: WindowSchemaNormalizedWindow[] | null;
};

const DAY_INDEX_TO_KEY: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
};

const DAY_NAME_TO_KEY: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
};

const toNumber = (value: unknown, fallback = 0): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const parseWindows = (value: unknown): WindowSchemaWindow[] => {
    if (Array.isArray(value)) return value as WindowSchemaWindow[];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? (parsed as WindowSchemaWindow[]) : [];
        } catch {
            return [];
        }
    }
    return [];
};

const mapDay = (day: unknown): string | null => {
    if (typeof day === "number") return DAY_INDEX_TO_KEY[day] ?? null;
    const normalized = String(day || "").trim().toLowerCase();
    if (!normalized) return null;
    if (DAY_NAME_TO_KEY[normalized]) return DAY_NAME_TO_KEY[normalized];
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? DAY_INDEX_TO_KEY[numeric] ?? null : null;
};

const getRecordFromResponse = (raw: WindowSchemaResponse): EsquemaEntregaRecord => {
    const status = String(raw.status || "").toLowerCase() === "inactive" ? "Inactivo" : "Activo";

    const normalizedWindows = Array.isArray(raw.normalizedWindows) ? raw.normalizedWindows : [];
    const parsedWindows = parseWindows(raw.windows);

    const windowsSource = normalizedWindows.length
        ? normalizedWindows.map((w) => ({
            day: mapDay(w.dayOfWeek),
            startTime: String(w.startTime || "09:00"),
            endTime: String(w.endTime || "18:00"),
            maxShippingQuantity: toNumber(w.maxShippingQuantity, toNumber(raw.defaultShippingQuantity, 0)),
            maxPackageQuantity: toNumber(w.maxPackageQuantity, toNumber(raw.defaultPackageQuantity, 0)),
            maxProductQuantity: toNumber(w.maxProductQuantity, toNumber(raw.defaultProductQuantity, 0)),
        }))
        : parsedWindows.map((w) => ({
            day: mapDay(w.startDay),
            startTime: String(w.startTime || "09:00"),
            endTime: String(w.endTime || "18:00"),
            maxShippingQuantity: toNumber(w.maxShippingQuantity, toNumber(raw.defaultShippingQuantity, 0)),
            maxPackageQuantity: toNumber(w.maxPackageQuantity, toNumber(raw.defaultPackageQuantity, 0)),
            maxProductQuantity: toNumber(w.maxProductQuantity, toNumber(raw.defaultProductQuantity, 0)),
        }));

    const uniqueDays = Array.from(new Set(windowsSource.map((w) => w.day).filter(Boolean))) as string[];
    const firstWindow = windowsSource[0];

    return {
        nombre: String(raw.name || ""),
        timezone: String(raw.timezone || "America/Santiago"),
        dias: uniqueDays,
        start: firstWindow?.startTime || "09:00",
        end: firstWindow?.endTime || "18:00",
        maxEnviosBase: toNumber(raw.defaultShippingQuantity, 0),
        maxBultosBase: toNumber(raw.defaultPackageQuantity, 0),
        maxItemsBase: toNumber(raw.defaultProductQuantity, 0),
        estado: status,
        defaultsMaxEnvios: toNumber(raw.defaultShippingQuantity, 0),
        defaultsMaxItems: toNumber(raw.defaultProductQuantity, 0),
        defaultsMaxBultos: toNumber(raw.defaultPackageQuantity, 0),
        costoExtraEntrega: toNumber(raw.defaultExtraDeliveryCost, 0),
        ventanas: windowsSource.map((w) => ({
            dayOfWeek: w.day || "Monday",
            start: w.startTime,
            end: w.endTime,
            maxEnvios: toNumber(w.maxShippingQuantity, 0),
            maxBultos: toNumber(w.maxPackageQuantity, 0),
            maxItems: toNumber(w.maxProductQuantity, 0),
        })),
        createdByUsername: raw.userCreated || "-",
        createdByEmail: "-",
        createdAt: raw.dateCreated || "-",
        modifiedByUsername: raw.userModified || "-",
        modifiedByEmail: "-",
        modifiedAt: raw.dateModified || "-",
    };
};

export default function EsquemaEntregaResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);

    const [record, setRecord] = useState<EsquemaEntregaRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchById = useCallback(async () => {
        if (!recordId) {
            setRecord(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${WINDOW_SCHEMA_URL}/${encodeURIComponent(recordId)}`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al cargar esquema ${recordId}`);
            }

            const payload = (await response.json()) as WindowSchemaResponse;
            setRecord(getRecordFromResponse(payload));
        } catch (e) {
            console.error("Error al cargar esquema de entrega", e);
            setRecord(null);
            setError("No se encontró el esquema.");
        } finally {
            setLoading(false);
        }
    }, [recordId]);

    useEffect(() => {
        fetchById();
    }, [fetchById]);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("apply") },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("save") },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/configuraciones/esquemas-entrega") },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Esquemas de entrega</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? { text: record.estado, variant: record.estado === "Inactivo" ? "warning" : "success" }
                : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, record]
    );

    if (loading) return <div className="p-6 text-gray-600">Cargando esquema...</div>;
    if (!record) return <div className="p-6 text-red-600">{error || "No se encontró el esquema."}</div>;

    const handleChange = (field: keyof EsquemaEntregaRecord, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    return (
        <div className="p-6 bg-white">
            <EsquemaEntregaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
