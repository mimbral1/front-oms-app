// features/picking/types/ola-pedidos.ts
// Domain types for the wave-orders (ola-pedidos) view.

/** Single item row shown in the order detail table */
export interface OrderDetailItem {
    id: string;
    key: string;
    producto: string;
    itemcode: string;
    eans: string;
    shippingTypeCode: string;
    cantidad: number;
    imagen: string;
    sessionItemId: string | null;
    itemAssignmentStatus: string;
}

/** Aggregated order row displayed in the accordion list */
export interface OrderRow {
    id: string;
    omsOrderId: string;
    commerceId: string;
    shipmentCode: string;
    totalItems: number;
    totalQty: number;
    detailItems: OrderDetailItem[];
}
