// app\fetchWithAuth\api-grupo-clientes\grupo-clientes.tsx
// Centraliza las llamadas al endpoint de Grupos de Clientes (SIN token, SIN x-plataforma-id)
// Base apuntando al mismo microservicio de clientes
import { URL_BASE } from "@/lib/http/endpoints";

/* =============================================================================
 * Tipos (ajustados a las respuestas/requests que compartiste)
 * ========================================================================== */

// Respuesta que entrega el backend (GET, PATCH, etc.)
export type CustomerGroupDTO = {
    GroupCode: number;
    PartnerType: string; // "C"
    GroupName: string;
    IsActive: boolean;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
};

// Payload para crear grupos de clientes (POST)
// OJO: el backend exige que los campos del body NO comiencen con mayúscula
// (groupCode, groupName, partnerType, isActive)
export type CustomerGroupCreatePayload = {
    groupCode: number;
    groupName: string;
    partnerType: string;  // "C"
    isActive: boolean;
};

// Payload para actualizar (PATCH) desde el front
// Usamos camelCase y luego lo mapeamos a los nombres que espera el backend.
export type CustomerGroupUpdatePayload = {
    groupCode: number;
    partnerType: string;
    groupName: string;
    isActive: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
};

// Respuesta del DELETE
export type CustomerGroupDeleteResult = {
    ok: boolean;
    hardDeleted: boolean;
    softDeactivated: boolean;
};

/* =============================================================================
 * Helper: fetch wrapper (mismo patrón que customers.tsx)
 * ========================================================================== */

async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);

    // lee el cuerpo siempre (éxito o error)
    const raw = await res.text().catch(() => "");
    let payload: any = null;
    try {
        payload = raw ? JSON.parse(raw) : null;
    } catch {
        payload = raw || null;
    }

    if (!res.ok) {
        // error con metadatos 
        const err: any = new Error(
            (payload && (payload.message || payload.details)) || `HTTP ${res.status} ${res.statusText}`
        );
        err.status = res.status;
        err.code = payload?.error || payload?.code;
        err.details = payload?.details;
        err.data = payload;
        throw err;
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    return payload as T;
}

/* =============================================================================
 * Endpoints Grupos de Clientes
 * ========================================================================== */

// GET http://192.168.0.168:5008/masterdata/customer-groups
// Nota: el backend puede devolver array plano o { items, total }.
// Aquí lo normalizamos a { items, total }.
export async function customerGroupsAll(): Promise<{ items: CustomerGroupDTO[]; total: number }> {
    const url = `${URL_BASE}/masterdata/customer-groups`;
    const res = await fetchJson<any>(url, { method: "GET" });

    const items: CustomerGroupDTO[] = Array.isArray(res) ? res : (res?.items ?? []);
    const total: number = Array.isArray(res) ? items.length : (res?.total ?? items.length);

    return { items, total };
}

/* =============================================================================
 * Crear Grupo(s) de Clientes
 * ========================================================================== */

// POST 
// http://192.168.0.168:5008/masterdata/customer-groups?onConflict=error|ignore|replace
// Body: [ { groupCode, groupName, partnerType, isActive } ]
// Respuesta:
// { "created": [1234], "updated": [], "skipped": [] }

export type CustomerGroupBulkResult = {
    created: number[];
    updated: number[];
    skipped: number[];
};

// Versión bulk (envía un array de grupos)
export async function customerGroupsCreate(
    groups: CustomerGroupCreatePayload[],
    options?: { onConflict?: "error" | "ignore" | "replace" }
): Promise<CustomerGroupBulkResult> {
    const { onConflict = "error" } = options || {};
    const url = new URL(`${URL_BASE}/masterdata/customer-groups`);
    url.searchParams.set("onConflict", onConflict);

    return fetchJson<CustomerGroupBulkResult>(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groups),
    });
}

// Versión helper para crear UN solo grupo
export async function customerGroupCreate(
    group: CustomerGroupCreatePayload,
    options?: { onConflict?: "error" | "ignore" | "replace" }
): Promise<CustomerGroupBulkResult> {
    return customerGroupsCreate([group], options);
}

/* =============================================================================
 * Actualizar Grupo de Clientes
 * ========================================================================== */

// PATCH http://192.168.0.168:5008/masterdata/customer-groups/103
// Body ejemplo:
// {
//   "groupCode": 103,
//   "partnerType": "C",
//   "groupName": "Cliente Agricolaa",
//   "IsActive": true,
//   "CreatedAt": "2025-09-10T20:09:15.258Z",
//   "UpdatedAt": "2025-09-10T20:09:21.637Z"
// }
//
// Respuesta:
// {
//   "GroupCode": 103,
//   "PartnerType": "C",
//   "GroupName": "Cliente Agricolaa",
//   "IsActive": true,
//   "CreatedAt": "...",
//   "UpdatedAt": "2025-11-17T20:07:02.266Z"
// }

export async function customerGroupUpdate(
    groupCode: number,
    payload: CustomerGroupUpdatePayload
): Promise<CustomerGroupDTO> {
    const url = `${URL_BASE}/masterdata/customer-groups/${encodeURIComponent(groupCode)}`;

    // Mapeamos camelCase del front a lo que espera el backend
    const body: any = {
        groupCode: payload.groupCode,
        partnerType: payload.partnerType,
        groupName: payload.groupName,
        IsActive: payload.isActive,
    };

    if (payload.createdAt !== undefined) body.CreatedAt = payload.createdAt;
    if (payload.updatedAt !== undefined) body.UpdatedAt = payload.updatedAt;

    return fetchJson<CustomerGroupDTO>(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

/* =============================================================================
 * Eliminar / Desactivar Grupo de Clientes
 * ========================================================================== */

// DELETE http://192.168.0.168:5008/masterdata/customer-groups/1234
// Respuesta:
// {
//   "ok": true,
//   "hardDeleted": false,
//   "softDeactivated": true
// }

export async function customerGroupDelete(groupCode: number): Promise<CustomerGroupDeleteResult> {
    const url = `${URL_BASE}/masterdata/customer-groups/${encodeURIComponent(groupCode)}`;
    return fetchJson<CustomerGroupDeleteResult>(url, {
        method: "DELETE",
    });
}



export async function customerGroupGet(groupCode: number): Promise<CustomerGroupDTO> {
    const url = `${URL_BASE}/masterdata/customer-groups/${encodeURIComponent(groupCode)}`;

    // El backend devuelve un ARRAY con un solo elemento
    const list = await fetchJson<CustomerGroupDTO[]>(url, { method: "GET" });

    if (!Array.isArray(list) || list.length === 0) {
        throw new Error(`No se encontró el grupo de clientes con código ${groupCode}`);
    }

    return list[0];
}