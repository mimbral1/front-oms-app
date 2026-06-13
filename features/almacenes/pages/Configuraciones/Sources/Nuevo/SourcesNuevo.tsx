// views\Almacen\Configuraciones\Sources\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

import { SourcesFields, SourceRecord } from "@/features/almacenes/components/configuraciones/sources/SourcesFields";

/* -----------------------------------------
 * Registro inicial vacío (para Nuevo)
 * ----------------------------------------- */
const initialRecord: SourceRecord = {
    nombre: "",
    refId: "",
    warehouseRefId: "",
    warehouseName: "",
    location: "",
    sourceCode: "",
    plataforma: "",
    salesChannels: "",
    sellers: "",
    notasInternas: "",
    estado: "Activo",
};

export default function SourcesNuevoView() {
    const router = useRouter();

    const [record, setRecord] = useState<SourceRecord>({ ...initialRecord });

    const handleChange = (field: keyof SourceRecord, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    /* Mantener refs estables para evitar loops de PageHeader */
    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    /* -----------------------------------------
     * POST simulado (mock)
     * ----------------------------------------- */
    const handleCreate = useCallback(async () => {
        const current = recordRef.current;

        // Validaciones simples
        const errors: string[] = [];
        if (!current.nombre.trim()) errors.push("Falta el nombre del source.");
        if (!current.refId.trim()) errors.push("Falta el RefID.");

        if (errors.length) {
            console.warn("Validación antes de crear:", errors);
            return;
        }

        try {
            // Simula POST
            await new Promise((r) => setTimeout(r, 400));

            // Reset para otro ingreso
            setRecord({ ...initialRecord });
        } catch (err: any) {
            console.error("Error creando source:", err);
        }
    }, []);

    /* -----------------------------------------
     * Acciones del header (a tu estilo exacto)
     * ----------------------------------------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleCreate,
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
                onClick: handleCreate,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/configuracion/sources"),
            },
        ],
        [router, handleCreate]
    );

    /* -----------------------------------------
     * PageHeader 
     * ----------------------------------------- */
    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Sources
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        Nuevo
                    </div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    /* -----------------------------------------
     * Render de la vista Nuevo
     * ----------------------------------------- */
    return (
        <div className="p-6 bg-white">
            <SourcesFields record={record} onChange={handleChange} />
        </div>
    );
}
