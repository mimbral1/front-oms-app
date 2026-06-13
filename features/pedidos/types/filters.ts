// features/pedidos/types/filters.ts
// Filter-related types for the Pedidos feature UI.

export type { PedidoFilters } from "./lista-pedidos";

/**
 * Shape of the inline-filter bar state (date range, status, search, etc.).
 * Extend as needed when new UI filters are added.
 */
export interface PedidoInlineFilters {
    search?: string;
    status?: string;
    salesChannel?: string;
    dateFrom?: string;
    dateTo?: string;
    pickingPoint?: string;
}
