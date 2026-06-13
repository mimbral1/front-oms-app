// features/picking/services/schemas.ts
// Servicio de esquemas de picking: CRUD + comments + logs.

export interface SchemasParams {
    id?: string;
    name?: string;
    createdBy?: string;
    status?: string;
}

type FetchFn = <T = any>(url: string, options?: RequestInit) => Promise<T>;

export async function fetchSchemas(
    fetchWithAuth: FetchFn,
    params?: SchemasParams,
) {
    const qs = new URLSearchParams();
    if (params?.id) qs.set("id", params.id);
    if (params?.name) qs.set("name", params.name);
    if (params?.createdBy) qs.set("createdBy", params.createdBy);
    if (params?.status) qs.set("status", params.status);

    const query = qs.toString();
    return fetchWithAuth<any>(
        `picking-service/picking-schemas${query ? `?${query}` : ""}`,
        { method: "GET" },
    );
}

export async function fetchSchemasDetailed(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        "picking-service/picking-schemas/detailed",
        { method: "GET" },
    );
}

export async function fetchSchemaDetail(
    fetchWithAuth: FetchFn,
    id: string | number,
) {
    return fetchWithAuth<any>(
        `picking-service/picking-schemas/${id}`,
        { method: "GET" },
    );
}

export async function createSchema(
    fetchWithAuth: FetchFn,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>("picking-service/picking-schemas", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function updateSchema(
    fetchWithAuth: FetchFn,
    id: string | number,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>(`picking-service/picking-schemas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function fetchSchemasSimple(fetchWithAuth: FetchFn) {
    return fetchWithAuth<any>(
        "picking-service/picking-schemas/simple",
        { method: "GET" },
    );
}

export async function fetchSchemaAudit(
    fetchWithAuth: FetchFn,
    id: string | number,
    page = 1,
    pageSize = 10,
) {
    return fetchWithAuth<any>(
        `picking-service/picking-schemas/${id}/audit?page=${page}&pageSize=${pageSize}`,
        { method: "GET" },
    );
}

export async function fetchSchemaComments(
    fetchWithAuth: FetchFn,
    id: string | number,
    page = 1,
    pageSize = 10,
) {
    return fetchWithAuth<any>(
        `picking-service/picking-schemas/${id}/comments?page=${page}&pageSize=${pageSize}`,
        { method: "GET" },
    );
}

export async function createSchemaComment(
    fetchWithAuth: FetchFn,
    id: string | number,
    body: Record<string, unknown>,
) {
    return fetchWithAuth<any>(`picking-service/picking-schemas/${id}/comments`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}
