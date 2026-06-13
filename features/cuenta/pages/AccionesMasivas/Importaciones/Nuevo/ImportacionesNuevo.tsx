// app/views/Operaciones/Importaciones/New/ImportacionesNuevoView.tsx
"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { ImportacionesFields, type Importacion } from "@/features/cuenta/components/accionesmasivas/importaciones/ImportacionesFields";

/* --------------------------------------------------------------------------
   Registro inicial (vacío) — igual patrón que Nuevo de Canales
--------------------------------------------------------------------------- */
const initialRecord: Importacion = {
    service: "",
    entity: "",
    fileName: "",
    size: "",
    mimeType: "",
    startDate: "",
    endDate: "",
    viewLink: "",
    total: 0,
    created: 0,
    updated: 0,
    notModified: 0,
    error: 0,
    status: "Processed",
    createdBy: { username: "—", email: "—", date: "—" },
    lastModified: { date: "—" },
};

export default function ImportacionesNuevoView() {
    const router = useRouter();

    const [record, setRecord] = useState<Importacion>({ ...initialRecord });
    const handleChange = (field: keyof Importacion, value: any) => setRecord((prev) => ({ ...prev, [field]: value }));

    // Mantener referencias estables para evitar bucles en usePageHeader
    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    // POST (mock): crear registro de importación
    const handleCreate = useCallback(async () => {
        const current = recordRef.current as Importacion;
        // Validaciones mínimas
        const errors: string[] = [];
        if (!current.service) errors.push("Falta seleccionar el servicio.");
        if (!current.entity) errors.push("Falta seleccionar la entidad.");
        if (!current.fileName) errors.push("Falta el nombre del archivo.");

        if (errors.length) {
            console.warn("Validación antes de POST (mock):", errors);
            return;
        }

        try {
            // Aquí iría el POST real vía fetch-with-auth
            console.log("Creado (mock):", current);
            // limpiar y quedar listo para otro registro
            setRecord({ ...initialRecord });
        } catch (err: any) {
            console.error("Error creando importación (mock):", err);
        }
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: handleCreate },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: handleCreate },
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
                    handleCreate();
                },
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/acciones-masivas/importaciones") },
        ],
        [router, handleCreate]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Importación</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* isCreate oculta tarjetas de usuario (siguiendo patrón) */}
            <ImportacionesFields record={record} onChange={handleChange} isCreate />
        </div>
    );
}
