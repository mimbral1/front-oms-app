"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
    CATALOG_PRODUCTS_API,
    WAREHOUSE_STOCK_API,
    WAREHOUSE_STOCK_MOVEMENT_API,
} from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import {
    ArrowPathIcon,
    ArrowPathRoundedSquareIcon,
    BuildingStorefrontIcon,
    CubeIcon,
    MapPinIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { CopyableText } from "@/components/ui/copyable-text";
import SaveOutlined from "@mui/icons-material/SaveOutlined";

type CatalogProductResponse = {
    Name?: string | null;
    name?: string | null;
};

type StockDetailResponse = {
    id: string;
    sku: string;
    warehouse: string;
    warehouseName: string;
    warehouseReferenceId: string;
    stock: number;
    reservedStock: number;
    availableStock: number;
};

type ApiStockMovement = {
    Id?: string | null;
    id?: string | null;
    SkuId?: string | null;
    skuId?: string | null;
    WarehouseId?: string | null;
    warehouseId?: string | null;
    StockId?: string | null;
    stockId?: string | null;
    PreviousStock?: number | null;
    previousStock?: number | null;
    CurrentStock?: number | null;
    currentStock?: number | null;
    MotiveId?: string | null;
    motiveId?: string | null;
    DateCreated?: string | null;
    dateCreated?: string | null;
    UserCreated?: string | null;
    userCreated?: string | null;
    SourceSystem?: string | null;
    sourceSystem?: string | null;
    ExternalObjectType?: string | null;
    externalObjectType?: string | null;
    ExternalDocEntry?: string | null;
    externalDocEntry?: string | null;
    ExternalDocNum?: string | null;
    externalDocNum?: string | null;
    QuantityDelta?: number | null;
    quantityDelta?: number | null;
    Source?: string | null;
    source?: string | null;
};

type MovementRow = {
    id: string;
    movement: string;
    inventory: string;
    origin: string;
    destination: string;
    sku: string;
    skuName: string;
    quantity: number;
    currentStock: number;
    reserved: number;
    available: number;
    modifiedAt: string;
    status: "Pendiente" | "Iniciado" | "Recolectado" | "Finalizado" | "Rechazado" | "Cancelado";
    kind: "Entrada" | "Salida";
};

type TabFilter = "Entrada" | "Salida";

const PER_PAGE = 20;

const MOCK_ROWS: MovementRow[] = [
    {
        id: "MOV #884254",
        movement: "MOV #884254",
        inventory: "1e59959 - Palerm",
        origin: "Inbound",
        destination: "Slotting pendiente",
        sku: "2016364",
        skuName: "Viña M",
        quantity: 12,
        currentStock: 1008,
        reserved: 17,
        available: 991,
        modifiedAt: "08/09/2025 17:18",
        status: "Pendiente",
        kind: "Entrada",
    },
    {
        id: "MOV #884246",
        movement: "MOV #884246",
        inventory: "1e59959 - Palerm",
        origin: "Receiving",
        destination: "Slotting 1-003-2",
        sku: "2016364",
        skuName: "Viña M",
        quantity: 6,
        currentStock: 1003,
        reserved: 17,
        available: 985,
        modifiedAt: "08/09/2025 16:44",
        status: "Iniciado",
        kind: "Entrada",
    },
    {
        id: "MOV #884210",
        movement: "MOV #884210",
        inventory: "1e59959 - Palerm",
        origin: "Inbound",
        destination: "Slotting 1-003-2",
        sku: "2016364",
        skuName: "Viña M",
        quantity: 2,
        currentStock: 997,
        reserved: 17,
        available: 979,
        modifiedAt: "01/09/2025 18:22",
        status: "Finalizado",
        kind: "Entrada",
    },
    {
        id: "MOV #884198",
        movement: "MOV #884198",
        inventory: "1e59959 - Palerm",
        origin: "Holding",
        destination: "Picking",
        sku: "2016364",
        skuName: "Viña M",
        quantity: 1,
        currentStock: 997,
        reserved: 17,
        available: 979,
        modifiedAt: "21/08/2025 18:46",
        status: "Recolectado",
        kind: "Salida",
    },
    {
        id: "MOV #884144",
        movement: "MOV #884144",
        inventory: "1e59959 - Palerm",
        origin: "Picking",
        destination: "Outbound",
        sku: "2016364",
        skuName: "Viña M",
        quantity: 2,
        currentStock: 995,
        reserved: 15,
        available: 980,
        modifiedAt: "18/08/2025 13:22",
        status: "Finalizado",
        kind: "Salida",
    },
    {
        id: "MOV #884102",
        movement: "MOV #884102",
        inventory: "1e59959 - Palerm",
        origin: "Picking",
        destination: "Outbound",
        sku: "2016364",
        skuName: "Viña M",
        quantity: 4,
        currentStock: 997,
        reserved: 17,
        available: 979,
        modifiedAt: "14/08/2025 10:19",
        status: "Cancelado",
        kind: "Salida",
    },
];

const statusClass: Record<MovementRow["status"], string> = {
    Pendiente: "bg-slate-500 text-white",
    Iniciado: "bg-blue-500 text-white",
    Recolectado: "bg-indigo-500 text-white",
    Finalizado: "bg-green-500 text-white",
    Rechazado: "bg-red-500 text-white",
    Cancelado: "bg-amber-500 text-white",
};

const quantityPill =
    "inline-flex h-7 min-w-[40px] items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700";

const normalize = (value?: string | null) => String(value || "").trim().toLowerCase();
const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getMovementList = (payload: ApiStockMovement[] | { movements?: ApiStockMovement[]; data?: ApiStockMovement[]; items?: ApiStockMovement[] }) => {
    if (Array.isArray(payload)) return payload;
    return payload.movements || payload.data || payload.items || [];
};

const mapMovementStatus = (status?: string | null): MovementRow["status"] => {
    const normalized = normalize(status);
    if (normalized === "pending") return "Pendiente";
    if (normalized === "started") return "Iniciado";
    if (normalized === "picked") return "Recolectado";
    if (normalized === "ended") return "Finalizado";
    if (normalized === "rejected") return "Rechazado";
    if (normalized === "canceled") return "Cancelado";
    return "Pendiente";
};

const buildInventoryName = (stock: StockDetailResponse) => {
    const reference = stock.warehouseReferenceId || stock.warehouse;
    const warehouseName = stock.warehouseName || "";

    if (!warehouseName) return reference || "-";
    if (!reference) return warehouseName;

    const normalizedReference = normalize(reference);
    const normalizedName = normalize(warehouseName);
    const nameAlreadyIncludesReference =
        normalizedName === normalizedReference ||
        normalizedName.startsWith(`${normalizedReference} `) ||
        normalizedName.startsWith(`${normalizedReference}-`);

    return nameAlreadyIncludesReference ? warehouseName : `${reference} - ${warehouseName}`;
};

const fetchProductName = async (sku: string) => {
    try {
        const response = await fetch(`${CATALOG_PRODUCTS_API}/${encodeURIComponent(sku)}`, {
            method: "GET",
            headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
            cache: "no-store",
        });

        if (!response.ok) return "";

        const product = (await response.json()) as CatalogProductResponse;
        return String(product.Name || product.name || "").trim();
    } catch {
        return "";
    }
};

const getMovementKind = (movement: ApiStockMovement): TabFilter => {
    const previousStock = Number(movement.PreviousStock ?? movement.previousStock ?? 0);
    const currentStock = Number(movement.CurrentStock ?? movement.currentStock ?? 0);
    return previousStock > currentStock ? "Salida" : "Entrada";
};

const getMovementQuantity = (movement: ApiStockMovement) => {
    const explicitDelta = movement.QuantityDelta ?? movement.quantityDelta;
    if (typeof explicitDelta === "number" && Number.isFinite(explicitDelta)) {
        return Math.abs(explicitDelta);
    }

    const previousStock = Number(movement.PreviousStock ?? movement.previousStock ?? 0);
    const currentStock = Number(movement.CurrentStock ?? movement.currentStock ?? 0);
    return Math.abs(currentStock - previousStock);
};

const getMovementReference = (movement: ApiStockMovement) => {
    return (
        movement.Source ||
        movement.source ||
        movement.ExternalDocNum ||
        movement.externalDocNum ||
        movement.ExternalObjectType ||
        movement.externalObjectType ||
        "-"
    );
};

const mapMovement = (movement: ApiStockMovement, stock: StockDetailResponse, skuName: string): MovementRow => {
    const movementId = movement.Id || movement.id || "-";
    const kind = getMovementKind(movement);
    const currentStock = Number(movement.CurrentStock ?? movement.currentStock ?? 0);
    return {
        id: String(movementId),
        movement: String(movementId),
        inventory: buildInventoryName(stock),
        origin: kind === "Salida" ? buildInventoryName(stock) : getMovementReference(movement),
        destination: kind === "Entrada" ? buildInventoryName(stock) : getMovementReference(movement),
        sku: String(movement.SkuId || movement.skuId || stock.sku),
        skuName,
        quantity: getMovementQuantity(movement),
        currentStock,
        reserved: Number(stock.reservedStock ?? 0),
        available: Number(stock.availableStock ?? 0),
        modifiedAt: formatDate(movement.DateCreated || movement.dateCreated),
        status: "Finalizado",
        kind,
    };
};

const getColumns = (): Column<MovementRow>[] => [
    {
        header: "Movimiento",
        accessorKey: "movement",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <ArrowPathRoundedSquareIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-blue-700">{row.movement}</span>
            </div>
        ),
    },
    {
        header: "SKU",
        accessorKey: "sku",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <CubeIcon className="h-4 w-4 text-slate-500" />
                <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-blue-700">
                        <CopyableText text={row.sku}>{row.sku}</CopyableText>
                    </span>
                    {row.skuName ? <span className="truncate text-xs font-medium text-slate-500">{row.skuName}</span> : null}
                </div>
            </div>
        ),
    },
    {
        header: "Inventario",
        accessorKey: "inventory",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <BuildingStorefrontIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-blue-700">{row.inventory}</span>
            </div>
        ),
    },
    {
        header: "Origen",
        accessorKey: "origin",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-blue-700">{row.origin}</span>
            </div>
        ),
    },
    {
        header: "Destino",
        accessorKey: "destination",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-blue-700">{row.destination}</span>
            </div>
        ),
    },
    {
        header: "Cantidad",
        accessorKey: "quantity",
        cell: (row) => (
            <div className="flex justify-center">
                <span className={quantityPill}>{row.quantity}</span>
            </div>
        ),
    },
    {
        header: "Stock actual",
        accessorKey: "currentStock",
        cell: (row) => (
            <div className="flex justify-center">
                <span className={quantityPill}>{row.currentStock}</span>
            </div>
        ),
    },
    {
        header: "Reservado",
        accessorKey: "reserved",
        cell: (row) => (
            <div className="flex justify-center">
                <span className={quantityPill}>{row.reserved}</span>
            </div>
        ),
    },
    {
        header: "Disponible",
        accessorKey: "available",
        cell: (row) => (
            <div className="flex justify-center">
                <span className={quantityPill}>{row.available}</span>
            </div>
        ),
    },
    {
        header: "Modificado",
        accessorKey: "modifiedAt",
        cell: (row) => <span className="text-sm text-slate-700">{row.modifiedAt}</span>,
    },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (row) => (
            <span className={`inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass[row.status]}`}>
                {row.status}
            </span>
        ),
    },
];

