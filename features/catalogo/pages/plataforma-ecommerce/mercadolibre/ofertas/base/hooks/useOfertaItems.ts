// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useOfertaItems.ts
//
// Fetcha los items REALES de una campaña ML y los normaliza a `CampaignSku[]`
// para la tab "Ítems" del detail view.
//
// IMPORTANTE — La campaña que devuelve `useOferta` viene con `skus: []` SIEMPRE
// porque `buildCampaignFromEnrollment` solo guarda el COUNT, no los items.
//
// Paginación (rewrite Mayo 2026):
//   Antes este hook cargaba TODOS los items (active + paused) con `maxPages`
//   hasta 200 páginas → miles de llamadas a ML que reventaban el rate limit.
//   Ahora carga UNA página a la vez (limit=50) de UN SOLO `status_item`
//   server-side, con cursor `search_after` y botón "Cargar más".
//   Los conteos del header los provee otro hook (`usePromotionCounts`).
//
// Lógica por página:
//   1. `listPromotionItems(promoId, type, { status_item, limit: 50, search_after })`
//   2. Mapear `r.results` → `CampaignSku[]` con cross-ref del catalog cache.
//   3. Para items SIN match en cache → lazy fetch `getProductoByItemId`
//      (concurrency 5), guardado por `triedLazyRef`.
//   4. `hasMore` = `!!r.search_after && r.results.length > 0`.
//
// Notas:
//   - Si el catalog cache está vacío (acceso por deep link sin pasar por la
//     list view), TODOS los items van a lazy fetch. Es lento pero correcto.
//   - `reqIdRef` previene state updates si el componente se desmonta o
//     se cambia de campaña/status antes de terminar.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, useOfertasApi } from "../api/ofertas-api";
import {
    addToCatalogCache,
    getCatalogByItemId,
} from "../data/loader";
import type {
    CampaignSku,
    CatalogSku,
    MLPromotionType,
} from "../types/oferta-types";
import type { RawPromotionItem } from "../api/ofertas-api";

/** Map del status crudo de ML → status de UI de OMS (CampaignSku.status). */
function mapItemStatus(s: RawPromotionItem["status"]): CampaignSku["status"] {
    switch (s) {
        case "started":
            return "active";
        case "pending":
            return "pending";
        case "finished":
            return "finished";
        case "sync_requested":
            return "sync_requested";
        case "restore_requested":
            return "restore_requested";
        case "candidate":
        default:
            // candidates ya están filtrados antes de llegar acá — fallback safe.
            return "candidate";
    }
}

/**
 * Build CampaignSku a partir del raw item ML + el catalog match (o null).
 * Replica la columna "rows.map" del legacy CampaignDetailModal.
 */
function buildCampaignSku(
    item: RawPromotionItem,
    catalog: CatalogSku | null,
): CampaignSku {
    const orig = item.original_price ?? catalog?.price ?? 0;
    const newP = item.price ?? 0;
    const discount =
        orig > 0 && newP > 0 ? Math.round(((orig - newP) / orig) * 100) : 0;
    return {
        // `item_id` ML siempre presente y único — la lista usa este campo como
        // React key. El `sku` SAP puede repetirse en catalog listings.
        item_id: item.id,
        // Si no hay match en catalog usamos el item_id ML (MLC...) como fallback
        // — el usuario al menos ve qué item es. Si hay catalog, preferimos el
        // SKU SAP del seller (mejor para humanos).
        sku: catalog?.sku || item.id,
        name: catalog?.name ?? "(producto fuera del catálogo PIM)",
        image: catalog?.image ?? null,
        price: orig,
        new_price: newP,
        discount,
        stock: Number(catalog?.stock ?? 0),
        stock_committed:
            typeof item.stock?.min === "number" ? item.stock.min : null,
        status: mapItemStatus(item.status),
        override: false,
    };
}

/**
 * Resumen de cofinanciación derivado de los items raw.
 *
 * ML setea `meli_percentage` + `seller_percentage` PER ITEM dentro de
 * `/seller-promotions/promotions/:id/items` (campañas SMART, MARKETPLACE_CAMPAIGN,
 * PRICE_MATCHING). Habitualmente uniform en toda la campaña, pero teóricamente
 * puede variar.
 *
 * Si `uniform === false`, el front muestra min..max range en lugar del valor
 * único. Si `count === 0`, no hay items con datos de cofinanciación — quizás
 * el tipo de campaña no la soporta o ML no lo expuso en esta página.
 */
