"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { CarrierGroupFields, type Interval } from "@/features/delivery/components/transportistas/grupotransportistas/CarrierGroupFields";
import { setCarrierGroupIntervalsCache } from "@/features/delivery/pages/Transportistas/GrupoTransportistas/shared/intervals-cache";

type GroupType = "Transportista" | "Otro";
type GroupStatus = "Activo" | "Inactivo";

export interface CarrierGroup {
    id: string;
    name: string;
    timezone: string;
    type: GroupType;
    carriers: string[]; // carrierIds
    days: string[];
    intervals: Interval[];
    status: GroupStatus;
}

type CarrierGroupApiWindowConfiguration = {
    windowSchemaId?: string;
    defaultShippingQuantity?: number | null;
    days?: string[] | null;
    windows?: Array<{
        startTime?: string | null;
        endTime?: string | null;
        maxShippingQuantity?: number | null;
        applyQuotaToCarrierWindow?: boolean | null;
    }> | null;
};

type CarrierGroupApiResponse = {
    id?: string;
    name?: string;
    timezone?: string;
    groupType?: string;
    status?: string;
    carrierIds?: string[] | null;
    locationIds?: string[] | null;
    windowConfiguration?: CarrierGroupApiWindowConfiguration[] | null;
    windows?: WindowSchemaWindow[] | string | null;
    dateCreated?: string | null;
    userCreated?: string | null;
    dateModified?: string | null;
    userModified?: string | null;
};

type WindowSchemaWindow = {
    startDay?: string | number | null;
    endDay?: string | number | null;
    startTime?: string | null;
    endTime?: string | null;
    maxShippingQuantity?: number | null;
    applyQuotaToCarrierWindow?: boolean | null;
};

type WindowSchemaNormalizedWindow = {
    dayOfWeek?: string | number | null;
    startTime?: string | null;
    endTime?: string | null;
    maxShippingQuantity?: number | null;
};

type WindowSchemaResponse = {
    id?: string;
    defaultShippingQuantity?: number | null;
    windows?: WindowSchemaWindow[] | string | null;
    normalizedWindows?: WindowSchemaNormalizedWindow[] | null;
};

const DAY_INDEX_TO_ES: Record<number, string> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
};

const DAY_NAME_TO_ES: Record<string, string> = {
    monday: "Lunes",
    martes: "Martes",
    tuesday: "Martes",
    miercoles: "Miércoles",
    miércoles: "Miércoles",
    wednesday: "Miércoles",
    thursday: "Jueves",
    jueves: "Jueves",
    friday: "Viernes",
    viernes: "Viernes",
    saturday: "Sábado",
    sabado: "Sábado",
    sábado: "Sábado",
    sunday: "Domingo",
    domingo: "Domingo",
};

const DAY_TO_API: Record<string, string> = {
    lunes: "monday",
    monday: "monday",
    martes: "tuesday",
    tuesday: "tuesday",
    miércoles: "wednesday",
    miercoles: "wednesday",
    wednesday: "wednesday",
    jueves: "thursday",
    thursday: "thursday",
    viernes: "friday",
    friday: "friday",
    sábado: "saturday",
    sabado: "saturday",
    saturday: "saturday",
    domingo: "sunday",
    sunday: "sunday",
};

