// features/picking/services/pickers.ts
// Servicio de pickers: centraliza llamadas al picking-service/pickers endpoint.

import { PICKING_SERVICE_PATH } from "@/lib/http/endpoints";

export interface PickersParams {
    page: number;
    pageSize: number;
    status?: string;
    pickingPointId?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
}

type FetchFn = <T = any>(url: string, options?: RequestInit) => Promise<T>;

export async function fetchPickers(
    fetchWithAuth: FetchFn,
    params: PickersParams,
) {
    const qs = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize),
        status: params.status ?? "",
        pickingPointId: params.pickingPointId ?? "",
        firstname: params.firstname ?? "",
        lastname: params.lastname ?? "",
        email: params.email ?? "",
    });

    return fetchWithAuth<any>(
        `${PICKING_SERVICE_PATH}/pickers?${qs.toString()}`,
        { method: "GET" },
    );
}

export async function fetchPickerDetail(
    fetchWithAuth: FetchFn,
    id: string | number,
) {
    return fetchWithAuth<any>(
        `${PICKING_SERVICE_PATH}/pickers/${id}`,
        { method: "GET" },
    );
}

export async function createPicker(
    fetchWithAuth: FetchFn,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>(`${PICKING_SERVICE_PATH}/pickers`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function fetchShippingTypes(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        `${PICKING_SERVICE_PATH}/shipping-types?active=true`,
        { method: "GET" },
    );
}

export async function fetchPickingPointsSimple(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        `${PICKING_SERVICE_PATH}/points/picking-points/simple`,
        { method: "GET" },
    );
}

export async function fetchLocationsSimple(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        "comerce-service/locations/simple",
        { method: "GET" },
    );
}
