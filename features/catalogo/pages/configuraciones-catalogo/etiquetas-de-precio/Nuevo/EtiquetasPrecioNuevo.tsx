
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import PriceLabelsFields, { PriceLabel } from "@/features/catalogo/components/configuraciones-catalogo/etiquetas-de-precio/PriceLabelsFields";
import { DEFAULT_LABEL_TEMPLATE, LABEL_SAMPLE_JSON } from "@/features/catalogo/components/configuraciones-catalogo/etiquetas-de-precio/DefaultLabelTemplate";

export default function PriceLabelsNuevo() {
    const router = useRouter();

    const [record, setRecord] = useState<PriceLabel>({
        id: "",
        name: "",
        code: "",
        size: "10x8 cm",
        status: "Activo",
        service: "",
        entity: "",
        generated_href: "#",
        template: DEFAULT_LABEL_TEMPLATE,
        sample_data: LABEL_SAMPLE_JSON,
    });

    const onChange = <K extends keyof PriceLabel>(k: K, v: PriceLabel[K]) => setRecord((r) => ({ ...r, [k]: v }));

    const headerActions: Action[] = useMemo(() => [
        { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("save", record) },
        {
            label: "Guardar & Crear nuevo", variant: "success", icon: (
                <div className="relative flex h-5 w-5 items-center justify-center">
                    <SaveOutlined className="h-4 w-4 text-current" />
                    <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]"><FaPlus className="h-2.5 w-2.5 text-blue-500" /></div>
                </div>
            )
        },
        { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/catalogo/configuraciones-catalogo/etiquetas-de-precio") },
    ], [record, router]);

    usePageHeader(() => ({
        title: (
            <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Etiquetas de precio</div>
                <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
            </div>
        ),
        action: headerActions,
        status: { text: record.status, variant: record.status === "Activo" ? "success" : "warning" },
    }), [headerActions, record.status]);

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <PriceLabelsFields record={record} onChange={onChange} />
            </div>
        </div>
    );
}
