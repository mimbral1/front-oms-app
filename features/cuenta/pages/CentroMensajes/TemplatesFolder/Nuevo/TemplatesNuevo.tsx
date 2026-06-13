// app/cuenta/centro-mensajes/templates-page/nuevo/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import TemplatesFields, { Templates } from "@/features/cuenta/components/centromensajes/templatesfolder/TemplatesFields";

import Handlebars from "handlebars";

import { DEFAULT_TEMPLATE } from "@/features/cuenta/components/centromensajes/templatesfolder/DefaultTemplate";

const DEFAULT_JSON = JSON.stringify(
    { titulo: "Bienvenido", nombre: "Felipe" },
    null,
    2
);

export default function TemplatesNewView() {
    const router = useRouter();

    const [record, setRecord] = useState<Templates>({
        id: "new",
        subject: "",
        code: "",
        smtp_config_name: "-",
        status: "Activo",
        destinatario: "",
        responder_a: "",
        body: DEFAULT_TEMPLATE,
        sample_data: DEFAULT_JSON,
    });

    const onChange = <K extends keyof Templates>(k: K, v: Templates[K]) =>
        setRecord((r) => ({ ...r, [k]: v }));

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("apply", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("save", record),
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
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/cuenta/centro-mensajes/templates"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Template
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
            status: { text: record.status, variant: record.status === "Activo" ? "success" : "warning" },
        }),
        [headerActions, record.status]
    );

    // render preview
    let previewHtml = "";
    try {
        const data = JSON.parse(record.sample_data || "{}");
        previewHtml = Handlebars.compile(record.body || "")(data);
    } catch (e: any) {
        previewHtml = `<pre style="color:#b91c1c">${e.message}</pre>`;
    }

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <TemplatesFields record={record} onChange={onChange} />
            </div>
        </div>
    );
}
