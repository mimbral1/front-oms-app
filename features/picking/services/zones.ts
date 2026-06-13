// features/picking/services/zones.ts
// Servicio de zonas (sectores): CRUD + comments + creators.

export interface ZonesParams {
    id?: string;
    createdBy?: string;
    name?: string;
    schemaId?: string;
}

type FetchFn = <T = any>(url: string, options?: RequestInit) => Promise<T>;

export async function fetchZones(
    fetchWithAuth: FetchFn,
    params?: ZonesParams,
) {
    const qs = new URLSearchParams();
    if (params?.id) qs.set("id", params.id);
    if (params?.createdBy) qs.set("createdBy", params.createdBy);
    if (params?.name) qs.set("name", params.name);
    if (params?.schemaId) qs.set("schemaId", params.schemaId);

    const query = qs.toString();
    return fetchWithAuth<any>(
        `picking-service/zones${query ? `?${query}` : ""}`,
        { method: "GET" },
    );
}

export async function fetchZoneDetail(
    fetchWithAuth: FetchFn,
    id: string | number,
) {
    return fetchWithAuth<any>(
        `picking-service/zones/${id}`,
        { method: "GET" },
    );
}

export async function createZone(
    fetchWithAuth: FetchFn,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>("picking-service/zones", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function updateZone(
    fetchWithAuth: FetchFn,
    id: string | number,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>(`picking-service/zones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function fetchZoneCreators(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        "picking-service/zones/creators",
        { method: "GET" },
    );
}

export async function fetchZonesSimple(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        "picking-service/zones/simple",
        { method: "GET" },
    );
}

export async function fetchZoneComments(
    fetchWithAuth: FetchFn,
    zoneId: string | number,
    page = 1,
    pageSize = 10,
) {
    return fetchWithAuth<any>(
        `picking-service/zones/${zoneId}/comments?page=${page}&pageSize=${pageSize}`,
        { method: "GET" },
    );
}

export async function createZoneComment(
    fetchWithAuth: FetchFn,
    zoneId: string | number,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>(`picking-service/zones/${zoneId}/comments`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}
