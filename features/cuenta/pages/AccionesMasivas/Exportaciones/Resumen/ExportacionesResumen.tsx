"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { ExportsFields, ExportRecord } from "@/features/cuenta/components/accionesmasivas/exportaciones/ExportsFields";

/* Mock sencillo (reemplaza por fetch real si aplica) */
const MOCK: ExportRecord[] = [
    {
        id: "exp-001",
        service: "catalog",
        entity: "product",
        format: "xlsx",
        total: 1,
        date_created: "2021-12-15T11:17",
        status: "Enviado",
        createdBy: { initials: "MV", name: "Manuel Vilches", email: "manuel@fizzmod.com", date: "15/12/2021 11:17" },
        modified: { initials: "MV", name: "Manuel Vilches", email: "manuel@fizzmod.com", date: "15/12/2021 11:17" },
    },
];

export default function ExportsResumenView() {
    const router = useRouter();
    const params = useParams();
    const id = (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)) ?? "";

    const found = MOCK.find((r) => r.id === id);
    const [record, setRecord] = useState<ExportRecord | null>(found ?? null);

    const handleChange = <K extends keyof ExportRecord>(field: K, value: ExportRecord[K]) =>
        setRecord((r) => (r ? { ...r, [field]: value } : r));

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
                onClick: () => router.push("/exportaciones/nuevo"),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/acciones-masivas/exportaciones") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Exportaciones</div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {record ? `${record.service} — ${record.entity}` : "Registro no encontrado"}
                    </div>
                </div>
            ),
            action: headerActions,
            status: { text: record?.status ?? "—", variant: record?.status === "Enviado" ? "success" : record?.status === "Pendiente" ? "warning" : "error" },
        } as unknown as PageHeaderProps),
        [headerActions, record?.service, record?.entity, record?.status]
    );

    if (!record) {
        return <div className="p-6 text-sm text-gray-600">Registro no encontrado</div>;
    }

    return (
        <div className="p-6 bg-white">
            <ExportsFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
