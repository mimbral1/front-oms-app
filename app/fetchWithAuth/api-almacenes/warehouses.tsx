// api/warehouses/warehouses.tsx
// Centraliza todas las llamadas a la API de Almacenes
// Endpoint Janis: ${NEXT_PUBLIC_URL_BASE}/warehouse
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { WAREHOUSE_API } from "@/lib/http/endpoints";

const JANIS_WAREHOUSE_URL = WAREHOUSE_API;


/* ============================================================================
 * Tipos según respuesta compartida
 * ========================================================================== */
export type WarehouseDTO = {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    status?: string;
    referenceId?: string | null;
    location?: string | null;
    group?: string | null;
    groupName?: string | null;
    salesChannels?: Array<number | string>;
    pickingSalesChannelId?: string | null;
    tasks?: string[];
    slottingSchemaId?: string | null;
    distributionPriority?: number | null;
    externalDistribution?: boolean;
    movementsRequiresUserValidation?: boolean;
    limitedToSellers?: boolean | null;
    timezone?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
    createdAt?: string;
    updatedAt?: string;
    positions?: {
        total: number;
        occupied: number;
        occupancyPct: number;
    };
};

type JanisWarehouseRaw = {
    id: string;
    name: string;
    referenceId: string | null;
    location: string | null;
    group: string | null;
    groupName?: string | null;
    salesChannels?: Array<number | string>;
    pickingSalesChannelId?: string | null;
    tasks?: string[];
    schemas?: {
        slotting?: {
            id?: string;
        } | null;
    } | null;
    distributionPriority?: number | null;
    externalDistribution: boolean;
    movementsRequiresUserValidation?: boolean;
    limitedToSellers?: boolean | null;
    timezone?: string | null;
    status: string;
    dateCreated: string;
    dateModified: string;
    userCreated: string | null;
    userModified: string | null;
    positions?: {
        total?: number | null;
        occupied?: number | null;
        occupancyPct?: number | null;
    };
};

type JanisWarehouseWithLegacyLocation = JanisWarehouseRaw & {
    Location?: unknown;
};

function toTextOrNull(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
        const v = value.trim();
        return v.length ? v : null;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        const candidate = obj.name ?? obj.label ?? obj.id ?? obj.code ?? null;
        return toTextOrNull(candidate);
    }
    return null;
}

export type WarehouseStatsDTO = {
    pendingMovements: {
        total: number;
        orders: number;
        packages: number;
        skus: number;
    };
};

/* ============================================================================
 * Helper: fetch wrapper sin auth (mismo estilo que customers.tsx)
 * ========================================================================== */
async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);
    try {
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
        }
        if (res.status === 204) return undefined as unknown as T;
        return (await res.json()) as T;
    } catch (error) {
        alert(error);
        throw error;
    }
}

/* ============================================================================
 * Endpoints Warehouses
 * ========================================================================== */

// GET /warehouses
// - El backend actual devuelve un ARRAY simple (sin { items, total }).
// - Normalizamos a { items, total } como en customers.tsx.
export async function warehousesAll(params?: {
    page?: number;
    pageSize?: number;
}): Promise<{ items: WarehouseDTO[]; total: number }> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;

    const query = new URLSearchParams({
        sortBy: "referenceId",
        sortDirection: "asc",
    });

    const json = await fetchJson<JanisWarehouseRaw[]>(`${JANIS_WAREHOUSE_URL}?${query.toString()}`, {
        method: "GET",
        headers: withAuthPlatformHeaders({
            "x-janis-page": String(page),
            "x-janis-page-size": String(pageSize),
        }),
    });

    const rawItems = Array.isArray(json) ? json : [];
    const items: WarehouseDTO[] = rawItems.map((w) => {
        const location = toTextOrNull((w as JanisWarehouseWithLegacyLocation).location ?? (w as JanisWarehouseWithLegacyLocation).Location);
        const referenceId = w.referenceId ?? null;
        return {
            id: w.id,
            code: referenceId || w.id,
            name: w.name ?? "",
            isActive: String(w.status).toLowerCase() === "active",
            status: w.status,
            referenceId,
            location,
            group: toTextOrNull(w.group),
            groupName: toTextOrNull(w.groupName),
            salesChannels: Array.isArray(w.salesChannels) ? w.salesChannels : [],
            pickingSalesChannelId: toTextOrNull(w.pickingSalesChannelId),
            tasks: Array.isArray(w.tasks) ? w.tasks : [],
            slottingSchemaId: w.schemas?.slotting?.id ?? null,
            distributionPriority: w.distributionPriority ?? null,
            externalDistribution: Boolean(w.externalDistribution),
            movementsRequiresUserValidation: Boolean(w.movementsRequiresUserValidation),
            limitedToSellers: typeof w.limitedToSellers === "boolean" ? w.limitedToSellers : null,
            timezone: toTextOrNull(w.timezone),
            userCreated: toTextOrNull(w.userCreated),
            userModified: toTextOrNull(w.userModified),
            createdAt: w.dateCreated,
            updatedAt: w.dateModified,
            positions: {
                total: Number(w.positions?.total ?? 0),
                occupied: Number(w.positions?.occupied ?? 0),
                occupancyPct: Number(w.positions?.occupancyPct ?? 0),
            },
        };
    });
    const total = items.length;

    return { items, total };
}

