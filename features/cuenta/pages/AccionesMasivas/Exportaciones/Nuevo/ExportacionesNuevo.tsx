"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { ExportsFields, ExportRecord } from "@/features/cuenta/components/accionesmasivas/exportaciones/ExportsFields";

/* Estado inicial */
const initialRecord: ExportRecord = {
    service: "",
    entity: "",
    format: "xlsx",
    total: 0,
    date_created: "", // yyyy-MM-ddTHH:mm
    status: "Pendiente",
    createdBy: { initials: "US", name: "Usuario", email: "usuario@dominio.com", date: new Date().toLocaleString() },
    modified: { initials: "US", name: "Usuario", email: "usuario@dominio.com", date: new Date().toLocaleString() },
};

export default function ExportsNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<ExportRecord>({ ...initialRecord });

    const handleChange = <K extends keyof ExportRecord>(field: K, value: ExportRecord[K]) =>
        setRecord((r) => ({ ...r, [field]: value }));

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
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <ExportsFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