const toHour = (value?: string | null) => {
    if (!value) return "";
    if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toISOString().slice(11, 16);
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

const mapGroupType = (value?: string): GroupType => {
    return String(value || "").trim().toLowerCase() === "carrier" ? "Transportista" : "Otro";
};

const mapGroupStatus = (value?: string): GroupStatus => {
    return String(value || "").trim().toLowerCase() === "active" ? "Activo" : "Inactivo";
};

const mapDayToSpanish = (value: unknown): string | null => {
    if (typeof value === "number") return DAY_INDEX_TO_ES[value] ?? null;

    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return null;

    if (DAY_NAME_TO_ES[normalized]) return DAY_NAME_TO_ES[normalized];

    const maybeNumber = Number(normalized);
    if (Number.isFinite(maybeNumber)) return DAY_INDEX_TO_ES[maybeNumber] ?? null;

    return null;
};

const toApiDay = (day: string): string | null => {
    const normalized = String(day || "").trim().toLowerCase();
    return DAY_TO_API[normalized] ?? null;
};

const mapIntervalsFromSchema = (
    schema: WindowSchemaResponse,
    configDefaultShippingQuantity?: number | null
): Interval[] => {
    const normalizedWindows = Array.isArray(schema.normalizedWindows) ? schema.normalizedWindows : [];
    const baseWindows = normalizedWindows.length
        ? normalizedWindows.map((window) => ({
            day: mapDayToSpanish(window.dayOfWeek),
            start: toHour(window.startTime),
            end: toHour(window.endTime),
            max: Number(window.maxShippingQuantity ?? configDefaultShippingQuantity ?? schema.defaultShippingQuantity ?? 0),
        }))
        : parseWindows(schema.windows).map((window) => ({
            day: mapDayToSpanish(window.startDay),
            start: toHour(window.startTime),
            end: toHour(window.endTime),
            max: Number(window.maxShippingQuantity ?? configDefaultShippingQuantity ?? schema.defaultShippingQuantity ?? 0),
        }));

    if (!baseWindows.length) {
        return [
            {
                days: [],
                windows: [{ start: "", end: "" }],
                max: Number(configDefaultShippingQuantity ?? schema.defaultShippingQuantity ?? 0),
                applyQuotaToCarrierWindow: false,
            },
        ];
    }

    return baseWindows.map((window) => ({
        days: window.day ? [window.day] : [],
        windows: [{ start: window.start, end: window.end }],
        max: Number(window.max || 0),
        applyQuotaToCarrierWindow: false,
    }));
};

const mapIntervalsFallback = (api: CarrierGroupApiResponse): Interval[] => {
    const config = Array.isArray(api.windowConfiguration) ? api.windowConfiguration : [];
    return config.map((item) => ({
        days: [],
        windows: [{ start: "", end: "" }],
        max: Number(item.defaultShippingQuantity ?? 0),
        applyQuotaToCarrierWindow: false,
    }));
};

const mapIntervalsFromCarrierPayload = (api: CarrierGroupApiResponse): Interval[] => {
    const rootWindows = parseWindows(api.windows);
    if (rootWindows.length > 0) {
        return rootWindows.map((window) => ({
            days: (() => {
                const day = mapDayToSpanish(window.startDay);
                return day ? [day] : [];
            })(),
            windows: [{
                start: toHour(window.startTime),
                end: toHour(window.endTime),
            }],
            max: Number(window.maxShippingQuantity ?? 0),
            applyQuotaToCarrierWindow: Boolean(window.applyQuotaToCarrierWindow),
        }));
    }

    const config = Array.isArray(api.windowConfiguration) ? api.windowConfiguration : [];
    const intervals = config.flatMap((item) => {
        const apiDays = Array.isArray(item.days) ? item.days : [];
        const days = apiDays
            .map((day) => mapDayToSpanish(day))
            .filter((day): day is string => Boolean(day));

        const configWindows = Array.isArray(item.windows) ? item.windows : [];
        const usableWindows = configWindows.filter((window) => window.startTime || window.endTime);

        if (usableWindows.length > 0) {
            return usableWindows.map((window) => ({
                days,
                windows: [{
                    start: toHour(window.startTime),
                    end: toHour(window.endTime),
                }],
                max: Number(window.maxShippingQuantity ?? item.defaultShippingQuantity ?? 0),
                applyQuotaToCarrierWindow: Boolean(window.applyQuotaToCarrierWindow),
            }));
        }

        if (days.length > 0) {
            return [{
                days,
                windows: [{ start: "", end: "" }],
                max: Number(item.defaultShippingQuantity ?? 0),
                applyQuotaToCarrierWindow: false,
            }];
        }

        return [{
            days: [],
            windows: [{ start: "", end: "" }],
            max: Number(item.defaultShippingQuantity ?? 0),
            applyQuotaToCarrierWindow: false,
        }];
    });

    return intervals;
};

const mapApiToCarrierGroup = (api: CarrierGroupApiResponse, intervals: Interval[]): CarrierGroup => ({
    id: String(api.id || ""),
    name: String(api.name || ""),
    timezone: String(api.timezone || ""),
    type: mapGroupType(api.groupType),
    carriers: Array.isArray(api.carrierIds) ? api.carrierIds.filter(Boolean) : [],
    days: [],
    intervals,
    status: mapGroupStatus(api.status),
});

export default function CarrierGroupResumenView() {
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

    const [group, setGroup] = useState<CarrierGroup | null>(null);
    const [sourceGroup, setSourceGroup] = useState<CarrierGroupApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const update = <K extends keyof CarrierGroup>(field: K, value: CarrierGroup[K]) => {
        if (field === "intervals") {
            const cacheKey = String(id || group?.id || "").trim();
            if (cacheKey) {
                setCarrierGroupIntervalsCache(cacheKey, value as Interval[]);
            }
        }
        setGroup((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    useEffect(() => {
        if (!id) {
            setGroup(null);
            setLoading(false);
            return;
        }

        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);

                const response = await fetch(`${DELIVERY_API_BASE}/carrier-group/${encodeURIComponent(String(id))}`, {
                    method: "GET",
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const payload = (await response.json()) as CarrierGroupApiResponse;
                if (!mounted) return;

                setSourceGroup(payload);

                const intervalsFromPayload = mapIntervalsFromCarrierPayload(payload);

                let intervals = intervalsFromPayload;
                if (!intervals.length) {
                    const config = Array.isArray(payload.windowConfiguration) ? payload.windowConfiguration : [];

                    const intervalsFromSchemas = (
                        await Promise.all(
                            config.map(async (item) => {
                                const schemaId = String(item.windowSchemaId || "").trim();
                                if (!schemaId) {
                                    return [
                                        {
                                            days: [],
                                            windows: [{ start: "", end: "" }],
                                            max: Number(item.defaultShippingQuantity ?? 0),
                                            applyQuotaToCarrierWindow: false,
                                        },
                                    ] as Interval[];
                                }

                                const schemaResponse = await fetch(`${DELIVERY_API_BASE}/window-schema/${encodeURIComponent(schemaId)}`, {
                                    method: "GET",
                                    cache: "no-store",
                                });
                                if (!schemaResponse.ok) {
                                    throw new Error(`HTTP ${schemaResponse.status} al cargar window-schema ${schemaId}`);
                                }

                                const schemaPayload = (await schemaResponse.json()) as WindowSchemaResponse;
                                return mapIntervalsFromSchema(schemaPayload, item.defaultShippingQuantity);
                            })
                        )
                    ).flat();

                    intervals = intervalsFromSchemas.length ? intervalsFromSchemas : mapIntervalsFallback(payload);
                }

                if (!mounted) return;
                const cacheKey = String(payload.id || id || "").trim();
                if (cacheKey) {
                    setCarrierGroupIntervalsCache(cacheKey, intervals);
                }
                setGroup(mapApiToCarrierGroup(payload, intervals));
            } catch (error) {
                console.error("Error cargando Carrier Group:", error);
                if (!mounted) return;
                setGroup(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [id]);

    const buildUpdatePayload = useCallback(() => {
        if (!group) return null;

        const windows = group.intervals.flatMap((interval) => {
            const apiDays = (interval.days || [])
                .map((day) => toApiDay(day))
                .filter((day): day is string => Boolean(day));

            const intervalWindows = (interval.windows?.length ? interval.windows : [{ start: "", end: "" }])
                .filter((window) => window.start && window.end);

            return apiDays.flatMap((day) =>
                intervalWindows.map((window) => ({
                    startTime: window.start,
                    endTime: window.end,
                    startDay: day,
                    endDay: day,
                    maxShippingQuantity: Number(interval.max || 0),
                    applyQuotaToCarrierWindow: Boolean(interval.applyQuotaToCarrierWindow),
                }))
            );
        });

        const windowConfiguration = group.intervals.map((interval) => {
            const days = (interval.days || [])
                .map((day) => toApiDay(day))
                .filter((day): day is string => Boolean(day));

            const configWindows = (interval.windows?.length ? interval.windows : [{ start: "", end: "" }])
                .filter((window) => window.start && window.end)
                .map((window) => ({
                    startTime: window.start,
                    endTime: window.end,
                    maxShippingQuantity: Number(interval.max || 0),
                    applyQuotaToCarrierWindow: Boolean(interval.applyQuotaToCarrierWindow),
                }));

            return {
                days,
                windows: configWindows.length ? configWindows : [{}],
            };
        });

        return {
            id: group.id,
            name: group.name,
            timezone: group.timezone,
            groupType: group.type === "Transportista" ? "carrier" : "other",
            status: group.status === "Activo" ? "active" : "inactive",
            carrierIds: group.carriers,
            locationIds: sourceGroup?.locationIds ?? null,
            windowConfiguration,
            windows,
            dateCreated: sourceGroup?.dateCreated ?? undefined,
            userCreated: sourceGroup?.userCreated ?? undefined,
            dateModified: sourceGroup?.dateModified ?? undefined,
            userModified: sourceGroup?.userModified ?? undefined,
        };
    }, [group, sourceGroup]);

    const handleSave = useCallback(async () => {
        if (!group || !id) return;

        const body = buildUpdatePayload();
        if (!body) return;

        setSaving(true);
        try {
            const response = await fetch(`${DELIVERY_API_BASE}/carrier-group/${encodeURIComponent(String(id))}`, {
                method: "PUT",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status} ${errorText}`);
            }
        } catch (error) {
            console.error("Error guardando Carrier Group:", error);
        } finally {
            setSaving(false);
        }
    }, [buildUpdatePayload, group, id]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                onClick: handleSave,
                icon: <CheckCircleIcon className="h-5 w-5" />,
                disabled: !group || loading || saving,
            },
            {
                label: "Guardar",
                variant: "success",
                onClick: handleSave,
                icon: <SaveOutlined className="h-4 w-4" />,
                disabled: !group || loading || saving,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                onClick: () => {
                    router.push("/delivery/transportistas/grupo-transportistas/nuevo");
                },
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                disabled: !group || loading || saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/delivery/transportistas/grupo-transportistas"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [group, router, loading, saving, handleSave]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Grupos de transportistas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{group?.name ?? "—"}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando...", variant: "info" }
                : loading
                    ? { text: "Cargando...", variant: "info" }
                    : group
                        ? { text: group.status, variant: group.status === "Activo" ? "success" : "warning" }
                        : { text: "Registro no encontrado", variant: "warning" },
        } as PageHeaderProps),
        [headerActions, group?.name, group?.status, loading, saving]
    );

    if (loading) {
        return <div className="p-6 text-gray-600">Cargando...</div>;
    }

    if (!group) {
        return (
            <div className="p-6">
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
                    Registro no encontrado
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white">
            <CarrierGroupFields group={group} onChange={update} />
        </div>
    );
}
