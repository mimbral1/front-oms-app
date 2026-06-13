// views\PickingView\configuraciones\configuraciones-picking\ConfiguracionesPickingView.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { ConfiguracionesPickingFields, ConfiguracionesPicking } from "@/features/picking/components/pickingview/configuraciones/configuraciones-picking/ConfiguracionesPickingFields";
import { useRouter } from "next/navigation";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

export function ConfiguracionesPickingView() {
    const [config, setConfig] = useState<ConfiguracionesPicking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {

        const fetchConfig = async () => {
            setLoading(true);
            try {

                setConfig({
                    visibilidadPicker: 'Mine and unassigned',
                    elegirRonda: true,
                    barcodeType: 'None',
                    posponerItems: true,
                    omitirItems: true,
                    desplegar: true,
                    itemsSueltos: true,
                    itemsFaltantes: true,
                    confirmarItemsPos: true,
                    confirmarItemsIgn: true,
                    confirmarItemsDesp: true,
                    confirmarItemsSinCanasto: true,
                    sustitucionOnline: 'Can pick unknown items',
                    sustitucionOffline: 'Can pick original items only',
                    criteriosSustitucionEstandar: ['Misma marca', 'Marca propia', 'Tamaño similar'],
                    criteriosSustitucionCandidatos: ['Misma marca', 'Marca propia', 'Tamaño similar'],
                    pickearCantidadMayor: true,
                    tipoIdPedido: 'Commerce',
                });
            } catch (err) {
                setError("Error al cargar la configuración.");
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleChange = (field: keyof ConfiguracionesPicking, value: any) => {
        if (config) {
            setConfig(prevConfig => ({
                ...prevConfig!,
                [field]: value,
            }));
        }
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => console.log("Apply without closing", config),
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => console.log("Save", config),
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/configuraciones-picking"),
            },
        ],
        [config, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Configuración
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Configuraciones del picking</div>
                </div>
            ),
            action: headerActions,
            // status: config
            //     ? {
            //         text: config.status,
            //         variant: config.status === "Active" ? "success" : "warning",
            //     }
            //     : undefined,
        } as PageHeaderProps),
        [config, headerActions]
    );

    if (loading) return <p>Cargando configuración...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!config) return <p>No se encontró la configuración.</p>;

    return (
        <div className="p-6 bg-white">
            <ConfiguracionesPickingFields config={config} readOnly={false} onChange={handleChange} />
        </div>
    );
}