export interface CofinanciacionAggregate {
    /** % promedio que aporta ML. */
    meliPercentage: number;
    /** % promedio que aporta el seller. */
    sellerPercentage: number;
    /** Min/max si varía entre items (para evidenciar la heterogeneidad). */
    meliMin: number;
    meliMax: number;
    sellerMin: number;
    sellerMax: number;
    /** True si TODOS los items tienen exactamente el mismo split. */
    uniform: boolean;
    /** Cantidad de items con datos de cofinanciación (`meli_percentage` definido). */
    count: number;
}

/** Status server-side de los items dentro de la campaña (excluye candidates). */
export type ItemStatusFilter = "active" | "paused";

export interface UseOfertaItemsReturn {
    items: ReadonlyArray<CampaignSku>;
    /** True mientras corre el primer fetch (reset) — usado para skeletons. */
    initialLoading: boolean;
    /** True mientras corre una carga de página adicional ("Cargar más"). */
    loadingMore: boolean;
    error: string | null;
    /** True cuando hay más páginas que traer (cursor `search_after` vigente). */
    hasMore: boolean;
    /** Trae la siguiente página y la concatena a `items`. */
    loadMore: () => Promise<void>;
    /** Reinicia desde la primera página (botón "Refrescar"). */
    reload: () => Promise<void>;
    /**
     * Split de cofinanciación agregado desde los items raw ACUMULADOS. `null`
     * si la campaña todavía no se cargó o no tiene items con cofinanciación.
     */
    cofinanciacion: CofinanciacionAggregate | null;
}

export interface UseOfertaItemsOptions {
    /** ID de la promoción (campaign.official_id ?? campaign.id). */
    promoId: string | null | undefined;
    /** Tipo de la promo — requerido por ML para listPromotionItems. */
    type: MLPromotionType | null | undefined;
    /** Status server-side a listar (excluye candidates en origen). */
    statusItem: ItemStatusFilter;
}

/**
 * Calcula el agregado de cofinanciación a partir de los items raw.
 * Retorna null si ningún item tiene `meli_percentage` definido.
 */
function computeCofinanciacionAggregate(
    rawItems: ReadonlyArray<RawPromotionItem>,
): CofinanciacionAggregate | null {
    const meliVals: number[] = [];
    const sellerVals: number[] = [];
    for (const it of rawItems) {
        if (typeof it.meli_percentage === "number") meliVals.push(it.meli_percentage);
        if (typeof it.seller_percentage === "number") sellerVals.push(it.seller_percentage);
    }
    if (meliVals.length === 0) return null;

    const avg = (xs: number[]) =>
        xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
    const meliMin = Math.min(...meliVals);
    const meliMax = Math.max(...meliVals);
    const sellerMin = sellerVals.length ? Math.min(...sellerVals) : 0;
    const sellerMax = sellerVals.length ? Math.max(...sellerVals) : 0;

    return {
        meliPercentage: Math.round(avg(meliVals)),
        sellerPercentage: Math.round(avg(sellerVals)),
        meliMin,
        meliMax,
        sellerMin,
        sellerMax,
        uniform: meliMin === meliMax && sellerMin === sellerMax,
        count: meliVals.length,
    };
}

/** Tamaño de página fijo — ML acepta hasta 50 por request. */
const PAGE_LIMIT = 50;
/** Concurrencia del lazy lookup contra el pim-service. */
const LAZY_CONCURRENCY = 5;

