// features/picking/types/api.ts
// Raw API response types for the picking service.

/** Single item inside a wave order (raw API shape) */
export interface ApiWaveOrderItem {
    id: string;
    skuId?: string;
    ean?: string;
    requestedQty: number;
    productName?: string;
    imageUrl?: string;
    shippingTypeCode?: string;
    sessionItemId?: string | null;
    itemAssignmentStatus?: string;
}

/** Single order inside the wave-orders response */
export interface ApiOrder {
    id: string;
    omsOrderId: string;
    commerceId: string;
    shipmentCode: string;
    shippingTypeCode?: string;
    items: ApiWaveOrderItem[];
}

/** Full response from GET /picking-service/waves/:id */
export interface ApiWaveOrdersResponse {
    main?: {
        waveDetail?: {
            status?: string;
            isBlocked?: boolean;
            pickingPointId?: string;
            pickingPointName?: string;
            pickingPoint?: {
                id?: string;
                name?: string;
            };
        };
    };
    orders: ApiOrder[];
}

/** Picker matching a picking-point + shipping-type config */
export interface PickerByConfigItem {
    pickerId: string;
    userId: number;
    userName: string;
    userEmail: string;
}

/** Response from GET /picking-service/pickers/by-config */
export interface PickersByConfigResponse {
    ok: boolean;
    pickingPointId: string;
    shippingTypeCodes: string[];
    validateSession: boolean;
    total: number;
    items: PickerByConfigItem[];
}
