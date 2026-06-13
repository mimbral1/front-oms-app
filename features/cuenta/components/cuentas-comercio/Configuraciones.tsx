// views/Cuenta/CuentasComercio/Cuentas/Configuraciones/Configuraciones.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { AccountConfig, ConfigFields } from "./ConfigFields";
import { DownloadIcon } from "lucide-react";

const initialConfig: AccountConfig = {
    // DETALLE
    detalle_nombre: "Janis",
    detalle_tipo: "Parent",
    detalle_cuentaVtex: "janis",
    detalle_parent: "",
    // AUTENTICACIÓN
    auth_usuario: "vtexappkey-janis-DHLQKL",
    auth_password: "",
    // COMERCIO
    comercio_publicarSalesChannels: false,
    comercio_importarSalesChannels: true,
    // CATÁLOGO
    catalogo_publicarMarcas: false,
    catalogo_importarMarcas: false,
    catalogo_publicarCategorias: false,
    catalogo_importarCategorias: false,
    catalogo_publicarAtributos: false,
    catalogo_importarAtributos: true,
    catalogo_publicarProductos: false,
    catalogo_generateUniqueSlugs: false,
    catalogo_importarProductos: false,
    catalogo_importProductsSync: true,
    catalogo_publishSkuImages: false,
    catalogo_importSkuImages: false,
    catalogo_restringirCanalesVenta: "",
    // PRECIOS
    precios_publicar: false,
    precios_importar: false,
    precios_importarSync: true,
    precios_useBasePricesAsPrices: false,
    precios_importarListPrice: false,
    // META
    creador: { initials: "MV", name: "Manuel Vilche", email: "manuel.vilche@janis…" },
    creador_fecha: "12/08/2021 10:45:08",
    ultimaMod: { initials: "AM", name: "Ariel Mikowski", email: "ariel.mikowski@…" },
    ultimaMod_fecha: "23/03/2023 14:48:53",
};

export default function CommerceAccountConfigView() {
    const router = useRouter();
    const [record, setRecord] = useState<AccountConfig>({ ...initialConfig });

    const handleChange = <K extends keyof AccountConfig>(field: K, value: AccountConfig[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => console.log("Apply", record) },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => console.log("Save", record) },
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
                onClick: () => setRecord({ ...initialConfig }),
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/cuentas-comercio/cuentas") },
        ],
        [record, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Cuentas</div>
                    <div className="text-2xl font-semibold text-gray-900">Configuraciones</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            {/* Botón arriba a la derecha */}
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={() => console.log("Start import triggered")}
                    className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-600 transition"
                >
                    <DownloadIcon className="h-5 w-5" />
                    Start import
                </button>
            </div>

            {/* campos */}
            <ConfigFields record={record} onChange={handleChange} />
        </div>
    );
}
