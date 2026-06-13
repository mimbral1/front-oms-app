// app/views/Soporte/Tickets/Detail/TicketsResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ArrowUpRightIcon, MegaphoneIcon, UserIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { TicketsFields, Ticket } from "@/features/customers/components/centromensajes/tickets/TicketsFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { ActionButton } from "@/components/ui/button/action-button";

/* Estado base (mock) */ // estructura análoga a Resumen de Canales :contentReference[oaicite:7]{index=7}
const EMPTY: Ticket = {
    id: "",
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

export default function TicketsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // refs estables para header y guardado (patrón de tus vistas) :contentReference[oaicite:8]{index=8}
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    /* Cargar detalle (MOCK) con la forma de tu mapping */ // :contentReference[oaicite:9]{index=9}
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                // MOCK: cuando exista API, reemplazar por fetchWithAuth(`soporte-service/tickets/${recordId}`)
                const baseId = Number(recordId || 1);
                const created = new Date(Date.now() - baseId * 3600 * 1000).toLocaleString("es-CL");
                const due = new Date(Date.now() + 2 * 3600 * 1000).toLocaleString("es-CL");

                const mapped: Ticket = {
                    id: String(recordId ?? ""),
                    commerceId: `1154670288529-${String(baseId).padStart(2, "0")}`,
                    amount: 3382,
                    currency: "ARS",
                    status: "Nuevo",
                    createdAt: created,
                    slaValue: 2,
                    slaUnit: "Hours",
                    slaDue: due,
                    channel: "Web",
                    reason: "Devolución",
                    areaInCharge: "Operación",
                };

                if (mounted) setRecord(mapped);
            } catch (err) {
                console.error("Error cargando Ticket:", (err as any)?.payload ?? err);
                setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    /* Guardar (mock) con payload tipado a lo que luego enviará PUT */ // :contentReference[oaicite:10]{index=10}
    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        if (!current) return;

        const body: any = {
            CommerceId: current.commerceId,
            Amount: Number(current.amount || 0),
            Currency: current.currency,
            Status: current.status,
            Channel: current.channel,
            Reason: current.reason,
            AreaInCharge: current.areaInCharge,
            SLAValue: Number(current.slaValue || 0),
            SLAUnit: current.slaUnit,
            SLADue: current.slaDue,
            UserModified: Number(currentUser?.id ?? 0),
        };

        setSaving(true);
        try {
            // await fetchWithAuth(`soporte-service/tickets/${current.id}`, { method: "PUT", body: JSON.stringify(body) });
            console.log("MOCK PUT Ticket:", current.id, body);
        } catch (err) {
            console.error("Error al guardar Ticket:", (err as any)?.payload ?? err);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    /* Acciones PageHeader */
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
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/customers/csx/tickets"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">TICKETS</div>
                    <div className="text-2xl font-semibold text-gray-900">#{id}</div>
                </div>
            ),
            action: headerActions,
            status:
                record?.status
                    ? { text: record.status, variant: record.status === "Cerrado" ? "warning" : "success" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, record?.status]
    );

    /* UI superior bajo tabs: “En progreso · Mover” + acciones Reiterar/Escalar/Asignar */
    const StatusStrip = () => (
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
            <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> En progreso
                </span>
                <ActionButton variant="primary" size="sm">
                    Mover <ArrowUpRightIcon className="h-4 w-4" />
                </ActionButton>
            </div>
            <div className="flex items-center gap-3">
                <ActionButton variant="primary" size="sm">
                    <MegaphoneIcon className="h-4 w-4" /> Reiterar
                </ActionButton>
                <ActionButton variant="primary" size="sm">
                    <ArrowUpRightIcon className="h-4 w-4" /> Escalar
                </ActionButton>
                <ActionButton variant="secondary" size="sm">
                    <UserIcon className="h-4 w-4" /> Asignar
                </ActionButton>
            </div>
        </div>
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el ticket.</div>;

    return (
        <div className="bg-white">
            {/* Banda intermedia con estado y acciones secundarias */}
            <div className="px-6 py-4 bg-page-bg">
                <StatusStrip />
            </div>
            <div>
                {/* Contenido principal: Fields (sin isCreate para que muestre “Creación” read-only) */} {/* :contentReference[oaicite:12]{index=12} :contentReference[oaicite:13]{index=13} */}
                <div className="p-6">
                    <TicketsFields record={record} readOnly={false} onChange={(f, v) => setRecord((r) => (r ? { ...r, [f]: v } : r))} />
                </div>
            </div>
        </div>
    );
}
