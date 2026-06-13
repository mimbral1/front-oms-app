"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

import DocumentosFields, { Documento } from "@/features/cuenta/components/accionesmasivas/documentos/DocumentosFields";

/* Mock mínimo por id */
const DB: Record<string, Documento> = {
    "1": {
        id: "DOC-001",
        servicio: "WMS",
        entidad: "position",
        generated_href: "#",
        status: "Subido",
        template: "",          // usa default REMITO si viene vacío
        template_barcode: "",  // usa default QR+Barras si viene vacío
        sample_data: "",       // usa JSON de ejemplo si viene vacío
        user_created: { name: "Ariel Mikowski", email: "ariel.mikowski@janis.com", date: "10/12/2021 15:40" },
        user_modified: { name: "Ariel Mikowski", email: "ariel.mikowski@janis.com", date: "10/12/2021 15:40" },
    },
};

export default function ResumenDocumento() {
    const router = useRouter();
    const params = useParams();
    const id = (params?.id as string) || "DOC-001";

    const [record, setRecord] = useState<Documento | null>(null);
    useEffect(() => setRecord(DB[id] ?? null), [id]);

    const actions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("apply", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("save", record) },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/acciones-masivas/documentos") },
        ],
        [record, router]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Documentos</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                </div>
            ),
            status: { text: record?.status || "Subido", variant: record?.status === "Subido" ? "success" : "warning" },
            action: actions,
        }),
        [actions, record?.status]
    );

    if (!record) return <div className="p-6">Cargando…</div>;

    const onChange = <K extends keyof Documento>(k: K, v: Documento[K]) =>
        setRecord((r) => ({ ...(r as Documento), [k]: v } as Documento));

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <DocumentosFields record={record} onChange={onChange} />
            </div>
        </div>
    );
}
