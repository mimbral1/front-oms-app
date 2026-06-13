import type {
    InventoryDocRow,
    InventoryDocHeader,
    InventoryDocLine,
} from "@/app/fetchWithAuth/api-traslados/inventory-docs";

/* =========================================================
   MOCK INVENTORY DOCS
   SOLO PARA DESARROLLO
   ========================================================= */

const now = new Date();

const iso = (d: Date) => d.toISOString();

/* ---------- LISTADO ---------- */
export const MOCK_INVENTORY_DOCS: InventoryDocRow[] = [
    {
        id: 1001,
        docType: "TT",
        fromWh: "BOD-01",
        toWh: "BOD-02",
        postingDate: iso(now),
        status: "POSTED",
        reference: "TR-1001",
        sapDocEntry: 45001,
        sapDocNum: 78001,
        createdAt: iso(now),
        updatedAt: iso(now),
    },
    {
        id: 1002,
        docType: "TT",
        fromWh: "BOD-03",
        toWh: "BOD-01",
        postingDate: iso(new Date(now.getTime() - 86400000)),
        status: "QUEUED",
        reference: "TR-1002",
        sapDocEntry: null,
        sapDocNum: null,
        createdAt: iso(now),
        updatedAt: iso(now),
    },
    {
        id: 1003,
        docType: "TT",
        fromWh: "BOD-02",
        toWh: "BOD-04",
        postingDate: iso(new Date(now.getTime() - 172800000)),
        status: "POSTED",
        reference: "REPOSICION-PLANTA",
        sapDocEntry: 45003,
        sapDocNum: 78003,
        createdAt: iso(now),
        updatedAt: iso(now),
    },
];

/* ---------- DETALLE ---------- */
export const MOCK_DETAILS: Record<
    number,
    { header: InventoryDocHeader; lines: InventoryDocLine[] }
> = {
    1001: {
        header: {
            id: 1001,
            docType: "TT",
            fromWarehouseCode: "BOD-01",
            toWarehouseCode: "BOD-02",
            postingDate: iso(now),
            reference: "TR-1001",
            metaJson: JSON.stringify({ DocDate: "2026-02-12" }),
            status: "POSTED",
            externalRef: "TT-1001-MOCK",
            sapDocEntry: 45001,
            sapDocNum: 78001,
            sapSeries: 1,
            createdAt: iso(now),
            updatedAt: iso(now),
        },
        lines: [
            {
                id: 1,
                documentId: 1001,
                itemSku: "SKU-001",
                fromWarehouseCode: "BOD-01",
                toWarehouseCode: "BOD-02",
                quantity: 25,
                movementId: 90001,
                createdAt: iso(now),
                updatedAt: iso(now),
                poDocEntry: null,
                poLineNum: null,
            },
            {
                id: 2,
                documentId: 1001,
                itemSku: "SKU-002",
                fromWarehouseCode: "BOD-01",
                toWarehouseCode: "BOD-02",
                quantity: 10,
                movementId: 90002,
                createdAt: iso(now),
                updatedAt: iso(now),
                poDocEntry: null,
                poLineNum: null,
            },
        ],
    },

    1002: {
        header: {
            id: 1002,
            docType: "TT",
            fromWarehouseCode: "BOD-03",
            toWarehouseCode: "BOD-01",
            postingDate: iso(now),
            reference: "TR-1002",
            metaJson: JSON.stringify({ DocDate: "2026-02-11" }),
            status: "QUEUED",
            externalRef: "TT-1002-MOCK",
            sapDocEntry: null,
            sapDocNum: null,
            sapSeries: null,
            createdAt: iso(now),
            updatedAt: iso(now),
        },
        lines: [
            {
                id: 3,
                documentId: 1002,
                itemSku: "SKU-003",
                fromWarehouseCode: "BOD-03",
                toWarehouseCode: "BOD-01",
                quantity: 5,
                movementId: 0,
                createdAt: iso(now),
                updatedAt: iso(now),
                poDocEntry: null,
                poLineNum: null,
            },
        ],
    },
};
