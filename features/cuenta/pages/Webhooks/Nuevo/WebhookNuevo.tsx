"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { WebhookFields, type WebhookRecord } from "@/features/cuenta/components/webhooks/WebhookFields";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

const initialRecord: WebhookRecord = {
    name: "",
    status: "Activo",
    endpoint: "",
    domains: {
        oms: { enabled: false, events: [] },
        order: { enabled: false, events: [] },
    },
    headers: [{ id: "h1", key: "", value: "" }],
};

export default function WebhookNuevoPage() {
    const router = useRouter();
    const [record, setRecord] = useState<WebhookRecord>({ ...initialRecord });

    const onChange = <K extends keyof WebhookRecord>(field: K, value: WebhookRecord[K]) =>
        setRecord((r) => ({ ...r, [field]: value }));

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
                onClick: () => setRecord({ ...initialRecord }),
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
                    <div className="text-2xl font-semibold text-gray-900">New</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <WebhookFields record={record} readOnly={false} onChange={onChange} />
        </div>
    );
}
