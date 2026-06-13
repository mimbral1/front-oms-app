"use client";

// Tab "Imagen" del detalle de SKU (/catalogo/skus/[id]/imagen).
//
// Muestra ÚNICAMENTE la imagen core del SAP (core.imagen) en una sola Card.
// No hay galería de marketplaces ni subida de archivos: la pantalla es de
// solo lectura (read-only). Si el SKU no tiene imagen, se muestra un
// placeholder centrado.

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon, ArrowPathIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import { useSkuCore } from "@/features/catalogo/pages/SKUs/shared/sku-core";

export default function ImagenSKUsView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const sku = params?.id ?? "";

    const { core, loading, error } = useSkuCore(sku);

    const nombre = core?.nombre || sku || "Imagen";

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/catalogo/skus"),
            },
        ],
        [router],
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <div className="flex items-center gap-3">
                        {/* Miniatura (solo lectura) con placeholder si no hay imagen */}
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
                            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                                SKU
                            </div>
                            <div className="text-2xl font-semibold text-gray-900">{nombre}</div>
                        </div>
                    </div>
                ),
                action: headerActions,
            } as unknown as PageHeaderProps),
        [headerActions, nombre, core?.imagen, core?.nombre],
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="flex-1 p-6">
                {loading ? (
                    <div className="flex items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                        <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                        Cargando imagen…
                    </div>
                ) : error || !core ? (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-10 text-center text-sm text-rose-700">
                        No se encontró el SKU.
                        {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
                    </div>
                ) : (
                    <Card title="Imagen del producto" icon={PhotoIcon}>
                        {core.imagen ? (
                            <div className="flex justify-center">
                                <img
                                    src={core.imagen}
                                    alt={core?.nombre ?? ""}
                                    className="max-h-[480px] w-auto rounded-lg border border-gray-200 object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                                <PhotoIcon className="h-12 w-12 text-gray-300" />
                                <span className="text-sm text-gray-500">Sin imagen</span>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
