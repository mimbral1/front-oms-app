// views\PickingView\olas\EsquemaHorario\Resumen\Resumen.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { EsquemaHorarioFields } from "@/features/picking/components/pickingview/olas/esquemahorario/EsquemaHorarioFields";
import type { EsquemaHorarioRecord } from "@/features/picking/components/pickingview/olas/esquemahorario/EsquemaHorarioFields";
import { useFetchWithAuthQA } from "@/lib/http/client";

type ApiSchemaWindow = {
    timeStart: string;
    timeEnd: string;
    maxQuantityOrders: number;
    maxQuantityItems: number;
    timeBeforeClose: number;
};

type ApiSchemaFullResponse = {
    data: {
        id: string;
        name: string;
        windowSchema?: {
            name?: string;
        } | null;
        timeZone: string;
        status: "active" | "inactive" | string;
        defaults?: {
            defaultTimeStart?: string;
            defaultTimeEnd?: string;
            defaultMaxQuantityOrders?: number;
            defaultMaxQuantityItems?: number;
            defaultTimeBeforeClose?: number;
        } | null;
        enabledDays?: Array<{ dayId: number; name: string }>;
        Windows?: Array<{
            timeStart: string;
            timeEnd: string;
            maxQuantityOrders: number;
            maxQuantityItems: number;
            timeBeforeClose: number;
        }>;
        profiles?: {
            createdBy?: {
                nombres?: string;
                apellidos?: string;
                email?: string;
                urlImagenPerfil?: string;
            } | null;
            modifiedBy?: {
                nombres?: string;
                apellidos?: string;
                email?: string;
                urlImagenPerfil?: string;
            } | null;
        } | null;
        dateCreatedCL?: string;
        dateModifiedCL?: string;
    };
};

const dayIdToKey: Record<number, string> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
};

export default function EsquemaHorarioResumenView() {
    const router = useRouter();
    const { fetchWithAuthQA } = useFetchWithAuthQA();
    const { id } = useParams();
    const recordId = useMemo(() => (Array.isArray(id) ? id[0] : id), [id]);

    const [record, setRecord] = useState<EsquemaHorarioRecord | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!recordId) {
            setRecord(null);
            setLoading(false);
            return;
        }

        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);

                const res = await fetchWithAuthQA<ApiSchemaFullResponse>(
                    `picking-service/windows/schemas/${recordId}/full`,
                    { method: "GET" }
                );

                if (!mounted) return;

                const schema = res?.data;
                if (!schema) {
                    setRecord(null);
                    return;
                }

                const createdByName = [
                    schema.profiles?.createdBy?.nombres,
                    schema.profiles?.createdBy?.apellidos,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                const modifiedByName = [
                    schema.profiles?.modifiedBy?.nombres,
                    schema.profiles?.modifiedBy?.apellidos,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                const seenWindows = new Set<string>();
                const windows = (schema.Windows || []).reduce<EsquemaHorarioRecord["ventanas"]>((acc, w) => {
                    const mapped = {
                        start: w.timeStart,
                        end: w.timeEnd,
                        maxPedidos: Number(w.maxQuantityOrders || 0),
                        maxItems: Number(w.maxQuantityItems || 0),
                        corteMinutos: Number(w.timeBeforeClose || 0),
                    };

                    const key = [
                        mapped.start,
                        mapped.end,
                        mapped.maxPedidos,
                        mapped.maxItems,
                        mapped.corteMinutos,
                    ].join("|");

                    if (seenWindows.has(key)) return acc;

                    seenWindows.add(key);
                    acc.push(mapped);
                    return acc;
                }, []);

                const firstWindow: ApiSchemaWindow | null = windows.length
                    ? {
                        timeStart: windows[0].start,
                        timeEnd: windows[0].end,
                        maxQuantityOrders: windows[0].maxPedidos,
                        maxQuantityItems: windows[0].maxItems,
                        timeBeforeClose: windows[0].corteMinutos,
                    }
                    : null;

                setRecord({
                    nombre: schema.windowSchema?.name || schema.name || "",
                    timezone: schema.timeZone || "America/Santiago",
                    dias: (schema.enabledDays || []).map((d) => dayIdToKey[d.dayId]).filter(Boolean),
                    start: schema.defaults?.defaultTimeStart || firstWindow?.timeStart || "",
                    end: schema.defaults?.defaultTimeEnd || firstWindow?.timeEnd || "",

                    maxPedidosBase: schema.defaults?.defaultMaxQuantityOrders || firstWindow?.maxQuantityOrders || 0,
                    maxItemsBase: schema.defaults?.defaultMaxQuantityItems || firstWindow?.maxQuantityItems || 0,
                    corteMinutosBase: schema.defaults?.defaultTimeBeforeClose || firstWindow?.timeBeforeClose || 0,

                    estado: schema.status === "active" ? "Activo" : "Inactivo",

                    defaultsMaxPedidos: schema.defaults?.defaultMaxQuantityOrders || firstWindow?.maxQuantityOrders || 0,
                    defaultsMaxItems: schema.defaults?.defaultMaxQuantityItems || firstWindow?.maxQuantityItems || 0,
                    defaultsCorteMinutos: schema.defaults?.defaultTimeBeforeClose || firstWindow?.timeBeforeClose || 0,

                    ventanas: windows,

                    createdByUsername: createdByName || "-",
                    createdByEmail: schema.profiles?.createdBy?.email || "",
                    createdByAvatar: schema.profiles?.createdBy?.urlImagenPerfil || undefined,
                    createdAt: schema.dateCreatedCL || "-",
                    modifiedByUsername: modifiedByName || "-",
                    modifiedByEmail: schema.profiles?.modifiedBy?.email || "",
                    modifiedByAvatar: schema.profiles?.modifiedBy?.urlImagenPerfil || undefined,
                    modifiedAt: schema.dateModifiedCL || "-",
                });
            } catch (e) {
                console.error("Error cargando esquema horario:", e);
                if (mounted) setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [recordId, fetchWithAuthQA]);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("apply (mock)") },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("save (mock)") },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/picking/olas/esquema-horario") },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Esquemas de horario</div>
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

    if (loading) return <div className="p-6 text-gray-500">Cargando esquema...</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el esquema.</div>;

    const handleChange = (field: keyof EsquemaHorarioRecord, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    return (
        <div className="p-6 bg-white">
            <EsquemaHorarioFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
