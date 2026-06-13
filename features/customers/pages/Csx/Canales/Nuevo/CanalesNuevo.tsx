// views\Customers\Csx\Canales\Nuevo.tsx\Nuevo.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import CanalesFields, { Canal } from "@/features/customers/components/csx/canales/CanalesFields";

export default function CanalesNuevo() {
    const router = useRouter();

    const initial: Canal = {
        nombre: "",
        descripcion: "",
        logistica: false,
        defaultStockout: false,
        mostrarReportes: false,
        status: "Activo",
        created: undefined,
        modified: undefined,
    };

    const [record, setRecord] = useState<Canal>(initial);
    const onChange = <K extends keyof Canal>(field: K, value: Canal[K]) =>
        setRecord((p) => ({ ...p, [field]: value }));

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
                onClick: () => setRecord(initial),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/csx/canales") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
            ({ title: "Nuevo canal", action: headerActions } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <CanalesFields record={record} readOnly={false} onChange={onChange} />
        </div>
    );
}
