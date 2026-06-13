"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { UnidadesMedidaFields, UnidadesMedida } from "@/features/catalogo/components/configuraciones-catalogo/unidades-medida/UnidadesMedidaFields";

const MOCK: UnidadesMedida[] = [
    {
        id: "1",
        modalidad: "un",
        creacion: "04/02/2021 17:12",
        usuario_creador: {
            initials: "EN",
            name: "Ezequiel Naveiro",
            email: "ezequiel.naveiro@example.com",
        },
        modificado: "23/10/2023 19:01",
        usuario: {
            initials: "EN",
            name: "Ezequiel Naveiro",
            email: "ezequiel.naveiro@example.com",
        },
        status: "Active",
        um_venta: "",
        multiplicador_um: "",
        um_ppum: ""
    },
    // …otros mocks…
];

export function UnidadesMedidaEditView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<UnidadesMedida | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (recordId) {
            const found = MOCK.find((r) => r.id === recordId);
            setRecord(found ?? null);
            setLoading(false);
        }
    }, [recordId]);

    const handleChange = (field: keyof UnidadesMedida, value: string) => {
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
                // onClick: () => router.push("/Pricing/Price/New"),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/configuraciones-catalogo/unidades-medida"),
            },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            // title: `(anadir nombre por sku): ${record?.id ?? "—"}`,
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Esquema de barcode
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">anadir nombre por sku: {record?.id ?? "—"}</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? {
                    text: record.status,
                    variant: record.status === "Active" ? "success" : "warning",
                }
                : undefined,
        } as unknown as PageHeaderProps),
        [record?.id, headerActions]
    );

    if (loading) return <p className="p-4">Cargando…</p>;
    if (!record)
        return <p className="p-4 text-red-500">Registro no encontrado</p>;

    return (
        <div className="p-6 bg-white">
            <UnidadesMedidaFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
