// views\PickingView\olas\EsquemaHorario\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { EsquemaHorarioFields, EsquemaHorarioRecord } from "@/features/picking/components/pickingview/olas/esquemahorario/EsquemaHorarioFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuthQA } from "@/lib/http/client";

type WaveSettingsResponse = {
    ok?: boolean;
    data?: {
        waveCutoffCriteria?: {
            maxOrdersPerWave?: number;
            maxItemsPerWave?: number;
            maxOpenMinutes?: number;
        };
    };
};

/* Registro inicial vacío  */
const initialRecord: EsquemaHorarioRecord = {
    nombre: "",
    timezone: "America/Santiago",
    dias: [],
    start: "",
    end: "",

    maxPedidosBase: 0,
    maxItemsBase: 0,
    corteMinutosBase: 0,

    estado: "Inactivo",

    defaultsMaxPedidos: 0,
    defaultsMaxItems: 0,
    defaultsCorteMinutos: 0,

    ventanas: [],
};

export default function EsquemaHorarioNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [record, setRecord] = useState<EsquemaHorarioRecord>({ ...initialRecord });
    const [waveDefaults, setWaveDefaults] = useState({
        maxOrdersPerWave: 0,
        maxItemsPerWave: 0,
        maxOpenMinutes: 0,
    });

    const handleChange = (field: keyof EsquemaHorarioRecord, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Refs estables
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        let cancelled = false;

        const loadWaveDefaults = async () => {
            try {
                const response = await fetchWithAuthQA<WaveSettingsResponse>(
                    "picking-service/waves/settings",
                    { method: "GET" }
                );

                const criteria = response?.data?.waveCutoffCriteria;
                const nextDefaults = {
                    maxOrdersPerWave: Number(criteria?.maxOrdersPerWave ?? 0),
                    maxItemsPerWave: Number(criteria?.maxItemsPerWave ?? 0),
                    maxOpenMinutes: Number(criteria?.maxOpenMinutes ?? 0),
                };

                if (cancelled) return;

                setWaveDefaults(nextDefaults);
                setRecord((prev) => ({
                    ...prev,
                    defaultsMaxPedidos: nextDefaults.maxOrdersPerWave,
                    defaultsMaxItems: nextDefaults.maxItemsPerWave,
                    defaultsCorteMinutos: nextDefaults.maxOpenMinutes,
                }));
            } catch (err) {
                console.error("Error cargando valores por defecto de olas:", err);
            }
        };

        loadWaveDefaults();

        return () => {
            cancelled = true;
        };
    }, [fetchWithAuthQA]);

    const dayIdByName: Record<string, number> = {
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
        Sunday: 7,
    };

    // POST (ajusta endpoint real cuando esté disponible)
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as EsquemaHorarioRecord;
        const currentUser = userRef.current;

        const dayIds = (current?.dias || [])
            .map((d) => dayIdByName[d])
            .filter((d): d is number => Number.isInteger(d));

        const windowsFromForm = (current?.ventanas || []).map((w) => ({
            timeStart: w.start,
            timeEnd: w.end,
            maxQuantityOrders: Number(w.maxPedidos || 0),
            maxQuantityItems: Number(w.maxItems || 0),
            timeBeforeClose: Number(w.corteMinutos || 0),
        }));

        const fallbackWindow = {
            timeStart: current?.start,
            timeEnd: current?.end,
            maxQuantityOrders: Number(current?.defaultsMaxPedidos || 0),
            maxQuantityItems: Number(current?.defaultsMaxItems || 0),
            timeBeforeClose: Number(current?.defaultsCorteMinutos || 0),
        };

        const windows = windowsFromForm.length
            ? windowsFromForm
            : [fallbackWindow];

        const windowConfiguration = dayIds.length
            ? [
                {
                    dayIds,
                    windows,
                },
            ]
            : [];

        const payload = {
            name: (current?.nombre || "").trim(),
            timeZone: current?.timezone || "America/Santiago",
            status: current?.estado === "Activo" ? "active" : "inactive",
            userId: Number(currentUser?.id ?? 0),
            defaults: {
                defaultTimeStart: current?.start,
                defaultTimeEnd: current?.end,
                defaultMaxQuantityOrders: Number(current?.defaultsMaxPedidos || 0),
                defaultMaxQuantityItems: Number(current?.defaultsMaxItems || 0),
                defaultTimeBeforeClose: Number(current?.defaultsCorteMinutos || 0),
            },
            windowConfiguration,
        };

        const errors: string[] = [];
        if (!payload.name) errors.push("Falta el nombre.");
        if (!payload.defaults.defaultTimeStart || !payload.defaults.defaultTimeEnd) {
            errors.push("Faltan horas por defecto (inicio/término).");
        }
        if (!payload.windowConfiguration.length) errors.push("Selecciona al menos un día.");
        if (!windows.length) errors.push("Agrega al menos una ventana.");

        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        try {
            await fetchWithAuthQA<{ ok: boolean; data?: any }>(
                "picking-service/windows/schemas/full",
                { method: "POST", body: JSON.stringify(payload) }
            );
            // limpiar para crear otro
            setRecord({
                ...initialRecord,
                defaultsMaxPedidos: waveDefaults.maxOrdersPerWave,
                defaultsMaxItems: waveDefaults.maxItemsPerWave,
                defaultsCorteMinutos: waveDefaults.maxOpenMinutes,
            });
        } catch (err: any) {
            console.error("Error creando esquema de horario:", err?.payload ?? err);
        }
    }, [fetchWithAuthQA, waveDefaults]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
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
                onClick: () => { handleCreate(); },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/picking/olas/esquema-horario") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Esquemas de horario</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate oculta tarjetas de usuario en Fields */}
            <EsquemaHorarioFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
