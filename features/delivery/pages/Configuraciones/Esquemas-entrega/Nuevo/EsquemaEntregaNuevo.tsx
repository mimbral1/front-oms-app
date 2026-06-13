// app/views/Delivery/Esquemas/New/EsquemaEntregaNuevoView.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { EsquemaEntregaFields, EsquemaEntregaRecord } from "@/features/delivery/components/configuraciones/esquemas-entrega/EsquemaEntregaFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Registro inicial vacío */
const initialRecord: EsquemaEntregaRecord = {
    nombre: "",
    timezone: "America/Santiago",
    dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    start: "08:00",
    end: "12:00",
    maxEnviosBase: 100,
    maxBultosBase: 1000,
    maxItemsBase: 100000,
    estado: "Activo",
    defaultsMaxEnvios: 50,
    defaultsMaxItems: 1000,
    defaultsMaxBultos: 100,
    costoExtraEntrega: 0,
    ventanas: [{ start: "13:00", end: "17:00", maxEnvios: 100, maxBultos: 1000, maxItems: 100000 }],
};

export default function EsquemaEntregaNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<EsquemaEntregaRecord>({ ...initialRecord });
    const handleChange = (field: keyof EsquemaEntregaRecord, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Refs estables (patrón de tus vistas)
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // POST (ajusta endpoint real cuando esté disponible)
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as EsquemaEntregaRecord;
        const currentUser = userRef.current;

        const payload = {
            Name: (current?.nombre || "").trim(),
            TimeZone: current?.timezone,
            Days: current?.dias,
            Start: current?.start,
            End: current?.end,
            MaxShipmentsBase: current?.maxEnviosBase,
            MaxPackagesBase: current?.maxBultosBase,
            MaxItemsBase: current?.maxItemsBase,
            IsActive: current?.estado === "Activo" ? 1 : 0,
            Defaults: {
                MaxShipments: current?.defaultsMaxEnvios,
                MaxItems: current?.defaultsMaxItems,
                MaxPackages: current?.defaultsMaxBultos,
                ExtraCost: current?.costoExtraEntrega,
            },
            Windows: current?.ventanas.map((w) => ({
                Start: w.start,
                End: w.end,
                MaxShipments: w.maxEnvios,
                MaxPackages: w.maxBultos,
                MaxItems: w.maxItems,
            })),
            UserCreated: Number(currentUser?.id ?? 0),
        };

        const errors: string[] = [];
        if (!payload.Name) errors.push("Falta el nombre.");

        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        try {
            await fetchWithAuth<{ ok: boolean; data?: any }>(
                "delivery-service/esquema-entrega/Crear",
                { method: "POST", body: JSON.stringify(payload) }
            );
            // limpiar para crear otro
            setRecord({ ...initialRecord });
        } catch (err: any) {
            console.error("Error creando esquema de entrega:", err?.payload ?? err);
        }
    }, [fetchWithAuth]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: handleCreate },
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
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/delivery/configuraciones/esquemas-entrega") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Esquemas de entrega</div>
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
            <EsquemaEntregaFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
