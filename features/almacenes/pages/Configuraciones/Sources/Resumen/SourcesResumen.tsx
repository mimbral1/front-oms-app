// views\Almacen\Configuraciones\Sources\Resumen\Resumen.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";

import { SourcesFields, SourceRecord } from "@/features/almacenes/components/configuraciones/sources/SourcesFields";

/* -----------------------------
 * Mock temporal para un detalle
 * ----------------------------- */
const MOCK_SOURCE: SourceRecord = {
    nombre: "CD Talca - Adobe Source",
    refId: "AC_SOURCE_CD_TALCA",
    warehouseRefId: "CD_TALCA",
    warehouseName: "CD Talca",

    location: "Talca - Centro Distribución",
    sourceCode: "talca_source_1",
    plataforma: "Adobe Commerce",

    salesChannels: "B2C_WEB, B2B_EMPRESA",
    sellers: "MIMBRAL",

    notasInternas: "Source principal de Adobe para CD Talca",
    estado: "Activo",
};

export default function SourcesResumenView() {
    const router = useRouter();
    const { id } = useParams();

    const [record, setRecord] = useState<SourceRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* Carga inicial (mock) */
    useEffect(() => {
        let mounted = true;
        setLoading(true);

        setTimeout(() => {
            if (!mounted) return;

            if (!id) {
                setErrorMessage("No se encontró el source.");
                setRecord(null);
            } else {
                setRecord({ ...MOCK_SOURCE });
            }

            setLoading(false);
        }, 300);

        return () => {
            mounted = false;
        };
    }, [id]);

    const handleChange = (field: keyof SourceRecord, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 400));
        setSaving(false);
    };

    /* Header actions */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                    <CheckCircleIcon className="h-5 w-5" />
                ),
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/configuracion/sources"),
                disabled: saving,
            },
        ],
        [saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Sources
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {id}
                    </div>
                </div>
            ),
            action: headerActions,
            status: record
                ? { text: record.estado, variant: record.estado === "Activo" ? "success" : "warning" }
                : undefined,
        } as PageHeaderProps),
        [headerActions, record?.estado]
    );

    /* Render */
    if (loading)
        return (
            <div className="p-6 text-sm text-gray-500">
                <ArrowPathIcon className="h-5 w-5 animate-spin inline mr-2" />
                Cargando…
            </div>
        );

    if (errorMessage)
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md">
                    {errorMessage}
                </div>
            </div>
        );

    if (!record)
        return <div className="p-6 text-red-600">No se encontró el source.</div>;

    return (
        <div className="p-6 bg-white">
            <SourcesFields record={record} onChange={handleChange} />
        </div>
    );
}
