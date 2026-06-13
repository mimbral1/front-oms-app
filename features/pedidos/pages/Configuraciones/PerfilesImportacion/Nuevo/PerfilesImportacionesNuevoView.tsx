// views\PedidosView\Configuraciones\PerfilesImportacion\Nuevo\PerfilesImportacionesNuevoView.tsx
"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import PerfilesImportacionFields, { PerfilImportacion } from "@/features/pedidos/components/configuraciones/perfilesimportacion/PerfilesImportacionFields";

import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";

/* Registro inicial */
const initialRecord: PerfilImportacion = {
    nombre: "",
    prioridad: "P1",

    importar: true,
    sincronizar: true,

    sellerScope: "any",
    estadoPerfil: "Activo",

    cuentas: ["VTEX-B2C"],
    canales: ["WEB-B2C"],
    pickup: [],
    tiposEnvio: ["DELIVERY"],

    comentario: "",
};

export default function PerfilesImportacionesNuevoView() {
    const router = useRouter();

    const [record, setRecord] = useState<PerfilImportacion>({ ...initialRecord });

    /* Cambio de campos */
    const handleChange = (field: keyof PerfilImportacion, value: any) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    /* Crear (mock) */
    const handleCreate = useCallback(async () => {
        console.log("Crear Perfil Importación:", recordRef.current);

        /* reset del formulario */
        setRecord({ ...initialRecord });
    }, []);

    /* Acciones del Header */
    const headerActions = useMemo<Action[]>(() => [
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
            onClick: () => router.push("/pedidos/configuraciones/perfiles-importacion"),
        },
    ], [handleCreate, router]);

    /* Header */
    const headerConfig = useMemo<PageHeaderProps>(() => ({
        title: (
            <div>
                <div className="text-xs uppercase font-semibold text-blue-600 tracking-wider">
                    Perfiles de Importación
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                    Nuevo
                </div>
            </div>
        ),
        action: headerActions,
    }), [headerActions]);

    usePageHeader(() => headerConfig, [headerConfig]);

    /* ============================================================
       RETURN 
    ============================================================ */
    return (
        <div className="p-6 bg-white">
            <div className="space-y-6">
                {/* FIELDS COMPLETOS (solo columna izquierda porque isCreate=true) */}
                <PerfilesImportacionFields
                    record={record}
                    readOnly={false}
                    onChange={handleChange}
                    isCreate
                />
            </div>
        </div>
    );
}
