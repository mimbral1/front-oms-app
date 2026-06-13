// views/Delivery/Transportistas/Transportista/Resumen/ProgramacionTransportista/ProgramacionTransportista.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowDownOnSquareIcon, ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { getCarrierCache } from "@/features/delivery/pages/Transportistas/Transportista/shared/carrier-cache";
import { DELIVERY_WINDOW_SCHEMA_ENDPOINT } from "@/lib/http/endpoints";

interface CarrierCachedPayload {
    name?: string | null;
    windowSchemaId?: string | null;
}

interface WindowSchemaListItem {
    id?: string | null;
    name?: string | null;
}

interface WindowSchemaWindow {
    startDay?: string | null;
    endDay?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    maxShippingQuantity?: number | null;
}

interface WindowSchemaNormalizedWindow {
    dayOfWeek?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    maxShippingQuantity?: number | null;
}

interface WindowSchemaDetailResponse {
    id?: string | null;
    name?: string | null;
    windows?: WindowSchemaWindow[] | string | null;
    normalizedWindows?: WindowSchemaNormalizedWindow[] | null;
}

interface WindowRow {
    day: string;
    start: string;
    end: string;
    maxShippingQuantity: string;
}

export interface ProgramacionRecord {
    esquemaHorario: string;
}

const DAY_LABELS: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miercoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sabado",
    sunday: "Domingo",
};

