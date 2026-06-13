// app/views/Cuenta/Smtp/SmtpResumen.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SmtpFields, SmtpRecord } from "@/features/cuenta/components/centromensajes/smtpconfig/SmtpFields";

const MOCK: SmtpRecord[] = [
    {
        id: "smtp-qa",
        name: "QA Default",
        from_name: "Janis QA",
        from_email: "qa@janis.dev",
        host: "smtp.mailtrap.io",
        username: "qa_user",
        password: "secret",
        port: 587,
        security_protocol: "TLS",
        status: "Activo",
    },
    {
        id: "smtp-prod",
        name: "Production",
        from_name: "Mimbral",
        from_email: "no-reply@mimbral.cl",
        host: "smtp.sendgrid.net",
        username: "apikey",
        password: "secret",
        port: 465,
        security_protocol: "SSL",
        status: "Inactivo",
    },
];

const BASE_PATH = "/cuenta/smtp";

export default function SmtpResumenView() {
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

    const found = MOCK.find((r) => r.id === id);
    const [record, setRecord] = useState<SmtpRecord | null>(found ? { ...found } : null);

    const handleChange = <K extends keyof SmtpRecord>(field: K, value: SmtpRecord[K]) => {
        if (!record) return;
        setRecord({ ...record, [field]: value });
    };

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
                onClick: () => router.push(`${BASE_PATH}/new`),
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
                    <div className="text-2xl font-semibold text-gray-900">{record?.name ?? id ?? "Registro"}</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? { text: record.status, variant: record.status === "Activo" ? "success" : "warning" }
                : undefined,
        } as PageHeaderProps),
        [headerActions, record?.name, record?.status, id]
    );

    if (!record) {
        return <div className="p-6 bg-white rounded-xl">Registro no encontrado</div>;
    }

    return (
        <div className="p-6 bg-white">
            <SmtpFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
