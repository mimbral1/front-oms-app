// views\Customers\Csx\Canales\Resumen\Resumen.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import CanalesFields, { Canal } from "@/features/customers/components/csx/canales/CanalesFields";

/* Mock para ejemplo (ajústalo a tu backend) */
const MOCK: Canal[] = [
    {
        id: "CV-001",
        nombre: "Call Center",
        descripcion: "Llamadas recibidas en Call Center",
        logistica: true,
        defaultStockout: true,
        mostrarReportes: true,
        status: "Activo",
        created: { username: "Leonardo Gambini", email: "leonardo.gambini@janis.com", date: "07/02/2024 12:24:37" },
        modified: { username: "Leonardo Gambini", email: "leonardo.gambini@janis.com", date: "07/02/2024 12:24:37" },
    },
];

export default function CanalesResumen() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = Array.isArray(params?.id) ? params!.id[0] : params?.id;

    const [record, setRecord] = useState<Canal | null>(null);

    useEffect(() => {
        const found = MOCK.find((c) => c.id === id) ?? MOCK[0];
        setRecord(found);
    }, [id]);

    const onChange = <K extends keyof Canal>(field: K, value: Canal[K]) =>
        setRecord((p) => (p ? { ...p, [field]: value } : p));

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("Aplicar", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Guardar", record) },
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
                onClick: () => router.push("customers/csx/canales/nuevo"),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/canales") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
            ({ title: record?.nombre || "Canal", action: headerActions, status: record ? { text: record.status, variant: record.status === "Activo" ? "success" : "warning" } : undefined } as PageHeaderProps),
        [headerActions, record?.nombre, record?.status]
    );

    if (!record) return <div className="p-6">Cargando…</div>;

    return (
        <div className="p-6 bg-white">
            <CanalesFields record={record} readOnly={false} onChange={onChange} />
        </div>
    );
}
