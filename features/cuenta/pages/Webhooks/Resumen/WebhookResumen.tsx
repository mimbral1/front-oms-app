"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { WebhookFields, type WebhookRecord } from "@/features/cuenta/components/webhooks/WebhookFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

/* Mock base (en real: fetch por id) */
const MOCK: WebhookRecord[] = [
    {
        id: "wh_001",
        name: "Notificación de pedido Listo para facturar",
        status: "Activo",
        endpoint: "https://endpoint.prueba.com/",
        domains: {
            oms: { enabled: false, events: [] },
            order: { enabled: true, events: ["ready-for-invoice"] },
        },
        headers: [
            { id: "h1", key: "Api-Key", value: "123456" },
            { id: "h2", key: "Api-Token", value: "123456789" },
        ],
        creator: { initials: "BB", name: "Bruno Bellini", email: "bruno@…", date: "09/02/2025 11:11:45" },
        lastmod: { initials: "BB", name: "Bruno Bellini", email: "bruno@…", date: "09/02/2025 11:11:45" },
    },
];

export default function WebhookResumenPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

    const found = MOCK.find((w) => w.id === id);
    const [record, setRecord] = useState<WebhookRecord | null>(found ?? null);

    const onChange = <K extends keyof WebhookRecord>(field: K, value: WebhookRecord[K]) =>
        setRecord((r) => (r ? { ...r, [field]: value } : r));

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("apply", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("save", record) },
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
                onClick: () => router.push("/webhooks/new"),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/webhooks") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Subscription</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record?.name || id || "Webhook"}
                    </div>
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
        return <div className="p-6 text-sm text-gray-600">Registro no encontrado.</div>;
    }

    return (
        <div className="p-6 bg-white">
            <WebhookFields record={record} readOnly={false} onChange={onChange} />
        </div>
    );
}
