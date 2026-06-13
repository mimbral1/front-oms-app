
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

import PriceLabelsFields, { PriceLabel } from "@/features/catalogo/components/configuraciones-catalogo/etiquetas-de-precio/PriceLabelsFields";
import { DEFAULT_LABEL_TEMPLATE, LABEL_SAMPLE_JSON } from "@/features/catalogo/components/configuraciones-catalogo/etiquetas-de-precio/DefaultLabelTemplate";

const MOCK_DB: Record<string, PriceLabel> = {
    "1": {
        id: "1",
        name: "Precio Rebajado",
        code: "label-promo",
        size: "10x8 cm",
        status: "Activo",
        service: "Catalog",
        entity: "Precios Oferta",
        generated_href: "#",
        template: DEFAULT_LABEL_TEMPLATE,
        sample_data: LABEL_SAMPLE_JSON,
        user_created: { initials: "JM", name: "Jonathan Molina", email: "jmolina@mimbral.cl", date: "18/08/2025 10:12" },
        user_modified: { initials: "MC", name: "Marcelo Cancino", email: "mcancino@mimbral.cl", date: "18/08/2025 10:12" },
    },
};

export default function PriceLabelsResumen() {
    const router = useRouter();
    const params = useParams();
    const id = (params?.id as string) || "1";

    const [record, setRecord] = useState<PriceLabel | null>(null);
    useEffect(() => { setRecord(MOCK_DB[id] ?? null); }, [id]);

    const headerActions: Action[] = useMemo(() => [
        { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("apply", record) },
        { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("save", record) },
        { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/catalogo/configuraciones-catalogo/etiquetas-de-precio") },
    ], [record, router]);

    usePageHeader(() => ({
        title: (
            <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Etiquetas de precio</div>
                <div className="text-2xl font-semibold text-gray-900">Resumen</div>
            </div>
        ),
        action: headerActions,
        status: { text: record?.status || "Activo", variant: record?.status === "Activo" ? "success" : "warning" },
    }), [headerActions, record?.status]);

    if (!record) return <div className="p-6">Cargando…</div>;

    const onChange = <K extends keyof PriceLabel>(k: K, v: PriceLabel[K]) => setRecord((r) => ({ ...(r as PriceLabel), [k]: v } as PriceLabel));

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <PriceLabelsFields record={record} onChange={onChange} />
            </div>
        </div>
    );
}
