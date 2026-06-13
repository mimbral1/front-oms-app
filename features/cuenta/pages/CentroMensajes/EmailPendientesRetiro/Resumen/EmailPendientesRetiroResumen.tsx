// app/views/Configuracion/Entrega/EmailPendienteRetiro/Detail/EmailPendienteRetiroResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { PendingPickupEmail, EmailPendienteRetiroFields } from "@/features/cuenta/components/centromensajes/emailpendientesretiro/EmailPendienteRetiroFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";

/* estado inicial (solo para tipado) */
const EMPTY: PendingPickupEmail = {
    id: "",
    activo: true,
    status: "Activo",
    templateId: 1,
    templateName: "Template 1",
    daysToWait: 1,
    created: { username: "—", email: "—", date: "—" },
};

export default function EmailPendienteRetiroResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<PendingPickupEmail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    /* cargar detalle (usa mock si no hay API) */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                // Si más adelante existe el endpoint real, bastará con descomentar:
                // const res = await fetchWithAuth<{ ok: boolean; data: any }>(`comerce-service/notifications/pickup-reminder/${recordId}`);
                // const a = res?.data || {};
                const a = {
                    Id: recordId,
                    TemplateId: 2,
                    TemplateName: "Template 2",
                    DaysToWait: 1,
                    IsActive: 1,
                    CreatedAt: null,
                };

                const mapped: PendingPickupEmail = {
                    id: String(a?.Id ?? recordId ?? ""),
                    activo: a?.IsActive ? true : false,
                    status: a?.IsActive ? "Activo" : "Inactivo",
                    templateId: typeof a?.TemplateId === "number" ? a.TemplateId : undefined,
                    templateName: a?.TemplateName ?? "",
                    daysToWait: typeof a?.DaysToWait === "number" ? a.DaysToWait : 0,
                    created: {
                        username: "",
                        email: "",
                        date: a?.CreatedAt ? new Date(a.CreatedAt).toLocaleString("es-CL") : "—",
                    },
                };

                if (!mounted) return;
                setRecord(mapped);
            } catch (err: any) {
                console.error("Error cargando Email pendiente de retiro:", err?.payload ?? err);
                setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    const handleChange = (field: keyof PendingPickupEmail, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        if (!current) return;

        const body: any = {
            TemplateId: Number(current.templateId || 0),
            DaysToWait: Number(current.daysToWait || 0),
            IsActive: current.activo ? 1 : 0,
            UserModified: Number(currentUser?.id ?? 0),
        };

        setSaving(true);
        try {
            await fetchWithAuth<{ ok: boolean; message?: string }>(
                `comerce-service/notifications/pickup-reminder/${current.id}`,
                { method: "PUT", body: JSON.stringify(body) }
            );
        } catch (err: any) {
            console.error("Error al guardar:", err?.payload ?? err);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

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
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/centro-mensajes/email-pendientes-retiro"), disabled: saving },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Email pendiente de retiro</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? { text: record.status!, variant: record.status === "Activo" ? "success" : "warning" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record?.status]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el registro.</div>;

    return (
        <div className="p-6 bg-white">
            <EmailPendienteRetiroFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
