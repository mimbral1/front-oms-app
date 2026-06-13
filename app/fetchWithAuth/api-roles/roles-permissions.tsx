// api/idservice/roles-permissions.tsx
// Centraliza todas las llamadas a la API de Roles y Permisos
// (mismo estilo que api/customers/customers.tsx)

import { BASE_ID_SERVICE } from "@/lib/http/endpoints";

/* =============================================================================
 * Tipos base según documentación
 * ========================================================================== */

export type RolePermissionDTO = {
    subModuloId: number;
    accionesId: number[]; // ids de acciones (READ, CREATE, UPDATE, DELETE, etc.)
};

/** GET /role/:id/permisos */
export type RolePermissionsResponse = {
    rolId: number;
    permisos: RolePermissionDTO[];
};

/** GET /users/:id/permissions */
export type UserPermissionsResponse = {
    usuarioId: number;
    permisos: RolePermissionDTO[];
};

/** GET /permissions?usuarioId=&plataformaId= */
export type UserPlatformPermissionsResponse = {
    usuarioId: number;
    plataformaId: number;
    permisos: RolePermissionDTO[];
};

/** Listado de roles: GET /all-roles */
export type RoleSummaryDTO = {
    id: number;
    nombre: string;
    descripcion?: string;
    activo?: boolean;
};

export type RolesListResponse = {
    page: number;
    pageSize: number;
    total: number;
    data: RoleSummaryDTO[];
};

/** Detalle de rol (GET /role/:id) que ya usas en la vista de Resumen */
export type RoleDetailDTO = {
    roleId: number;
    nombre: string;
    descripcion: string;
    plataformaCod: string;
    usuarioId: number;
    permisos: RolePermissionDTO[];
    activo?: boolean;
};

/** POST /create-rol */
export type RoleCreatePayload = {
    nombre: string;
    descripcion: string;
    plataformaCod: string; // p.ej. "MIMBRAL_360"
    permisos: RolePermissionDTO[];
    usuarioId: number;
};

export type RoleCreateResponse = {
    id?: number;      // doc: { "id": 2, "message": "Rol creado" }
    roleId?: number;  // compatibilidad con implementación previa
    message?: string;
};

/** PUT /role/:id */
export type RoleUpdatePayload = {
    nombre: string;
    descripcion: string;
    plataformaCod: string;
    usuarioId: number;
    permisos: RolePermissionDTO[];
    activo: boolean;
};

/** POST /asignar-rol */
export type AssignRolePayload = {
    usuarioId: number;
    rolId: number;
    adminId: number;
};

export type AssignRoleResponse = {
    message: string;
};

/** PATCH /users/:id/permissions */
export type UserPermissionsPatchPayload = {
    permisos: RolePermissionDTO[];
    adminId: number;
};

export type UserPermissionsPatchResponse = {
    message: string;
};

/** PATCH /users/:userId/roles/:roleId */
export type UserRolePatchPayload = {
    activo?: boolean;
    adminId?: number;
};

export type UserRolePatchResponse = {
    message: string;
};

/* =============================================================================
 * Helper: fetchJson con error estructurado (mismo patrón que customers.tsx)
 * ========================================================================== */

async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);

    // leemos el cuerpo siempre (éxito o error)
    const raw = await res.text().catch(() => "");
    let payload: any = null;
    try {
        payload = raw ? JSON.parse(raw) : null;
    } catch {
        payload = raw || null;
    }

    if (!res.ok) {
        const err: any = new Error(
            (payload && (payload.message || payload.details)) ||
            `HTTP ${res.status} ${res.statusText}`
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
 * Endpoints Roles
 * ========================================================================== */

// GET /all-roles?page=&pageSize=&name=&creatorEmail=&createdFrom=&createdTo=
export async function rolesList(params?: {
    page?: number;
    pageSize?: number;
    name?: string;
    creatorEmail?: string;
    createdFrom?: string; // ISO date (YYYY-MM-DD) o datetime
    createdTo?: string;
}): Promise<RolesListResponse> {
    const {
        page = 1,
        pageSize = 10,
        name = "",
        creatorEmail = "",
        createdFrom = "",
        createdTo = "",
    } = params || {};

    const url = new URL(`${BASE_ID_SERVICE}/all-roles`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (name) url.searchParams.set("name", name);
    if (creatorEmail) url.searchParams.set("creatorEmail", creatorEmail);
    if (createdFrom) url.searchParams.set("createdFrom", createdFrom);
    if (createdTo) url.searchParams.set("createdTo", createdTo);

    return fetchJson<RolesListResponse>(url.toString(), { method: "GET" });
}

// GET /role/:id  (detalle de rol con permisos)
export async function roleGet(id: number | string) {
    return fetchJson<RoleDetailDTO>(`${BASE_ID_SERVICE}/role/${id}`, {
        method: "GET",
    });
}

// GET /role/:id/permisos
export async function rolePermissionsGet(id: number | string) {
    return fetchJson<RolePermissionsResponse>(`${BASE_ID_SERVICE}/role/${id}/permisos`, {
        method: "GET",
    });
}

// POST /create-rol
export async function roleCreate(payload: RoleCreatePayload) {
    return fetchJson<RoleCreateResponse>(`${BASE_ID_SERVICE}/create-rol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

// PUT /role/:id
export async function roleUpdate(id: number | string, payload: RoleUpdatePayload) {
    return fetchJson<{ message?: string }>(`${BASE_ID_SERVICE}/role/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

/* =============================================================================
 * Endpoints de permisos por usuario
 * ========================================================================== */

// GET /users/:id/permissions
export async function userPermissionsGet(userId: number | string) {
    return fetchJson<UserPermissionsResponse>(
        `${BASE_ID_SERVICE}/users/${userId}/permissions`,
        { method: "GET" }
    );
}

// GET /permissions?usuarioId=&plataformaId=
export async function userPlatformPermissionsGet(params: {
    usuarioId: number;
    plataformaId: number;
}) {
    const { usuarioId, plataformaId } = params;
    const url = new URL(`${BASE_ID_SERVICE}/permissions`);
    url.searchParams.set("usuarioId", String(usuarioId));
    url.searchParams.set("plataformaId", String(plataformaId));

    return fetchJson<UserPlatformPermissionsResponse>(url.toString(), { method: "GET" });
}

// PATCH /users/:id/permissions
export async function userPermissionsPatch(
    userId: number | string,
    payload: UserPermissionsPatchPayload
) {
    return fetchJson<UserPermissionsPatchResponse>(
        `${BASE_ID_SERVICE}/users/${userId}/permissions`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }
    );
}

/* =============================================================================
 * Relación usuario ↔ rol
 * ========================================================================== */

// POST /asignar-rol
export async function assignRoleToUser(payload: AssignRolePayload) {
    return fetchJson<AssignRoleResponse>(`${BASE_ID_SERVICE}/asignar-rol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

// PATCH /users/:userId/roles/:roleId
// La doc no especifica body, pero dejamos payload opcional para soportar futuro { activo, adminId }
export async function userRolePatch(
    userId: number | string,
    roleId: number | string,
    payload?: UserRolePatchPayload
) {
    const init: RequestInit = {
        method: "PATCH",
    };

    if (payload && Object.keys(payload).length > 0) {
        init.headers = { "Content-Type": "application/json" };
        init.body = JSON.stringify(payload);
    }

    return fetchJson<UserRolePatchResponse>(
        `${BASE_ID_SERVICE}/users/${userId}/roles/${roleId}`,
        init
    );
}
