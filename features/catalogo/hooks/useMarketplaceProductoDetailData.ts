"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { URL_PIM_SERVICE } from "@/lib/http/endpoints";
import type { ProductDetail } from "@/features/catalogo/types/plataforma-ecommerce/detail-types";

// URL del pim-service via Tailscale Funnel (env). Antes era IP LAN hardcoded.
const DETAIL_API_BASE = `${URL_PIM_SERVICE}/api/pim/productos`;
const detailCache = new Map<string, ProductDetail>();
const inFlightRequests = new Map<string, Promise<ProductDetail>>();

export function useMarketplaceProductoDetailData(itemCode?: string, marketplace: string = "ml") {
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [editFields, setEditFields] = useState<Record<string, string | number | boolean | null>>({});
    const [editAttributes, setEditAttributes] = useState<Record<string, string | number | boolean | string[] | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const editRef = useRef(editFields);
    useEffect(() => {
        editRef.current = editFields;
    }, [editFields]);

    const hydrateEditableState = useCallback((data: ProductDetail) => {
        const dynamicFields: Record<string, string | number | boolean | null> = {};
        Object.entries(data.campos_basicos || {}).forEach(([key, field]) => {
            dynamicFields[key] = field?.valor ?? null;
        });
        setEditFields(dynamicFields);

        const dynamicAttributes: Record<string, string | number | boolean | string[] | null> = {};
        (data.atributos || []).forEach((attr) => {
            dynamicAttributes[attr.id] = attr?.valor ?? null;
        });
        setEditAttributes(dynamicAttributes);
    }, []);

    const fetchProduct = useCallback(async (options?: { force?: boolean }) => {
        if (!itemCode) return;

        const cacheKey = `${marketplace}:${itemCode}`;

        const force = options?.force === true;
        const cached = detailCache.get(cacheKey);

        if (!force && cached) {
            setProduct(cached);
            hydrateEditableState(cached);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let request = !force ? inFlightRequests.get(cacheKey) : undefined;
            if (!request) {
                request = fetch(
                    `${DETAIL_API_BASE}/${encodeURIComponent(itemCode)}/detalle?marketplace=${encodeURIComponent(marketplace)}`,
                    {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                        cache: "no-store",
                    }
                ).then(async (response) => {
                    if (!response.ok) {
                        const body = await response.text().catch(() => "");
                        throw new Error(`HTTP ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`);
                    }
                    return (await response.json()) as ProductDetail;
                });

                if (!force) {
                    inFlightRequests.set(cacheKey, request);
                }
            }

            const data = await request;
            detailCache.set(cacheKey, data);
            setProduct(data);
            hydrateEditableState(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar el producto");
        } finally {
            inFlightRequests.delete(cacheKey);
            setLoading(false);
        }
    }, [itemCode, marketplace, hydrateEditableState]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const handleFieldChange = useCallback((field: string, value: string | number | boolean) => {
        setEditFields((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleAttributeChange = useCallback(
        (field: string, value: string | number | boolean | string[] | null) => {
            setEditAttributes((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    return {
        product,
        editFields,
        editAttributes,
        editRef,
        loading,
        error,
        fetchProduct,
        handleFieldChange,
        handleAttributeChange,
    };
}
