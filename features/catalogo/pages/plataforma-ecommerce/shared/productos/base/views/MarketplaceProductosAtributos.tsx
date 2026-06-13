"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, XCircle } from "lucide-react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import type { Action } from "@/components/layout/page-header";
import { MarketplaceProductosAtributosSection } from "@/features/catalogo/components/plataforma-ecommerce/shared/productos/base/MarketplaceProductosAtributosSection";
import { useMarketplaceProductoDetailData } from "../hooks/useMarketplaceProductoDetailData";
import { resolveMarketplaceKey } from "../utils/marketplace";

export function MarketplaceProductosAtributos() {
    const params = useParams();
    const router = useRouter();
    const platform = useEcommercePlatform();
    const baseRoute = `${platform.basePath}/productos`;
    const itemCode = params?.id as string;
    const marketplaceKey = useMemo(() => resolveMarketplaceKey(platform.name), [platform.name]);

    const {
        product,
        editFields,
        editAttributes,
        loading,
        error,
        fetchProduct,
        handleAttributeChange,
    } = useMarketplaceProductoDetailData(itemCode, marketplaceKey);

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Recargar",
                variant: "primary",
                icon: <RefreshCw className="h-5 w-5" />,
                onClick: () => {
                    fetchProduct({ force: true });
                },
            },
            {
                label: "Cancelar",
                variant: "secondary",
                icon: <XCircle className="h-5 w-5" />,
                onClick: () => router.push(baseRoute),
            },
        ],
        [router, fetchProduct, baseRoute]
    );

    const title = useMemo(() => {
        const raw = editFields.titulo;
        const titulo = typeof raw === "string" ? raw : "";
        return titulo ? `${titulo} (${itemCode})` : `Producto ${itemCode}`;
    }, [editFields.titulo, itemCode]);

    usePageHeader(
        () => ({
            title,
            action: headerActions,
        }),
        [title, headerActions]
    );

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500">
                <RefreshCw className="h-5 w-5 inline animate-spin mr-2" />
                Cargando atributos...
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="p-6">
                <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700">
                    <p className="text-sm font-medium">{error || "Producto no encontrado"}</p>
                    <button onClick={() => router.push(baseRoute)} className="mt-2 text-sm underline">
                        Volver al listado
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
            <MarketplaceProductosAtributosSection
                attributes={product.atributos || []}
                editAttributes={editAttributes}
                onAttributeChange={handleAttributeChange}
            />
        </div>
    );
}

