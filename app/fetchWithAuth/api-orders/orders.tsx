// app\fetchWithAuth\api-orders\orders.tsx

import { BASE_ORDERS } from "@/lib/http/endpoints";
import { MOCK_OPEN_LINES } from "@/features/almacenes/components/gestion/ingreso/mock/mock-open-lines";

// Cliente de API para Órdenes de Compra (open lines)
export interface PurchaseOrderOpenLine {
    llegadaDate: string;
    poDocEntry: number;
    docNum: number;
    series: number;
    docDate: string;
    docDueDate: string;
    docStatus: "O" | "C";
    cancelled: boolean;
    vendorCode: string;
    vendorName: string;
    lineNum: number;
    itemSku: string;
    warehouseCode: string;
    orderedQty: number;
    openQty: number;
    price: number;
    currency: string;
    taxCode: string;
    uomCode: string;
    lineStatus: "O" | "C";
    createdAt: string;
    updatedAt: string;
}

export interface OpenLinesResponse {
    rows: PurchaseOrderOpenLine[];
    total?: number;
}


/**
 * getOpenLines
 * Si pasas docNum, filtra por ese documento.
 */
// export async function getOpenLines(
//     page = 1,
//     pageSize = 50,
//     docNum?: number
// ): Promise<OpenLinesResponse> {
//     const params = new URLSearchParams();
//     params.set("page", String(page));
//     params.set("pageSize", String(pageSize));
//     if (docNum !== undefined) params.set("docNum", String(docNum));

//     const url = `${BASE_ORDERS}/po/open-lines?${params.toString()}`;

//     const res = await fetch(url, {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//     });

//     if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         throw new Error(`Error ${res.status}: ${text || "No se pudo obtener open-lines"}`);
//     }

//     const data = (await res.json()) as OpenLinesResponse;
//     if (!data || !Array.isArray(data.rows)) return { rows: [], total: 0 };
//     return data;
// }

export async function getOpenLines(
    page = 1,
    pageSize = 50,
    docNum?: number
): Promise<OpenLinesResponse> {

    console.warn("⚠ï¸‍ USANDO MOCK DE OPEN LINES");

    let data = MOCK_OPEN_LINES;

    if (docNum !== undefined) {
        data = data.filter((r) => r.docNum === docNum);
    }

    return {
        rows: data,
        total: data.length,
    };
}


/** Helper explícito por docNum */
export async function getOpenLinesByDocNum(docNum: number, page = 1, pageSize = 50) {
    return getOpenLines(page, pageSize, docNum);
}

// ===== Inventory Docs (Entrada de Mercancía) =====

export interface InventoryDocPayload {
    header: {
        docType: "EP";
        toWh: string;
        reference: string;
        metaJson: {
            user: string;
            source: string;
            CardCode: string;
            Comments: string;
            DocumentSubType: "bost_Normal";
            Series: string;
            Indicator: number;
            FolioPrefixString: string;
            FolioNumber: number;
        };
        externalRef: string;
    };
    lines: Array<{
        BaseType: 22;
        itemSku: string;
        BaseEntry: number;
        BaseLine: number;
        quantity: number;
    }>;
}

export async function createInventoryDoc(payload: InventoryDocPayload) {
    const url = `${BASE_ORDERS}/inventory-docs`;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo crear la entrada de mercancía"}`
        );
    }

    // algunas APIs devuelven vacío; intentamos parsear, si no, regresamos {}
    try {
        return await res.json();
    } catch {
        return {};
    }
}

// ===== Movements (REGISTRAR EM) =====
export interface MovementPayload {
    type: "EM";        // siempre EM
    sku: string;       // SKU del ítem (línea)
    toWh: string;      // inventario destino
    quantity: number;  // cantidad de la línea
    reference: string; // OC-<poDocEntry> (o lo que uses)
}

export interface MovementResponse {
    ok: boolean;
    movementId: string; // p.ej. "1250"
    type: "EM";
}

export async function registerMovementEM(payload: MovementPayload): Promise<MovementResponse> {
    const url = `${BASE_ORDERS}/movements`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Error ${res.status}: ${text || "No se pudo registrar el movimiento EM"}`);
    }
    return (await res.json()) as MovementResponse;
}
