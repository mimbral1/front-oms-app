// app/views/Logs/Detail/LogResumenView.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { LogsFields, LogsRecord } from "@/features/cuenta/components/LogsFields";

/* MOCK (coherente con el listado) */
const MOCK: LogsRecord[] = [
    {
        id: "LOG-01",
        servicio: "id",
        entidad: "user",
        idEntidad: "61ae20eb0be00246e1beba0c",
        motivo: "login",
        mensaje: "Login User Succesfull",
        logTexto: "Auth flow OK\nip: 10.10.10.1\nua: chrome",
        creacion: "2021-12-16T12:41:34",
        expira: "2022-01-15T12:41:34",
        usuarioCreador: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
    },
    {
        id: "LOG-02",
        servicio: "commerce",
        entidad: "api",
        idEntidad: "account",
        motivo: "api-request",
        mensaje: "POST /api/account/614e0abccbbd4900083749cb/process (200)",
        logTexto: "payload: {...}\nstatus: 200",
        creacion: "2021-12-16T11:20:06",
        expira: "2022-01-15T11:20:06",
        usuarioCreador: { initials: "", name: "", email: "" },
    },
    {
        id: "LOG-05",
        servicio: "id",
        entidad: "api",
        idEntidad: "change-client",
        motivo: "api-request",
        mensaje: "POST /api/change-client (200)",
        logTexto: "client changed successfully",
        creacion: "2021-12-16T11:14:08",
        expira: "2022-01-15T11:14:08",
        usuarioCreador: { initials: "IG", name: "Ismael García", email: "ismael@fizzmod.com" },
    },
];

export default function LogResumenView() {
    const router = useRouter();
    const params = useParams();
    const recordId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

    const [record, setRecord] = useState<LogsRecord | null>(null);
    const [loading, setLoading] = useState(true);

    /* Carga inicial desde MOCK */
    useEffect(() => {
        if (!recordId) return;
        const found = MOCK.find((r) => r.id === recordId);
        setRecord(found ?? null);
        setLoading(false);
    }, [recordId]);

    /* Manejo de cambios */
    const handleChange = (field: keyof LogsRecord, value: any) => {
        if (record) setRecord({ ...record, [field]: value });
    };

    /* Acciones del header (mismo patrón que Nuevo) */
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Apply", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Save", record),
            },
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
                onClick: () => router.push("/cuenta/trace/logs/nuevo"),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/cuenta/trace/logs"),
            },
        ],
        [record, router]
    );

    /* PageHeader */
    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Logs</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.id ?? "—"}</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [record?.id, headerActions]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-500">Registro no encontrado</div>;

    return (
        <div className="p-6 bg-white">
            <LogsFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
