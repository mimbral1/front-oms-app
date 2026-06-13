// app\fetchWithAuth\api-traslados\inventory-docs.tsx

const BASE_INVENTORY_DOCS = process.env.NEXT_PUBLIC_BASE_INVENTORY_DOCS_API;
const BASE_MOVEMENTS = process.env.NEXT_PUBLIC_BASE_MOVEMENTS_API;

import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import {
    MOCK_INVENTORY_DOCS,
    MOCK_DETAILS,
} from "@/features/almacenes/pages/Gestion/SolicitudTraslado/Componentes/mock/mock-inventory-docs";

const USE_MOCK = true; // Cambiar a false cuando levanten API


/* ---------- Tipos ---------- */
export interface InventoryDocRow {
    id: number;
    docType: string;              // "TT" | "EP"
    fromWh: string | null;
    toWh: string | null;
    postingDate: string;
    status: string;
    reference: string;
    sapDocEntry: number | null;
    sapDocNum: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryDocsResponse {
    ok: boolean;
    rows: InventoryDocRow[];
}

/* ---------- Listado ---------- */
// export async function getInventoryDocs(): Promise<InventoryDocsResponse> {
//     const url = `${BASE_INVENTORY_DOCS}/inventory-docs`;

//     const res = await fetch(url, {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//     });

//     if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         throw new Error(
//             `Error ${res.status}: ${text || "No se pudo obtener el listado de traslados"}`
//         );
//     }

//     const data = (await res.json()) as InventoryDocsResponse;
//     if (!data || !Array.isArray(data.rows)) {
//         return { ok: false, rows: [] };
//     }

//     return data;
// }

export async function getInventoryDocs(): Promise<InventoryDocsResponse> {
    if (USE_MOCK) {
        return {
            ok: true,
            rows: MOCK_INVENTORY_DOCS,
        };
    }

    const url = `${BASE_INVENTORY_DOCS}/inventory-docs`;

    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo obtener el listado de traslados"}`
        );
    }

    const data = (await res.json()) as InventoryDocsResponse;
    if (!data || !Array.isArray(data.rows)) {
        return { ok: false, rows: [] };
    }

    return data;
}

/* ---------- Resumen ---------- */
export interface InventoryDocHeader {
    id: number;
    docType: string;
    fromWarehouseCode: string | null;
    toWarehouseCode: string | null;
    postingDate: string;
    reference: string;
    metaJson: string;
    status: string;
    externalRef: string;
    sapDocEntry: number | null;
    sapDocNum: number | null;
    sapSeries: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryDocLine {
    id: number;
    documentId: number;
    itemSku: string;
    fromWarehouseCode: string | null;
    toWarehouseCode: string | null;
    quantity: number;
    movementId: number;
    createdAt: string;
    updatedAt: string;
    poDocEntry: number | null;
    poLineNum: number | null;
}

export interface InventoryDocDetailResponse {
    ok: boolean;
    header: InventoryDocHeader;
    lines: InventoryDocLine[];
}

// export async function getInventoryDocById(
//     id: number | string
// ): Promise<InventoryDocDetailResponse> {
//     const url = `${BASE_INVENTORY_DOCS}/inventory-docs/${id}`;

//     const res = await fetch(url, {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//     });

//     if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         throw new Error(
//             `Error ${res.status}: ${text || "No se pudo obtener el traslado"}`
//         );
//     }

//     return (await res.json()) as InventoryDocDetailResponse;
// }

export async function getInventoryDocById(
    id: number | string
): Promise<InventoryDocDetailResponse> {
    if (USE_MOCK) {
        const numericId = Number(id);
        const found = MOCK_DETAILS[numericId];

        if (!found) {
            throw new Error("Traslado mock no encontrado");
        }

        return {
            ok: true,
            header: found.header,
            lines: found.lines,
        };
    }

    const url = `${BASE_INVENTORY_DOCS}/inventory-docs/${id}`;

    const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo obtener el traslado"}`
        );
    }

    return (await res.json()) as InventoryDocDetailResponse;
}


/* ---------- Crear traslado ---------- */
export interface CreateInventoryDocPayload {
    header: {
        docType: "TT";
        fromWh: string;
        toWh: string;
        reference: string;
        metaJson: {
            DocDate: string;
            FromPosition?: string;
            ToPosition?: string;
        };
        externalRef: string;
    };
    lines: Array<{
        itemSku: string;
        quantity: number;
    }>;
}

// export async function createInventoryDoc(
//     payload: CreateInventoryDocPayload
// ) {
//     const url = `${BASE_INVENTORY_DOCS}/inventory-docs`;

//     const res = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         throw new Error(
//             `Error ${res.status}: ${text || "No se pudo crear el traslado"}`
//         );
//     }

//     try {
//         return await res.json();
//     } catch {
//         return {};
//     }
// }

export async function createInventoryDoc(
    payload: CreateInventoryDocPayload
) {
    if (USE_MOCK) {
        console.log("MOCK CREATE INVENTORY DOC", payload);

        return {
            ok: true,
            id: Math.floor(Math.random() * 10000),
        };
    }

    const url = `${BASE_INVENTORY_DOCS}/inventory-docs`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo crear el traslado"}`
        );
    }

    try {
        return await res.json();
    } catch {
        return {};
    }
}

/* ---------- Crear movimiento interno ---------- */
const MOVEMENT_URL = `${BASE_MOVEMENTS}/movement`;

export type MovementType =
    | "internalDistribution"
    | "supplying"
    | "replenishment"
    | "canceling";

export const MOVEMENT_TYPES: MovementType[] = [
    "internalDistribution",
    "supplying",
    "replenishment",
    "canceling",
];

export interface CreateInternalDistributionMovementPayload {
    type: MovementType;
    usuarioCreadorId?: number;
    source: {
        warehouseId: string;
        positionId: string;
    };
    destination: {
        warehouseId: string;
        positionId: string;
    };
    content: {
        skuId: string;
        quantity: number;
    };
    assigneeId: string;
    dispatcherId: string;
    receiverId: string;
}

export interface MovementDetailResponse {
    id: string;
    displayId?: string | null;
    type?: string | null;
    order?: string | number | null;
    source?: {
        warehouseId?: string;
        positionId?: string;
        warehouseName?: string;
        positionKey?: string;
    } | null;
    destination?: {
        warehouseId?: string;
        positionId?: string;
        warehouseName?: string;
        positionKey?: string;
    } | null;
    content?: {
        skuId?: string;
        quantity?: number;
    } | null;
    status?: string | null;
    dateStarted?: string | null;
    dateEnded?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
}

export async function getMovementById(id: string): Promise<MovementDetailResponse> {
    const res = await fetch(`${MOVEMENT_URL}/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: withAuthPlatformHeaders(),
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo obtener el movimiento"}`
        );
    }

    return (await res.json()) as MovementDetailResponse;
}

export async function createInternalDistributionMovement(
    payload: CreateInternalDistributionMovementPayload
) {
    const res = await fetch(MOVEMENT_URL, {
        method: "POST",
        headers: withAuthPlatformHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo crear el movimiento"}`
        );
    }

    try {
        return await res.json();
    } catch {
        return {};
    }
}
