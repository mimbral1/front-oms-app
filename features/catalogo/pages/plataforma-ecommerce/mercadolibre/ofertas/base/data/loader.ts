// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/data/loader.ts
//
// PORT VERBATIM (adaptado a OMS) del legacy `pim-service/Plataforma_Marketplace/
// src/features/ofertas/data/loader.ts`.
//
// Cache module-level del catálogo SKU. Se popula al primer mount de la view
// vía `primeCatalogCache(loadCatalog())`. MLEnrollModal y CampaignDetailModal
// consumen vía `getCachedCatalog()`/`getCatalogByItemId()`/`getCatalogBySku()`
// sin prop drilling.
//
// Cambio vs legacy: como el OMS está per-feature/per-page, NO importamos
// `MOCK_SKUS` por default — empezamos con un cache vacío y se llena cuando la
// view dispara `loadCatalog()` con el `useOfertasApi`. Si en el futuro hace
// falta el fallback de mocks, agregamos un módulo `mocks/` aparte.

import type { CatalogSku } from "../types/oferta-types";

let _catalogCache: ReadonlyArray<CatalogSku> = [];
let _bySku = new Map<string, CatalogSku>();
let _byItemId = new Map<string, CatalogSku>();

export function getCachedCatalog(): ReadonlyArray<CatalogSku> {
    return _catalogCache;
}

export function getCatalogByItemId(itemId: string): CatalogSku | null {
    return _byItemId.get(itemId) ?? null;
}

export function getCatalogBySku(sku: string): CatalogSku | null {
    return _bySku.get(sku) ?? null;
}

export function primeCatalogCache(items: ReadonlyArray<CatalogSku>): void {
    _catalogCache = items;
    _bySku = new Map();
    _byItemId = new Map();
    for (const it of items) {
        if (it.sku) _bySku.set(it.sku, it);
        if (it.item_id) _byItemId.set(it.item_id, it);
    }
}

/**
 * Hidrata el cache con un solo item luego de un lazy lookup en el modal de
 * detalle. Idempotente — si el item_id ya estaba indexado, lo pisa.
 *
 * Uso típico: CampaignDetailModal detecta items sin match en cache y dispara
 * `getProductoByItemId(MLC...)` puntuales; al resolver, llaman a esto para
 * que la próxima vez no haya que volver a fetchear.
 */
export function addToCatalogCache(it: CatalogSku): void {
    if (it.sku) _bySku.set(it.sku, it);
    if (it.item_id) _byItemId.set(it.item_id, it);
    // No re-pusheamos a `_catalogCache` (ese es el snapshot de la priming
    // call; agregar items lazy ahí desordenaría el orden de paginación).
}

/** Helper flag para localStorage (SSR safe). */
function readFlag(key: string): boolean {
    try {
        if (typeof localStorage === "undefined") return false;
        return localStorage.getItem(key) === "1";
    } catch {
        return false;
    }
}

/** Bandera "forzar mocks" — si tuvieras mocks habilitados. Default false. */
export function shouldUseMocks(): boolean {
    return readFlag("ofertas.useMocks");
}

/** Bandera "strict API" — propagar errores en vez de fallback. */
export function shouldUseStrictApi(): boolean {
    return readFlag("ofertas.strictApi");
}
