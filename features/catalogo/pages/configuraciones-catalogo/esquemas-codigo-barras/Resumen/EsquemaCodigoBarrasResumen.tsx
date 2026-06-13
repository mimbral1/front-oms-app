"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { EsquemaFields, Esquema } from "@/features/catalogo/components/configuraciones-catalogo/esquemas-codigo-barras/EsquemaFields";

const MOCK: Esquema[] = [
    {
        id: '1',
        nombre: "Esquema para pesables",
        refId: "PES0122",
        motivo: "Code128",
        posicion_inicial: "1",
        posicion_final: "6",
        status: "Active",
    }
];

export function EsquemaEditView() {

    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<Esquema | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (recordId) {
            const found = MOCK.find((r) => r.id === recordId);
            setRecord(found ?? null);
            setLoading(false);
        }
    }, [recordId]);

    const handleChange = (field: keyof Esquema, value: string) => {
        if (record) setRecord({ ...record, [field]: value });
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Apply without closing", record),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Save", record),
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
                onClick: () => router.push("/Pricing/Price/New"),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/configuraciones-catalogo/esquemas-codigo-barras"),
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
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [record?.nombre, headerActions]
    );


    if (loading) return <p className="p-4">Cargando…</p>;
    if (!record)
        return <p className="p-4 text-red-500">Registro no encontrado</p>;


    return (
        <div className="p-6 bg-white">
            <EsquemaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    )
}