export function useOfertaItems({
    promoId,
    type,
    statusItem,
}: UseOfertaItemsOptions): UseOfertaItemsReturn {
    const api = useOfertasApi();
    const [items, setItems] = useState<ReadonlyArray<CampaignSku>>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [cofinanciacion, setCofinanciacion] = useState<CofinanciacionAggregate | null>(null);

    /** Race condition guard: cada request bumpea el counter; solo el último applies. */
    const reqIdRef = useRef(0);

    /**
     * Set deduplicado de item_ids que ya intentamos lazy lookup
     * (incluso si terminaron en 404 / error de red). Evita re-pegar al backend.
     * Se reinicia cuando cambia la campaña / status.
     */
    const triedLazyRef = useRef<Set<string>>(new Set());

    /** Cursor `search_after` de la última página — leído dentro del callback. */
    const cursorRef = useRef<string | undefined>(undefined);

    /**
     * Items raw acumulados (todas las páginas cargadas). La cofinanciación se
     * computa sobre estos porque `meli_percentage`/`seller_percentage` viven en
     * el item RAW, no en el `CampaignSku` normalizado.
     */
    const rawAccumRef = useRef<RawPromotionItem[]>([]);

    /**
     * Carga una página. `reset=true` empieza desde el principio (refresh /
     * cambio de campaña). `reset=false` concatena la siguiente página usando
     * el cursor vigente ("Cargar más").
     */
    const loadPage = useCallback(
        async (reset: boolean): Promise<void> => {
            if (!promoId || !type) {
                setItems([]);
                rawAccumRef.current = [];
                cursorRef.current = undefined;
                setHasMore(false);
                setCofinanciacion(null);
                setInitialLoading(false);
                setLoadingMore(false);
                return;
            }

            const reqId = ++reqIdRef.current;
            if (reset) setInitialLoading(true);
            else setLoadingMore(true);
            setError(null);

            try {
                const r = await api.listPromotionItems(promoId, type, {
                    status_item: statusItem,
                    limit: PAGE_LIMIT,
                    search_after: reset ? undefined : cursorRef.current,
                });
                if (reqIdRef.current !== reqId) return;

                const pageRaw = r.results as ReadonlyArray<RawPromotionItem>;

                // Acumulamos raw (para cofinanciación) y actualizamos el cursor.
                const accum = reset
                    ? [...pageRaw]
                    : [...rawAccumRef.current, ...pageRaw];
                rawAccumRef.current = accum;
                cursorRef.current = r.search_after;
                setHasMore(!!r.search_after && pageRaw.length > 0);

                // Build de esta página con catalog cache (sin lazy fetch aún).
                const pageRows: CampaignSku[] = pageRaw.map((it) =>
                    buildCampaignSku(it, getCatalogByItemId(it.id)),
                );
                setItems((prev) => (reset ? pageRows : [...prev, ...pageRows]));

                // Cofinanciación sobre TODO lo acumulado.
                setCofinanciacion(computeCofinanciacionAggregate(accum));

                if (reset) setInitialLoading(false);
                else setLoadingMore(false);

                // Lazy fetch SOLO de los item_ids de esta página sin match en cache.
                const missing = pageRaw
                    .map((it) => it.id)
                    .filter(
                        (id) =>
                            !getCatalogByItemId(id) &&
                            !triedLazyRef.current.has(id),
                    );

                if (missing.length > 0) {
                    for (let i = 0; i < missing.length; i += LAZY_CONCURRENCY) {
                        if (reqIdRef.current !== reqId) return;
                        const batch = missing.slice(i, i + LAZY_CONCURRENCY);
                        const results = await Promise.allSettled(
                            batch.map((id) => api.getProductoByItemId(id)),
                        );
                        if (reqIdRef.current !== reqId) return;

                        let hadHit = false;
                        results.forEach((res, idx) => {
                            const id = batch[idx];
                            triedLazyRef.current.add(id);
                            if (res.status === "fulfilled" && res.value) {
                                addToCatalogCache(res.value);
                                hadHit = true;
                            }
                        });

                        if (hadHit) {
                            // Re-build TODAS las rows acumuladas — el cache ya
                            // tiene los nuevos matches; usamos rawAccumRef como
                            // fuente de verdad para mantener el orden.
                            setItems(() =>
                                rawAccumRef.current.map((it) =>
                                    buildCampaignSku(
                                        it,
                                        getCatalogByItemId(it.id),
                                    ),
                                ),
                            );
                        }
                    }
                }
            } catch (e) {
                if (reqIdRef.current !== reqId) return;
                const err = e as ApiError;
                setError(err?.message ?? "Error cargando items de la campaña");
                setInitialLoading(false);
                setLoadingMore(false);
            }
        },
        [api, promoId, type, statusItem],
    );

    useEffect(() => {
        // Reset total al cambiar campaña / tipo / status server-side.
        triedLazyRef.current = new Set();
        cursorRef.current = undefined;
        rawAccumRef.current = [];
        setItems([]);
        setCofinanciacion(null);
        setHasMore(false);
        setInitialLoading(true);
        void loadPage(true);
    }, [loadPage]);

    const reload = useCallback(() => loadPage(true), [loadPage]);
    const loadMore = useCallback(() => loadPage(false), [loadPage]);

    return {
        items,
        initialLoading,
        loadingMore,
        error,
        hasMore,
        loadMore,
        reload,
        cofinanciacion,
    };
}
