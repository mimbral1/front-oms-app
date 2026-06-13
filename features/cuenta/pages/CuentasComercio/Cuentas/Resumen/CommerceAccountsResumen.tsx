// app/views/Commerce/Accounts/Detail/CommerceAccountResumenView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { CommerceAccount, CommerceAccountsFields } from "@/features/cuenta/components/cuentascomercio/cuentas/CommerceAccountsFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";

export default function CommerceAccountResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<CommerceAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // useeffect que carga el detalle 
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);

                const res = await fetchWithAuth<any>(`comerce-service/account/${recordId}`);
                if (!mounted) return;

                // si viene { message: "Tu usuario no tiene permiso..." }
                if (res && typeof res === "object" && "message" in res && !("data" in res)) {
                    const msg = String(res.message || "Error al cargar la cuenta de comercio.");
                    toast.error(msg);
                    setRecord(null);
                    return;
                }

                const a = (res as { ok?: boolean; data?: any })?.data || {};

                const mapped: CommerceAccount = {
                    id: a?.Id,
                    nombre: a?.Name ?? "",
                    comercio: a?.EcommerceName ?? "",
                    refId: a?.ReferenceId ?? "",
                    plataforma: (a?.Platform?.toUpperCase() as any) || "",
                    status: a?.Status ? "Activo" : "Inactivo",
                    salesChannelId: typeof a?.SalesChannelId === "number" ? a.SalesChannelId : undefined,
                    salesChannelName: a?.SalesChannelName ?? undefined,
                    featuresRaw: typeof a?.Features === "string" ? a.Features : "",
                };

                setRecord(mapped);
            } catch (e: any) {
                console.error("Error cargando account:", e);
                const msg =
                    typeof e === "string"
                        ? e
                        : e?.message || "Error al cargar la cuenta de comercio.";
                toast.error(msg);
                setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    const handleChange = (field: keyof CommerceAccount, value: any) => {
        if (record) setRecord({ ...record, [field]: value });
    };

    // Flag para decidir si volver atrás luego del guardado (sólo para "Guardar")
    const shouldBackAfterSaveRef = useRef(false);

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        if (!current) return;

        // Features: si viene JSON válido en textarea, lo enviamos como objeto; si no, omitimos
        let featuresObj: any = undefined;
        if (current.featuresRaw && current.featuresRaw.trim()) {
            try { featuresObj = JSON.parse(current.featuresRaw); } catch { featuresObj = undefined; }
        }

        const body: any = {
            Name: current.nombre,
            Platform: current.plataforma,
            EcommerceName: current.comercio,
            ...(featuresObj ? { Features: featuresObj } : {}),
            Status: current.status === "Activo" ? 1 : 0,
            UserModified: Number(currentUser?.id ?? 0),
        };

        setSaving(true);
        try {
            const resp = await fetchWithAuth<{ ok: boolean; message?: string }>(
                `comerce-service/account/${current.id}`,
                { method: "PUT", body: JSON.stringify(body) }
            );
            console.log("Actualizado:", resp?.message ?? "OK");
            toast.success("Cuenta de comercio actualizada correctamente");

            // Si el flujo fue "Guardar", volvemos atrás
            if (shouldBackAfterSaveRef.current) {
                shouldBackAfterSaveRef.current = false; // resetea el flag para usos futuros
                router.push("/cuenta/cuentas-comercio/cuentas");
            }

        } catch (err: any) {
            console.error("Error al guardar:", err?.payload ?? err);
            toast.error("Ocurrió un error al guardar la cuenta de comercio");

        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    // Wrapper para "Guardar" (guardar y volver atrás)
    const handleSaveAndBack = useCallback(async () => {
        shouldBackAfterSaveRef.current = true;
        await handleSave();
    }, [handleSave]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />, onClick: handleSave, disabled: saving },
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />, onClick: handleSaveAndBack, disabled: saving },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/cuentas-comercio/cuentas"), disabled: saving },
        ],
        [handleSave, handleSaveAndBack, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Cuentas</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre ?? "—"}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? { text: record.status, variant: record.status === "Activo" ? "success" : "warning" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [record?.nombre, record?.status, headerActions, saving]
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="bg-white flex items-center justify-center px-4 py-6 text-center text-gray-500 text-sm">
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando…
                </div>
            </div>
        );
    }

    if (!record) return <p className="p-4 text-red-500">Registro no encontrado</p>;

    return (
        <div className="p-6 bg-white">
            <CommerceAccountsFields record={record} readOnly={false} onChange={handleChange} /* Resumen: isCreate no va */ />
        </div>
    );
}
