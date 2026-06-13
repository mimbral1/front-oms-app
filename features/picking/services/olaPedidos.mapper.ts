// features/picking/services/olaPedidos.mapper.ts
// Maps raw API wave-order responses to the UI domain model.

import type { ApiOrder, ApiWaveOrdersResponse } from "../types/api";
import type { OrderRow } from "../types/ola-pedidos";

/**
 * Transforms the raw API orders array into the view-model list used by the
 * ola-pedidos accordion table.
 */
export function mapWaveOrdersToRows(
    response: ApiWaveOrdersResponse
): OrderRow[] {
    return (response.orders ?? []).map((order: ApiOrder) => ({
        id: order.id,
        omsOrderId: order.omsOrderId,
        commerceId: order.commerceId,
        shipmentCode: order.shipmentCode,
        totalItems: order.items.length,
        totalQty: order.items.reduce(
            (sum, item) => sum + (item.requestedQty ?? 0),
            0
        ),
        detailItems: (order.items ?? []).map((item, index) => ({
            id: item.id,
            key: `${order.id}-${item.id ?? item.skuId ?? "item"}-${index}`,
            producto: item.productName ?? "-",
            itemcode: item.skuId ?? "-",
            eans: item.ean ?? "-",
            shippingTypeCode:
                order.shippingTypeCode ?? item.shippingTypeCode ?? "-",
            cantidad: item.requestedQty ?? 0,
            imagen: item.imageUrl ?? "",
            sessionItemId: item.sessionItemId ?? null,
            itemAssignmentStatus: item.itemAssignmentStatus ?? "",
        })),
    }));
}

/** Resolve the picking-point ID from potentially nested API shape */
export function resolvePickingPointId(
    response: ApiWaveOrdersResponse
): string {
    const detail = response?.main?.waveDetail;
    return detail?.pickingPointId ?? detail?.pickingPoint?.id ?? "";
}
