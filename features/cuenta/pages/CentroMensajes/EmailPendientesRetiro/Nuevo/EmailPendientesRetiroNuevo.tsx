// app/views/Configuracion/Entrega/EmailPendienteRetiro/New/EmailPendienteRetiroNuevoView.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { PendingPickupEmail, EmailPendienteRetiroFields } from "@/features/cuenta/components/centromensajes/emailpendientesretiro/EmailPendienteRetiroFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

/* Registro inicial vacío (por defecto activo) */
const initialRecord: PendingPickupEmail = {
    activo: true,
    status: "Activo",
    templateId: undefined,
    templateName: "",
    daysToWait: 1,
    created: { username: "—", email: "—", date: "—" },
};

export default function EmailPendienteRetiroNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<PendingPickupEmail>({ ...initialRecord });
    const handleChange = (field: keyof PendingPickupEmail, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    // Mantener referencias estables (mismo patrón)
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // POST (usar mocks o endpoint cuando exista)
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as PendingPickupEmail;
        const currentUser = userRef.current;

        const payload = {
            TemplateId: Number(current.templateId || 0),
            DaysToWait: Number(current.daysToWait || 0),
            IsActive: current.activo ? 1 : 0,
            UserCreated: Number(currentUser?.id ?? 0),
        };

        const errors: string[] = [];
        if (!current.templateId) errors.push("Falta seleccionar el template (TemplateId).");
        if (String(current.daysToWait) === "" || Number(current.daysToWait) < 0)
            errors.push("Valor inválido en Days to wait.");

        if (errors.length) {
            console.warn("Validación antes de POST:", errors);
            return;
        }

        try {
            // Placeholder: ajusta al endpoint real cuando lo definas
            await fetchWithAuth<{ ok: boolean; data?: any }>("comerce-service/notifications/pickup-reminder/Crear", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setRecord({ ...initialRecord }); // limpiar y listo para otro
            // router.push("/configuracion/entrega/email-pendiente-retiro");
        } catch (err: any) {
            console.error("Error creando registro:", err?.payload ?? err);
        }
    }, [fetchWithAuth]);

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
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/centro-mensajes/email-pendientes-retiro") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Email pendiente de retiro</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <EmailPendienteRetiroFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
