// views\PedidosView\Configuraciones\PerfilesImportacion\Resumen\PerfilesImportacionResumenView.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

import PerfilesImportacionFields, {
    PerfilImportacion,
} from "@/features/pedidos/components/configuraciones/perfilesimportacion/PerfilesImportacionFields";

/* ========================================================================
   MOCK DE PERFIL 
======================================================================== */
const EMPTY: PerfilImportacion = {
    nombre: "VTEX B2C – Delivery pagado",
    prioridad: "P1",

    importar: true,
    sincronizar: true,

    sellerScope: "any",
    estadoPerfil: "Activo",

    cuentas: ["VTEX-B2C"],
    canales: ["WEB-B2C", "MOBILE-APP"],
    pickup: ["PICKUP-STORE-01"],
    tiposEnvio: ["DELIVERY", "SCHEDULED_DELIVERY"],

    comentario: "Sólo órdenes con pago aprobado en VTEX.",
};

/* USUARIO MOCK */
const mockUserCreator = {
    nombre: "Juan Pérez",
    correo: "juan.perez@mimbral.cl",
    fecha: "2025-11-10 14:22",
};

const mockUserUpdate = {
    nombre: "María López",
    correo: "maria.lopez@mimbral.cl",
    fecha: "2025-11-21 09:47",
};

export default function PerfilesImportacionResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<PerfilImportacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    /* ========================================================================
       CARGA DE DATOS (MOCK)
    ======================================================================== */
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);

            try {
                const data = { ...EMPTY };
                if (mounted) setRecord(data);
            } catch (e) {
                console.error("Error cargando perfil de importación:", e);
                if (mounted) setRecord({ ...EMPTY });
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [recordId]);

    /* ========================================================================
       CAMBIOS
    ======================================================================== */
    const handleChange = (field: keyof PerfilImportacion, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    /* ========================================================================
       GUARDAR (MOCK)
    ======================================================================== */
    const handleSave = useCallback(async () => {
        if (!recordRef.current) return;

        setSaving(true);
        console.log("Guardar Perfil Importación:", recordRef.current);

        setTimeout(() => {
            setSaving(false);
        }, 600);
    }, []);

    /* ========================================================================
       ACTIONS HEADER 
    ======================================================================== */
    const headerActions = useMemo<Action[]>(
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
                    <SaveOutlined className="h-4 w-4" />
                ),
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/pedidos/configuraciones/perfiles-importacion"),
                disabled: saving,
            },
        ],
        [handleSave, router, saving]
    );

    /* ========================================================================
       PAGE HEADER 
    ======================================================================== */
    const headerConfig = useMemo<PageHeaderProps>(() => ({
        title: (
            <div>
                <div className="text-xs uppercase font-semibold text-blue-600 tracking-wider">
                    Perfiles de Importación
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                    {record?.nombre || "Resumen"}
                </div>
            </div>
        ),
        action: headerActions,
        status: saving
            ? { text: "Guardando…", variant: "info" }
            : record
                ? {
                    text: record.estadoPerfil,
                    variant:
                        record.estadoPerfil === "Activo"
                            ? "success"
                            : "warning",
                }
                : undefined,
    }), [headerActions, saving, record?.estadoPerfil, record?.nombre]);

    usePageHeader(() => headerConfig, [headerConfig]);

    /* ========================================================================
       LOADING 
    ======================================================================== */
    if (loading)
        return (
            <div className="p-6 text-gray-600">
                Cargando…
            </div>
        );

    if (!record)
        return (
            <div className="p-6 text-red-600">
                No se encontró el perfil.
            </div>
        );

    /* ========================================================================
       RETURN 
    ======================================================================== */
    return (
        <div className="p-6 bg-white">
            <PerfilesImportacionFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                isCreate={false}
            />
        </div>
    );

}