// (Opcional futuro) GET /warehouses/:code
export async function warehouseGet(code: string): Promise<WarehouseDTO | undefined> {
    try {
        const url = `${JANIS_WAREHOUSE_URL}/${encodeURIComponent(code)}`;
        const raw = await fetchJson<JanisWarehouseRaw>(url, {
            method: "GET",
            headers: withAuthPlatformHeaders({
                "x-janis-page": "1",
                "x-janis-page-size": "20",
            }),
        });

        return {
            id: raw.id,
            code: raw.referenceId || raw.id,
            name: raw.name ?? "",
            isActive: String(raw.status).toLowerCase() === "active",
            status: raw.status,
            referenceId: raw.referenceId ?? null,
            location: toTextOrNull((raw as JanisWarehouseWithLegacyLocation).location ?? (raw as JanisWarehouseWithLegacyLocation).Location),
            group: toTextOrNull(raw.group),
            groupName: toTextOrNull(raw.groupName),
            salesChannels: Array.isArray(raw.salesChannels) ? raw.salesChannels : [],
            pickingSalesChannelId: toTextOrNull(raw.pickingSalesChannelId),
            tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
            slottingSchemaId: raw.schemas?.slotting?.id ?? null,
            distributionPriority: raw.distributionPriority ?? null,
            externalDistribution: Boolean(raw.externalDistribution),
            movementsRequiresUserValidation: Boolean(raw.movementsRequiresUserValidation),
            limitedToSellers:
                typeof raw.limitedToSellers === "boolean" ? raw.limitedToSellers : null,
            timezone: toTextOrNull(raw.timezone),
            userCreated: toTextOrNull(raw.userCreated),
            userModified: toTextOrNull(raw.userModified),
            createdAt: raw.dateCreated,
            updatedAt: raw.dateModified,
            positions: {
                total: Number(raw.positions?.total ?? 0),
                occupied: Number(raw.positions?.occupied ?? 0),
                occupancyPct: Number(raw.positions?.occupancyPct ?? 0),
            },
        };
    } catch {
        return undefined;
    }
}

export async function warehouseGetStats(code: string): Promise<WarehouseStatsDTO | undefined> {
    try {
        const url = `${JANIS_WAREHOUSE_URL}/${encodeURIComponent(code)}/stats`;
        const raw = await fetchJson<WarehouseStatsDTO>(url, {
            method: "GET",
            headers: withAuthPlatformHeaders({
                "x-janis-page": "1",
                "x-janis-page-size": "20",
            }),
        });

        return {
            pendingMovements: {
                total: Number(raw?.pendingMovements?.total ?? 0),
                orders: Number(raw?.pendingMovements?.orders ?? 0),
                packages: Number(raw?.pendingMovements?.packages ?? 0),
                skus: Number(raw?.pendingMovements?.skus ?? 0),
            },
        };
    } catch {
        return undefined;
    }
}
