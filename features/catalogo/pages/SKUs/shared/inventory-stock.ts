// features/catalogo/pages/SKUs/shared/inventory-stock.ts
// Helper READ-only de stock por bodega (inventory list endpoint).
//
// GET ${BASE_WAREHOUSES}/stock?filters[sku]=:sku
// Endpoint abierto (sin headers de auth, CORS *). La respuesta es un array
// JSON plano: un objeto por bodega.

import { BASE_WAREHOUSES } from "@/lib/http/endpoints";

export interface WarehouseStockRow {
  id: string;
  sku: string;
  warehouse: string;
  warehouseName?: string | null;
  warehouseReferenceId?: string | null;
  stock: number;
  availableStock: number;
  reservedStock: number;
  inTransit: number;
  reservedPhysicalStock: number;
  inOrder: number;
  infiniteStock: boolean;
  securityStock: number;
  measurementUnit: string; // "un" | "kg" | "gr"
  status: string; // "active" | ...
  dateModified: string | null;
  userModified: string | null; // ID, no nombre; suele venir null
}

export async function fetchInventoryStock(
  sku: string,
): Promise<WarehouseStockRow[]> {
  const url = `${BASE_WAREHOUSES}/stock?filters[sku]=${encodeURIComponent(sku)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as WarehouseStockRow[]) : [];
}