const mapDayToSpanish = (day: unknown): string => {
    const key = String(day || "").trim().toLowerCase();
    return DAY_LABELS[key] || String(day || "").trim();
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

const mapDetailWindows = (detail: WindowSchemaDetailResponse | null): WindowRow[] => {
    if (!detail) return [];

    const normalized = Array.isArray(detail.normalizedWindows)
        ? detail.normalizedWindows
            .map((w) => ({
                day: mapDayToSpanish(w.dayOfWeek),
                start: String(w.startTime || "").trim(),
                end: String(w.endTime || "").trim(),
                maxShippingQuantity:
                    w.maxShippingQuantity == null ? "-" : String(w.maxShippingQuantity),
            }))
            .filter((w) => w.day || w.start || w.end || w.maxShippingQuantity !== "-")
        : [];

    if (normalized.length > 0) return normalized;

    return parseWindows(detail.windows)
        .map((w) => ({
            day:
                mapDayToSpanish(w.startDay) === mapDayToSpanish(w.endDay)
                    ? mapDayToSpanish(w.startDay)
                    : `${mapDayToSpanish(w.startDay)} - ${mapDayToSpanish(w.endDay)}`,
            start: String(w.startTime || "").trim(),
            end: String(w.endTime || "").trim(),
            maxShippingQuantity:
                w.maxShippingQuantity == null ? "-" : String(w.maxShippingQuantity),
        }))
        .filter((w) => w.day || w.start || w.end || w.maxShippingQuantity !== "-");
};

export default function ProgramacionTransportistaView({
    record,
    readOnly = false,
    onChange,
    options = [],
    title = "Programación",
}: {
    record?: ProgramacionRecord;                 // ↍ ahora es opcional
    readOnly?: boolean;
    onChange?: (field: keyof ProgramacionRecord, value: any) => void;
    options?: string[];
    title?: string;
}) {
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const cachedCarrier = getCarrierCache<CarrierCachedPayload>(String(recordId || ""));
    const cachedWindowSchemaId = String(cachedCarrier?.windowSchemaId || "").trim();

    const [localRecord, setLocalRecord] = useState<ProgramacionRecord>(
        record ?? { esquemaHorario: "" }
    );
    const [schemaOptions, setSchemaOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [schemaDetail, setSchemaDetail] = useState<WindowSchemaDetailResponse | null>(null);

    useEffect(() => {
        if (record) {
            setLocalRecord(record);
        }
    }, [record]);

    useEffect(() => {
        const controller = new AbortController();

        const loadSchemas = async () => {
            try {
                const response = await fetch(DELIVERY_WINDOW_SCHEMA_ENDPOINT, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const payload = await response.json();
                const source = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.items)
                            ? payload.items
                            : [];

                const mapped = source
                    .map((item: WindowSchemaListItem) => {
                        const schemaId = String(item?.id || "").trim();
                        const schemaName = String(item?.name || "").trim();
                        if (!schemaId || !schemaName) return null;
                        return { id: schemaId, name: schemaName };
                    })
                    .filter(Boolean) as Array<{ id: string; name: string }>;

                setSchemaOptions(mapped);
            } catch {
                setSchemaOptions([]);
            }
        };

        void loadSchemas();

        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        if (!localRecord.esquemaHorario && cachedWindowSchemaId && schemaOptions.length > 0) {
            const cachedSchema = schemaOptions.find((option) => option.id === cachedWindowSchemaId);
            if (cachedSchema?.name) {
                setLocalRecord((prev) => ({ ...prev, esquemaHorario: cachedSchema.name }));
            }
        }
    }, [localRecord.esquemaHorario, cachedWindowSchemaId, schemaOptions]);

    useEffect(() => {
        const selectedSchemaId =
            schemaOptions.find((option) => option.name === localRecord.esquemaHorario)?.id || "";
        const schemaIdToLoad = selectedSchemaId || cachedWindowSchemaId;

        if (!schemaIdToLoad) {
            setSchemaDetail(null);
            return;
        }

        const controller = new AbortController();

        const loadDetail = async () => {
            try {
                const response = await fetch(`${DELIVERY_WINDOW_SCHEMA_ENDPOINT}/${encodeURIComponent(schemaIdToLoad)}`, {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal,
                });

                if (!response.ok) return;

                const detail = (await response.json()) as WindowSchemaDetailResponse;
                if (controller.signal.aborted) return;

                setSchemaDetail(detail);

                const nameFromDetail = String(detail?.name || "").trim();
                if (!record && nameFromDetail) {
                    setLocalRecord({ esquemaHorario: nameFromDetail });
                }
            } catch {
                // no-op: keep UI with available cached data
            }
        };

        void loadDetail();

        return () => {
            controller.abort();
        };
    }, [cachedWindowSchemaId, localRecord.esquemaHorario, record, schemaOptions]);

    // Valor seguro por defecto si no viene 'record'
    const safeRecord: ProgramacionRecord = localRecord;
    const optionNames = schemaOptions.map((o) => o.name);
    const schemaWindows = mapDetailWindows(schemaDetail);
    const resolvedTitle = cachedCarrier?.name ? `Programación - ${cachedCarrier.name}` : title;

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", disabled: true, icon: <CheckCircleIcon className="h-5 w-5" /> },
            { label: "Guardar", variant: "success", disabled: true, icon: <ArrowDownTrayIcon className="h-5 w-5" /> },
            { label: "Guardar & Crear nuevo", variant: "success", disabled: true, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
            { label: "Volver al listado", variant: "secondary", onClick: () => history.back(), icon: <XCircleIcon className="h-5 w-5" /> },
        ],
        []
    );

    usePageHeader(
        () =>
        ({
            title: resolvedTitle,
            action: headerActions,
        } as PageHeaderProps),
        [resolvedTitle, headerActions]
    );

    const handleChange =
        (field: keyof ProgramacionRecord) =>
            (value: any) => {
                setLocalRecord((prev) => ({ ...prev, [field]: value }));
                onChange?.(field, value);
            };

    return (
        <div className="flex-1 bg-white">
            <div className="rounded-xl shadow-sm overflow-hidden pt-5">
                <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                        <div className="lg:col-span-7 space-y-6">
                            <Card title="DETALLE" hasTitleDivider noDefaultStyles className="rounded-xl p-6">
                                <div className="grid grid-cols-6 gap-4">
                                    <span className="col-span-1 text-sm font-bold text-gray-600">Esquema horario</span>
                                    <div className="col-span-5">
                                        <CollapsibleField
                                            label=""
                                            inline
                                            value={safeRecord.esquemaHorario}
                                            options={optionNames.length ? optionNames : options}
                                            onChange={readOnly ? () => { } : handleChange("esquemaHorario")}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-2">
                                    <span className="text-sm font-bold text-gray-600">Ventanas</span>
                                    {schemaWindows.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500">
                                            Sin ventanas para este esquema.
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-lg border border-gray-200">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 text-gray-600">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold">Dia</th>
                                                        <th className="px-3 py-2 text-left font-semibold">Desde</th>
                                                        <th className="px-3 py-2 text-left font-semibold">Hasta</th>
                                                        <th className="px-3 py-2 text-left font-semibold">Max envios</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {schemaWindows.map((window, index) => (
                                                        <tr key={`${window.day}-${window.start}-${window.end}-${index}`} className="border-t border-gray-100">
                                                            <td className="px-3 py-2 text-gray-800">{window.day || "-"}</td>
                                                            <td className="px-3 py-2 text-gray-800">{window.start || "-"}</td>
                                                            <td className="px-3 py-2 text-gray-800">{window.end || "-"}</td>
                                                            <td className="px-3 py-2 text-gray-800">{window.maxShippingQuantity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
