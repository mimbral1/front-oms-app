// ─── Almacenes Feature – Public API ────────────────────────────────────────

// Hooks
export { useFetchWarehouse } from "./hooks/useFetchAlmacenes";

// Stores
export { useWarehouseStore } from "./stores/lista-almacenes";

// Types
export type { Warehouse, WarehouseStatus, WarehouseFilters, WarehouseStore } from "./types/almacenes";
export { WAREHOUSES } from "./types/almacenes";
