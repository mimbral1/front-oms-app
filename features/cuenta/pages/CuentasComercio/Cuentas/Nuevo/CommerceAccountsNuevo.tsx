// app/views/Commerce/Accounts/New/CommerceAccountNuevoView.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { CommerceAccount, CommerceAccountsFields } from "@/features/cuenta/components/cuentascomercio/cuentas/CommerceAccountsFields";
import { toast } from "react-hot-toast";

/* Registro inicial vacío */
const initialRecord: CommerceAccount = {
    nombre: "",
    comercio: "",
    refId: "",
    plataforma: "",
    status: "Activo",
    salesChannelId: undefined,
    salesChannelName: "",
    featuresRaw: "",
};

import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

export default function CommerceAccountNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<CommerceAccount>({ ...initialRecord });
    const [saving, setSaving] = useState(false);

    const handleChange = (field: keyof CommerceAccount, value: any) => setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    // Flag (ref) para decidir si volver atrás después de guardar
    const shouldBackAfterSaveRef = useRef(false);

    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;

        const errors: string[] = [];
        if (!current?.salesChannelId) errors.push("SalesChannelId es obligatorio");
        if (!current?.nombre?.trim()) errors.push("Name es obligatorio");
        if (!current?.plataforma?.trim()) errors.push("Platform es obligatorio");
        if (errors.length) {
            toast.error("Completa todos los campos obligatorios antes de guardar");
            return;
        }

        let featuresObj: any = undefined;
        if (current?.featuresRaw && current.featuresRaw.trim()) {
            try { featuresObj = JSON.parse(current.featuresRaw); } catch { featuresObj = undefined; }
        }

        const payload: any = {
            SalesChannelId: Number(current.salesChannelId),
            Name: current.nombre.trim(),
            Platform: current.plataforma.trim(),
            EcommerceName: current.comercio ? String(current.comercio) : "",
            ...(featuresObj ? { Features: featuresObj } : {}),
            Status: 1,
            UserCreated: Number(currentUser?.id ?? 0),
        };

        try {
            setSaving(true);
            // console.log("POST /comerce-service/account/Crear", payload);
            const resp = await fetchWithAuth<{ ok: boolean; data?: any }>(
                "comerce-service/account/Crear",
                { method: "POST", body: JSON.stringify(payload) }
            );
            // console.log("Creado OK:", resp);
            setRecord({ ...initialRecord });
            toast.success("Cuenta de comercio creada correctamente");

            // Si se guardó desde "Guardar", volvemos atrás
            if (shouldBackAfterSaveRef.current) {
                router.push("/cuenta/cuentas-comercio/cuentas");
            }
        } catch (err: any) {
            console.error("Error creando account:", err?.payload ?? err);
            toast.error("Ocurrió un error al crear la cuenta de comercio");

        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    // Wrappers: deciden si volver atrás luego de guardar
    const handleCreateAndBack = useCallback(async () => {
        shouldBackAfterSaveRef.current = true;
        await handleCreate();
    }, [handleCreate]);

    const handleCreateAndStay = useCallback(async () => {
        shouldBackAfterSaveRef.current = false;
        await handleCreate();
    }, [handleCreate]);

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Guardar", variant: "success", icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />, onClick: handleCreateAndBack, disabled: saving },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: handleCreateAndStay,
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/cuentas-comercio/cuentas"), disabled: saving },
        ],
        [router, handleCreateAndBack, handleCreateAndStay, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Cuentas</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
            status: saving ? { text: "Guardando…", variant: "info" } : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate: oculta Ref ID en crear */}
            <CommerceAccountsFields record={record} readOnly={false} onChange={handleChange} isCreate />
        </div>
    );
}
