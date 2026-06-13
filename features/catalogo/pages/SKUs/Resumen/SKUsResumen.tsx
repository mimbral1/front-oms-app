// views\CatalogoView\SKUs\Resumen\Resumen.tsx
"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon, ArrowPathIcon, PhotoIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { Sku, SKUsFields } from "@/features/catalogo/components/skus/SKUsFields";
import { useSkuCore } from "@/features/catalogo/pages/SKUs/shared/sku-core";

/* Estado base vacío: campos sin fuente real en Fase 1 se dejan en blanco/0 */
const EMPTY: Sku = {
    refId: "",
    refIdProducto: "",
    nombre: "",
    codigosBarra: "",
    esNuevo: false,
    fechaLanzamiento: "",
    modal: "",
    status: "Activo",
    umVenta: "",
    multiplicadorUmVenta: 0,
    umPpum: "",
    multiplicadorUmPpum: 0,
    dimensionesAncho: 0,
    dimensionesAltura: 0,
    dimensionesProfundidad: 0,
    dimensionesPeso: 0,
    bultoAncho: 0,
    bultoAltura: 0,
    bultoProfundidad: 0,
    bultoPeso: 0,
};

export default function SKUsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    /* Carga real (read-only) desde catalog-service */
    const { core, loading, error } = useSkuCore(recordId);

    /* Construir el objeto Sku a partir del core: solo se llenan los campos con
       fuente real; el resto queda vacío (no se inventan valores). */
    const record = useMemo<Sku | null>(() => {
        if (!core) return null;
        return {
            ...EMPTY,
            id: recordId,
            refId: core.sku,
            nombre: core.nombre,
            codigosBarra: core.ean ?? "",
            status: core.status,
            created: core.createdDate
                ? { username: "", date: core.createdDate }
                : undefined,
            modified:
                core.modifiedByName || core.modifiedDate
                    ? {
                        username: core.modifiedByName ?? "",
                        email: core.modifiedByEmail ?? "",
                        date: core.modifiedDate ?? "",
                    }
                    : undefined,
        };
    }, [core, recordId]);

    /* Edición/guardado deshabilitados: Resumen es solo lectura (SAP read-only). */
    const handleChange = (_field: keyof Sku, _value: any) => {
        /* no-op: la pantalla es de solo lectura en Fase 1 */
    };

    /* Header Actions: Aplicar/Guardar visibles pero sin efecto (SAP es de solo
       lectura por esta ruta; el onClick es un no-op, no se llama a ningún PUT). */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => {},
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => {},
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/skus"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div className="flex items-center gap-3">
                    {/* Imagen del producto (solo lectura) con placeholder si no hay */}
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        {core?.imagen ? (
                            <img
                                src={core.imagen}
                                alt={core?.nombre || "Producto"}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <PhotoIcon className="h-6 w-6 text-gray-300" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">SKU</div>
                        {/* El nombre del producto como título grande */}
                        <div className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                            {core?.nombre || "Cargando..."}
                            {core?.status && (
                                <span className={`text-xs px-3 py-1 rounded-full text-white font-medium ${core.status === "Activo" ? "bg-green-500" : "bg-gray-400"}`}>
                                    {core.status}
                                </span>
                            )}
                        </div>
                        {/* Categoría / marca (solo lectura) si están disponibles */}
                        {(core?.categoria || core?.marca) && (
                            <div className="mt-0.5 text-xs text-gray-500">
                                {[core?.categoria, core?.marca].filter(Boolean).join(" · ")}
                            </div>
                        )}
                    </div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions, core?.nombre, core?.status, core?.imagen, core?.categoria, core?.marca]
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                    <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                    Cargando…
                </div>
            </div>
        );
    }
    if (error || !record) return <div className="p-6 text-red-600">No se encontró el SKU.</div>;

    return (
        <div className="p-6 bg-white">
            <SKUsFields record={record} readOnly onChange={handleChange} />
        </div>
    );
}
