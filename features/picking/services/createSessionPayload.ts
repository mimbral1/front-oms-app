// features/picking/services/createSessionPayload.ts
// Builds the payload for POST /picking-service/sessions/round/:waveId

import type { OrderRow } from "../types/ola-pedidos";

interface SelectedItem {
    orderId: string;
    orderItemId: string;
}

interface SessionPayload {
    pickerId: string;
    orderIds?: string[];
    orderItemIds?: string[];
}

/**
 * Builds the session-creation payload.
 * - Sends `orderIds` only when the entire order is pending and selected.
 * - When only some items are selected, sends `orderItemIds`.
 * - If an order contains already-assigned/non-pending items, it always goes by itemIds.
 * - Never mixes both: if any order is partial, everything goes as itemIds.
 */
export function buildCreateSessionPayload(
    pickerId: string,
    orders: OrderRow[],
    selectedItems: SelectedItem[]
): SessionPayload | null {
    if (selectedItems.length === 0) return null;

    // Group selected item IDs by order
    const selectedByOrder = new Map<string, Set<string>>();
    for (const item of selectedItems) {
        if (!selectedByOrder.has(item.orderId)) {
            selectedByOrder.set(item.orderId, new Set());
        }
        selectedByOrder.get(item.orderId)!.add(item.orderItemId);
    }

    const fullySelectedOrderIds: string[] = [];
    const partialItemIds: string[] = [];

    for (const order of orders) {
        const selectedSet = selectedByOrder.get(order.id);
        if (!selectedSet || selectedSet.size === 0) continue;

        const orderItemIds = order.detailItems.map((d) => d.id);
        const pendingItemIds = order.detailItems
            .filter((d) => d.itemAssignmentStatus?.toLowerCase() === "pending")
            .map((d) => d.id);

        const hasOnlyPendingItems =
            orderItemIds.length > 0 &&
            order.detailItems.every(
                (d) => d.itemAssignmentStatus?.toLowerCase() === "pending"
            );

        const allOrderItemsSelected =
            pendingItemIds.length > 0 &&
            pendingItemIds.every((id) => selectedSet.has(id));

        if (hasOnlyPendingItems && allOrderItemsSelected) {
            fullySelectedOrderIds.push(order.id);
        } else {
            partialItemIds.push(...Array.from(selectedSet));
        }
    }

    // If any order is partial, send everything as orderItemIds
    if (partialItemIds.length > 0) {
        const allItemIds = Array.from(
            new Set(selectedItems.map((item) => item.orderItemId))
        );
        return { pickerId, orderItemIds: allItemIds };
    }

    if (fullySelectedOrderIds.length > 0) {
        return { pickerId, orderIds: fullySelectedOrderIds };
    }

    return null;
}
