// app/views/Soporte/Tickets/New/TicketsNuevoView.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { Ticket, TicketsFields } from "@/features/customers/components/centromensajes/tickets/TicketsFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Registro inicial (mock) — mismo enfoque que “Nuevo” en Canales */ // :contentReference[oaicite:14]{index=14}
const initialRecord: Ticket = {
    commerceId: "",
    amount: "",
    currency: "ARS",
    status: "Nuevo",
    createdAt: "—",
    slaValue: 2,
    slaUnit: "Hours",
    slaDue: "",
    channel: "",
    reason: "",
    areaInCharge: "Operación",
};

export default function TicketsNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<Ticket>({ ...initialRecord });

    const handleChange = (field: keyof Ticket, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // refs estables para header y POST (patrón de tus vistas) // :contentReference[oaicite:15]{index=15}
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // POST (mock ahora) — validación mínima como en tus archivos de Nuevo // :contentReference[oaicite:16]{index=16}
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as Ticket;
        const currentUser = userRef.current;

        const payload = {
            CommerceId: String(current.commerceId || ""),
            Amount: Number(current.amount || 0),
            Currency: current.currency || "ARS",
            Status: current.status || "Nuevo",
            Channel: current.channel || "",
            Reason: current.reason || "",
            AreaInCharge: current.areaInCharge || "",
            SLAValue: Number(current.slaValue || 0),
            SLAUnit: current.slaUnit || "Hours",
            SLADue: current.slaDue || "",
            UserCreated: Number(currentUser?.id ?? 0),
        };

        const errors: string[] = [];
        if (!payload.CommerceId) errors.push("Falta Commerce ID.");
        if (!payload.Channel) errors.push("Falta Channel.");
        if (!payload.Reason) errors.push("Falta Motivo.");

        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        try {
            // await fetchWithAuth("soporte-service/tickets/Crear", { method: "POST", body: JSON.stringify(payload) });
            console.log("MOCK POST Ticket:", payload);
            setRecord({ ...initialRecord });
            // router.push("/soporte/tickets");
        } catch (err: any) {
            console.error("Error creando Ticket:", err?.payload ?? err);
        }
    }, [fetchWithAuth]);

    /* Acciones PageHeader (Nuevo) — mismas variantes e iconos que usas */ // :contentReference[oaicite:17]{index=17}
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
                onClick: () => {
                    handleCreate();
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/tickets") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">TICKETS</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate habilita/oculta campos como “Creación” siguiendo tu patrón */} {/* :contentReference[oaicite:18]{index=18} */}
            <TicketsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
