// app/views/Cuenta/Smtp/SmtpNuevo.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SmtpFields, SmtpRecord } from "@/features/cuenta/components/centromensajes/smtpconfig/SmtpFields";

const BASE_PATH = "/cuenta/smtp";

const initialRecord: SmtpRecord = {
    name: "",
    from_name: "",
    from_email: "",
    host: "",
    username: "",
    password: "",
    port: "",
    security_protocol: "",
    status: "Activo",
};

export default function SmtpNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<SmtpRecord>({ ...initialRecord });

    const set =
        <K extends keyof SmtpRecord>(field: K) =>
            (value: SmtpRecord[K]) =>
                setRecord((p) => ({ ...p, [field]: value }));

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("Apply", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Save", record) },
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
                onClick: () => setRecord({ ...initialRecord }),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push(BASE_PATH) },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">SMTP</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
            status: { text: record.status, variant: record.status === "Activo" ? "success" : "warning" },
        } as PageHeaderProps),
        [headerActions, record.status]
    );

    return (
        <div className="p-6 bg-white">
            <SmtpFields record={record} readOnly={false} onChange={(k, v) => set(k)(v)} />
        </div>
    );
}
