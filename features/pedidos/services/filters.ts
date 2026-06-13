// features/pedidos/services/filters.ts
// Funciones puras de transformación de filtros UI → API.
// Usada por usePedidoFilters (el hook orquesta; este módulo solo transforma).

import type { ApiFilters } from "@/app/fetchWithAuth/api-filtros-pedidos/filtros-pedidos";
import { normalizeDateParam } from "@/features/pedidos/components/filtroFecha";

/**
 * Convierte los filtros del store (UI) al formato que espera la API.
 */
export function toApiFilters(filters: Record<string, any>): ApiFilters {
    return {
        id: filters.id || undefined,
        q: filters.q || undefined,
        dateFrom: normalizeDateParam(filters.fechaDesde || filters.dateFrom, false),
        dateTo: normalizeDateParam(filters.fechaHasta || filters.dateTo, true),
        sortBy: filters.sortBy || undefined,
        sortDir: filters.sortDir || undefined,
        orderId: filters.orderId || undefined,
        u_ref1: filters.u_ref1 || undefined,
        folioNum: filters.folioNum || undefined,
        cliente: filters.cliente || undefined,
        orderStatusId: filters.orderStatusId || undefined,
        tipoEntrega: filters.tipoEntrega || undefined,
        direccion: filters.direccion || undefined,
        empresaDelivery: filters.empresaDelivery || undefined,
        almacen: filters.almacen || undefined,
        fechaEntregaDesde: filters.fechaEntregaDesde || undefined,
        fechaEntregaHasta: filters.fechaEntregaHasta || undefined,
        salesChannel: filters.salesChannel || undefined,
    };
}

/**
 * Cuenta cuántos filtros están activos (para el badge del botón de filtros).
 */
export function countActiveFilters(filters: Record<string, any>): number {
    const arr = [
        filters.id,
        filters.u_ref1,
        filters.folioNum,
        filters.orderId,
        filters.cliente,
        filters.q,
        filters.fechaDesde || filters.dateFrom,
        filters.fechaHasta || filters.dateTo,
        filters.sortBy && filters.sortBy !== "orderID" ? filters.sortBy : "",
        filters.sortDir && filters.sortDir !== "DESC" ? filters.sortDir : "",
        filters.orderStatusId,
        filters.tipoEntrega,
        filters.direccion,
        filters.empresaDelivery,
        filters.fechaEntregaDesde,
        filters.fechaEntregaHasta,
        filters.almacen,
        filters.salesChannel,
    ];
    return arr.reduce((acc: number, v: any) => acc + (v ? 1 : 0), 0);
}
