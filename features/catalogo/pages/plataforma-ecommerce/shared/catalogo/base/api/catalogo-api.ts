// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/api/catalogo-api.ts
//
// Cliente HTTP del listado de catálogo. Mismo endpoint que `productos/`
// (`GET /api/pim/productos`), pero envuelto en `useFetchWithAuthPim` en vez
// del legacy hardcoded `http://192.168.0.42:5050/api/pim/productos` que
// usa `MarketplaceProductosBrowse`.

"use client";

import { useCallback, useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import type {
    CatalogoListFilters,
    MarketplaceProductsAPIResponse,
} from "../types/catalogo-types";

/**
 * Mapea el `exportPrefix` de `EcommercePlatformConfig` al valor que espera
 * `query.marketplace` en el backend.
 */
export function mapPlatformToMarketplace(
    exportPrefix: string,
): "ml" | "falabella" | "vtex" {
    switch (exportPrefix) {
        case "mercadolibre":
            return "ml";
        case "falabella":
            return "falabella";
        case "vtex":
            return "vtex";
        default:
            return "ml";
    }
}

/**
 * Mapea el filter UI a `status` del backend ML/Falabella.
 *
 * Estados ML canónicos (verificados contra ML API 2026-05):
 *   active, paused, closed, under_review, payment_required, not_yet_active.
 *
 * `draft` y `error` no son estados ML reales pero se preservan por compat con
 * el front anterior — si el seller los selecciona el backend devuelve vacío.
 */
function mapStatusFilter(status?: CatalogoListFilters["status"]): string | undefined {
    switch (status) {
        case "activos":
            return "active";
        case "pausados":
            return "paused";
        case "cerrados":
            return "closed";
        case "en-revision":
            return "under_review";
        case "sin-publicar":
            return "draft";
        case "con-errores":
            return "error";
        case "todos":
        default:
            return undefined;
    }
}

interface ListParams extends CatalogoListFilters {
    marketplace: "ml" | "falabella" | "vtex";
}

function buildQuery(params: ListParams): string {
    const p = new URLSearchParams();
    p.set("marketplace", params.marketplace);
    if (params.page) p.set("page", String(params.page));
    if (params.pageSize) p.set("pageSize", String(params.pageSize));
    const mappedStatus = mapStatusFilter(params.status);
    if (mappedStatus) p.set("status", mappedStatus);
    // Search server-side (Mayo 2026): el backend filtra en ml_skus por
    // sku/ml_item_id/titulo cuando llega este param. Latencia <500ms vs
    // ~20s del modo client-side anterior. Cuando hay search, el backend
    // devuelve hasta 200 matches en una sola respuesta (sin paginación).
    if (params.search && params.search.trim()) {
        p.set("search", params.search.trim());
    }
    return p.toString() ? `?${p.toString()}` : "";
}

export interface UseCatalogoApi {
    list: (filters: ListParams) => Promise<MarketplaceProductsAPIResponse>;
}

export function useCatalogoApi(): UseCatalogoApi {
    const { fetchWithAuthPim } = useFetchWithAuthPim();

    const list = useCallback(
        (filters: ListParams) =>
            fetchWithAuthPim<MarketplaceProductsAPIResponse>(
                `/api/pim/productos${buildQuery(filters)}`,
            ),
        [fetchWithAuthPim],
    );

    return useMemo(() => ({ list }), [list]);
}
