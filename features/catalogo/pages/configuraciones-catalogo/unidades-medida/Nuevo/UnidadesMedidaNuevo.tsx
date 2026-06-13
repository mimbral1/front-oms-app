// app/views/Pricing/Price/New/PriceCreatePage.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { UnidadesMedidaFields, UnidadesMedida } from "@/features/catalogo/components/configuraciones-catalogo/unidades-medida/UnidadesMedidaFields";

export function UnidadesMedidaCreateView() {
    const router = useRouter();

    // initial empty UnidadesMedida
    const initial: UnidadesMedida = {
        modalidad: "",
        creacion: "",
        usuario_creador: {
            initials: "",
            name: "",
            email: "",
        },
        modificado: "",
        usuario: {
            initials: "",
            name: "",
            email: "",
        },
        um_venta: "",
        multiplicador_um: "",
        um_ppum: "",
        status: "Inactive",
    }

    const [record, setRecord] = useState<UnidadesMedida>(initial);

    const handleChange = (field: keyof UnidadesMedida, value: string) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Aplicar sin cerrar", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Guardar", record),
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
                onClick: () => {
                    console.log("Guardar y limpiar", record);
                    setRecord(initial);
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/Pricing/Price"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Esquema de barcode
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nueva unidad de medida</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <UnidadesMedidaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
