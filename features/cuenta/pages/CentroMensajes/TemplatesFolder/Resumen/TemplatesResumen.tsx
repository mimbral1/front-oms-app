// app/cuenta/centro-mensajes/templates-page/[id]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import TemplatesFields, { Templates } from "@/features/cuenta/components/centromensajes/templatesfolder/TemplatesFields";

import Handlebars from "handlebars";

import { DEFAULT_TEMPLATE } from "@/features/cuenta/components/centromensajes/templatesfolder/DefaultTemplate";

/** Mock mínimo de ejemplo (ajusta por tu fetch real) */
const MOCK: Templates[] = [
    {
        id: "1",
        subject: "[QA] Export files for the entity {{entity}}",
        code: "export",
        smtp_config_name: "-",
        status: "Activo",
        destinatario: "Juan Hapes",
        responder_a: "Manuel Vilches",
        body: DEFAULT_TEMPLATE,
        sample_data: JSON.stringify({ nombre: "Felipe", entity: "orders" }, null, 2),
    },
];

export default function TemplatesResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<Templates | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const found = MOCK.find((r) => r.id === recordId) || null;
        // si el registro no tiene body, usa el template genérico
        if (found && (!found.body || found.body.trim() === "")) {
            found.body = DEFAULT_TEMPLATE;
        }
        setRecord(found);
        setLoading(false);
    }, [recordId]);

    const onChange = <K extends keyof Templates>(k: K, v: Templates[K]) =>
        setRecord((r) => (r ? { ...r, [k]: v } : r));

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
                    <div className="text-2xl font-semibold text-gray-900">#{record?.id}</div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.status ?? "Inactivo", variant: record?.status === "Activo" ? "success" : "warning" },
        }),
        [headerActions, record?.status, record?.id]
    );

    if (loading) return <p className="p-6">Cargando…</p>;
    if (!record) return <p className="p-6 text-red-600">Registro no encontrado</p>;

    // render preview
    let previewHtml = "";
    try {
        const data = JSON.parse(record.sample_data || "{}");
        const htmlSource = (record.body && record.body.trim() !== "" ? record.body : DEFAULT_TEMPLATE);
        previewHtml = Handlebars.compile(htmlSource)(data);
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
