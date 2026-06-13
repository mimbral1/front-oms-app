// api/inventory/inventory.tsx
// Centraliza todas las llamadas del microservicio de Inventario (SIN token, SIN x-plataforma-id)
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { fetchJson } from "@/lib/http/client";
import { BASE_INVENTORY, WAREHOUSE_STOCK_API } from "@/lib/http/endpoints";

const JANIS_STOCK_URL = WAREHOUSE_STOCK_API;

export interface StockByWarehouseReal {
    itemSku: string;
    warehouseCode: string;
    onHandQty: number;
    salesCommitQty: number;
    safetyStock?: number | null;
    purchaseOrdQty?: number | null;
    infiniteStock?: boolean | null;
    updatedAt?: string | null;
    blocked?: boolean | null;
    availableEffective?: number | null;
}

export interface CreateStockPayload {
    sku: string;
    warehouse: string;
    stock: number;
    infiniteStock: boolean;
    usuarioCreadorId?: number;
}

export interface JanisStockListItem {
    id: string;
    sku: string;
    warehouse: string;
    warehouseName: string;
    warehouseReferenceId: string;
    stock: number;
    availableStock: number;
    reservedStock: number;
    reservedPhysicalStock?: number;
    inTransit: number;
    infiniteStock: boolean;
    securityStock: number;
    status: string;
    dateModified: string;
    userModified?: string | null;
}

export async function inventoryListStocksPage(params?: {
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
}): Promise<JanisStockListItem[]> {
    const page = Math.max(1, params?.page ?? 1);
    const pageSize = Math.max(1, params?.pageSize ?? 10);

    const batch = await fetchJson<JanisStockListItem[]>(JANIS_STOCK_URL, {
        method: "GET",
        headers: withAuthPlatformHeaders({
            "x-janis-page": String(page),
            "x-janis-page-size": String(pageSize),
        }),
        cache: "no-store",
        signal: params?.signal,
    });

    return Array.isArray(batch) ? batch : [];
}


/* =============================================================================
 * Endpoints Inventario
 * ========================================================================== */

// GET /api/stock/by-warehouse?sku=...
export async function inventoryStockByWarehouse(params: { sku: string }) {
    const { sku } = params;
    const url = `${BASE_INVENTORY}/api/stock/by-warehouse?sku=${encodeURIComponent(sku)}`;
    return fetchJson<StockByWarehouseReal[]>(url, { method: "GET" });
}

// GET /api/stock/by-warehouse?sku=...&warehouseCode=...
export async function inventoryStockByWarehouseWithCode(params: { sku: string; warehouseCode: string }) {
    const { sku, warehouseCode } = params;
    const url = `${BASE_INVENTORY}/api/stock/by-warehouse?sku=${encodeURIComponent(sku)}&warehouseCode=${encodeURIComponent(warehouseCode)}`;
    return fetchJson<StockByWarehouseReal[]>(url, { method: "GET" });
}

// GET /api/stock (all pages via Janis pagination headers)
export async function inventoryListAllStocks(params?: { pageSize?: number; signal?: AbortSignal }): Promise<JanisStockListItem[]> {
    const pageSize = Math.max(1, params?.pageSize ?? 200);
    const allItems: JanisStockListItem[] = [];

    for (let page = 1; page < 1000; page += 1) {
        if (params?.signal?.aborted) break;

        const items = await inventoryListStocksPage({ page, pageSize, signal: params?.signal });
        allItems.push(...items);

        if (items.length < pageSize) break;
    }

    return allItems;
}

// POST /api/stock
export async function inventoryCreateStock(payload: CreateStockPayload) {
    const response = await fetch(JANIS_STOCK_URL, {
        method: "POST",
        headers: withAuthPlatformHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(errorBody || `HTTP ${response.status}`);
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}