export default function StockMovimientosView() {
    const router = useRouter();
    const { id } = useParams<{ id?: string | string[] }>();
    const stockId = Array.isArray(id) ? id[0] : id;
    const [headerName, setHeaderName] = useState("");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabFilter>("Entrada");
    const [currentPage, setCurrentPage] = useState(1);
    const [stock, setStock] = useState<StockDetailResponse | null>(null);
    const [rows, setRows] = useState<MovementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSave = useCallback(async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 350));
        setSaving(false);
    }, []);

    const loadMovements = useCallback(async (targetStockId: string) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const stockResponse = await fetch(`${WAREHOUSE_STOCK_API}/${encodeURIComponent(targetStockId)}`, {
                method: "GET",
                headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                cache: "no-store",
            });

            if (!stockResponse.ok) {
                throw new Error(`HTTP ${stockResponse.status}`);
            }

            const selectedStock = (await stockResponse.json()) as StockDetailResponse;
            const productName = await fetchProductName(selectedStock.sku);

            const movementResponse = await fetch(`${WAREHOUSE_STOCK_MOVEMENT_API}?filters[StockId]=${encodeURIComponent(targetStockId)}`, {
                method: "GET",
                headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                cache: "no-store",
            });

            if (!movementResponse.ok) {
                throw new Error(`HTTP ${movementResponse.status}`);
            }

            const movementPayload = (await movementResponse.json()) as ApiStockMovement[] | { movements?: ApiStockMovement[]; data?: ApiStockMovement[]; items?: ApiStockMovement[] };
            const movements = getMovementList(movementPayload);

            const mappedRows = movements.map((movement) => mapMovement(movement, selectedStock, productName));

            setStock(selectedStock);
            setHeaderName(productName || selectedStock.sku);
            setRows(mappedRows);
        } catch (error: unknown) {
            setStock(null);
            setHeaderName("");
            setRows([]);
            setErrorMessage(getErrorMessage(error, "No se pudieron cargar los movimientos."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!stockId || typeof stockId !== "string") {
            setStock(null);
            setRows([]);
            setLoading(false);
            return;
        }

        void loadMovements(stockId);
    }, [stockId, loadMovements]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/stock"),
                disabled: saving,
            },
        ],
        [handleSave, router, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Stock</div>
                    <div className="text-2xl font-semibold text-gray-900">{headerName || (stockId ? String(stockId) : "Stock")}</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions, headerName, stockId]
    );

    const columns = useMemo(() => getColumns(), []);

    const filteredRows = useMemo(() => {
        return rows.filter((row) => row.kind === activeTab);
    }, [activeTab, rows]);

    const totalRecords = filteredRows.length;

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    const tabs: TabFilter[] = ["Entrada", "Salida"];

    const handleTabClick = (tab: TabFilter) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[#e8eaf5] p-6">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrar movimientos por tipo">
                    {tabs.map((tab) => {
                        const isActive = tab === activeTab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={[
                                    "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition",
                                    isActive
                                        ? "border-blue-500 bg-white text-blue-700"
                                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50",
                                ].join(" ")}
                                onClick={() => handleTabClick(tab)}
                            >
                                <span
                                    className={[
                                        "inline-block h-2.5 w-2.5 rounded-full ring-2 transition",
                                        isActive ? "bg-blue-600 ring-blue-600" : "bg-white ring-slate-300 group-hover:ring-blue-400",
                                    ].join(" ")}
                                />
                                {tab}
                            </button>
                        );
                    })}
                </div>

                {errorMessage ? (
                    <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-sm font-medium text-red-700">
                        {errorMessage}
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center bg-white px-4 py-6 text-center text-sm text-gray-500">
                        <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                        Cargando movimientos...
                    </div>
                ) : (
                    <>
                        <DataTable
                            data={pagedRows}
                            columns={columns}
                            dataType="General2"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            showStatusBorder
                        />

                        <Pagination
                            currentPage={currentPage}
                            totalRecords={totalRecords}
                            pageSize={PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}

                <div className="text-xs text-slate-600">
                    {totalRecords} resultados &nbsp; {PER_PAGE} por pagina
                </div>
            </div>
        </div>
    );
}
