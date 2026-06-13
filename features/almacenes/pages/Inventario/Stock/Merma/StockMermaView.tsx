"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { CopyableText } from "@/components/ui/copyable-text";
import {
    CATALOG_PRODUCTS_API,
    WAREHOUSE_SHRINKAGE_API,
    WAREHOUSE_STOCK_API,
} from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import {
    ArrowPathIcon,
    CheckCircleIcon,
    TrashIcon,
    BuildingStorefrontIcon,
    MapPinIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
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
};

type ApiShrinkage = {
    id?: string | null;
    displayId?: string | null;
    storedGoodId?: string | null;
    skuId?: string | null;
    warehouseId?: string | null;
    positionId?: string | null;
    schemaType?: string | null;
    quantity?: number | null;
    snapshotQuantity?: number | null;
    motiveId?: string | null;
    motiveName?: string | null;
    comment?: string | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
};

type MermaState = "Procesada" | "Pendiente";

type MermaRow = {
    id: string;
    merma: string;
    storedGood: string;
    inventario: string;
    posicion: string;
    schema: string;
    bienAfectado: string;
    motivo: string;
    cantidad: number;
    stockPrevio: number;
    comentario: string;
    creado: string;
    modificado: string;
    estado: MermaState;
};

type StatusFilter = "Procesadas" | "Pendientes";

const PER_PAGE = 60;

const MERMA_MOTIVE_LABELS: Record<string, string> = {
    "a1b2c3d4-0001-0001-0001-000000000002": "Producto dañado",
    "a1b2c3d4-0001-0001-0001-000000000003": "Producto vencido",
    "a1b2c3d4-0001-0001-0001-000000000005": "Merma operativa",
};

const statusPillClass: Record<MermaState, string> = {
    Procesada: "bg-green-500 text-white",
    Pendiente: "bg-amber-500 text-white",
};

const numberPillClass =
    "inline-flex h-7 min-w-[40px] items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm text-slate-700";

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

const getShrinkageList = (payload: ApiShrinkage[] | { shrinkages?: ApiShrinkage[]; data?: ApiShrinkage[]; items?: ApiShrinkage[] }) => {
    if (Array.isArray(payload)) return payload;
    return payload.shrinkages || payload.data || payload.items || [];
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

const mapMermaStatus = (value?: string | null): MermaState => {
    return normalize(value) === "processed" ? "Procesada" : "Pendiente";
};

const mapMerma = (shrinkage: ApiShrinkage, stock: StockDetailResponse, productName: string): MermaRow => {
    const sku = String(shrinkage.skuId || stock.sku || "-");

    return {
        id: String(shrinkage.id || shrinkage.displayId || `${sku}-${shrinkage.dateCreated || ""}`),
        merma: String(shrinkage.displayId || shrinkage.id || "-"),
        storedGood: String(shrinkage.storedGoodId || "-"),
        inventario: buildInventoryName(stock),
        posicion: String(shrinkage.positionId || "-"),
        schema: String(shrinkage.schemaType || "-"),
        bienAfectado: productName ? `${sku} - ${productName}` : sku,
        motivo: String(shrinkage.motiveName || MERMA_MOTIVE_LABELS[String(shrinkage.motiveId || "")] || shrinkage.motiveId || "-"),
        cantidad: Number(shrinkage.quantity ?? 0),
        stockPrevio: Number(shrinkage.snapshotQuantity ?? 0),
        comentario: String(shrinkage.comment || "-"),
        creado: formatDate(shrinkage.dateCreated),
        modificado: formatDate(shrinkage.dateModified || shrinkage.dateCreated),
        estado: mapMermaStatus(shrinkage.status),
    };
};

const getColumns = (): Column<MermaRow>[] => [
    {
        header: "Merma",
        accessorKey: "merma",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <TrashIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-blue-700">{row.merma}</span>
            </div>
        ),
    },
    {
        header: "Stored Good",
        accessorKey: "storedGood",
        cell: (row) => (
            <span className="text-sm text-blue-700">
                <CopyableText text={row.storedGood}>{row.storedGood}</CopyableText>
            </span>
        ),
    },
    {
        header: "Inventario",
        accessorKey: "inventario",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <BuildingStorefrontIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-blue-700">{row.inventario}</span>
            </div>
        ),
    },
    {
        header: "Posicion",
        accessorKey: "posicion",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-blue-700">{row.posicion}</span>
            </div>
        ),
    },
    {
        header: "Schema",
        accessorKey: "schema",
        cell: (row) => <span className="text-sm text-slate-700">{row.schema}</span>,
    },
    {
        header: "Bien afectado",
        accessorKey: "bienAfectado",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <CubeIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-blue-700">{row.bienAfectado}</span>
            </div>
        ),
    },
    {
        header: "Motivo",
        accessorKey: "motivo",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">{row.motivo}</span>
            </div>
        ),
    },
    {
        header: "Cantidad",
        accessorKey: "cantidad",
        cell: (row) => (
            <div className="flex justify-center">
                <span className={numberPillClass}>{row.cantidad}</span>
            </div>
        ),
    },
    {
        header: "Stock previo",
        accessorKey: "stockPrevio",
        cell: (row) => (
            <div className="flex justify-center">
                <span className={numberPillClass}>{row.stockPrevio}</span>
            </div>
        ),
    },
    {
        header: "Comentario",
        accessorKey: "comentario",
        cell: (row) => <span className="text-sm text-slate-700">{row.comentario}</span>,
    },
    {
        header: "Creado",
        accessorKey: "creado",
        cell: (row) => <span className="text-sm text-slate-700">{row.creado}</span>,
    },
    {
        header: "Modificado",
        accessorKey: "modificado",
        cell: (row) => <span className="text-sm text-slate-700">{row.modificado}</span>,
    },
    {
        header: "Estado",
        accessorKey: "estado",
        cell: (row) => (
            <span className={`inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass[row.estado]}`}>
                {row.estado}
            </span>
        ),
    },
];

export default function StockMermaView() {
    const router = useRouter();
    const { id } = useParams<{ id?: string | string[] }>();
    const stockId = Array.isArray(id) ? id[0] : id;
    const [headerName, setHeaderName] = useState("");
    const [saving, setSaving] = useState(false);
    const [activeStatus, setActiveStatus] = useState<StatusFilter>("Procesadas");
    const [currentPage, setCurrentPage] = useState(1);
    const [rows, setRows] = useState<MermaRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSave = useCallback(async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 350));
        setSaving(false);
    }, []);

    const loadMermas = useCallback(async (targetStockId: string) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const stockResponse = await fetch(`${WAREHOUSE_STOCK_API}/${encodeURIComponent(targetStockId)}`, {
                method: "GET",
                headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                cache: "no-store",
            });

            if (!stockResponse.ok) throw new Error(`HTTP ${stockResponse.status}`);

            const selectedStock = (await stockResponse.json()) as StockDetailResponse;
            const productName = await fetchProductName(selectedStock.sku);

            const shrinkageResponse = await fetch(
                `${WAREHOUSE_SHRINKAGE_API}?filters[warehouseId]=${encodeURIComponent(selectedStock.warehouse || "")}&filters[skuId]=${encodeURIComponent(selectedStock.sku || "")}`,
                {
                    method: "GET",
                    headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                    cache: "no-store",
                }
            );

            if (!shrinkageResponse.ok) throw new Error(`HTTP ${shrinkageResponse.status}`);

            const payload = (await shrinkageResponse.json()) as ApiShrinkage[] | { shrinkages?: ApiShrinkage[]; data?: ApiShrinkage[]; items?: ApiShrinkage[] };
            const source = getShrinkageList(payload);

            setHeaderName(productName || selectedStock.sku);
            setRows(source.map((shrinkage) => mapMerma(shrinkage, selectedStock, productName)));
        } catch (error: unknown) {
            setHeaderName("");
            setRows([]);
            setErrorMessage(getErrorMessage(error, "No se pudieron cargar las mermas."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!stockId || typeof stockId !== "string") {
            setHeaderName("");
            setRows([]);
            setLoading(false);
            return;
        }

        void loadMermas(stockId);
    }, [stockId, loadMermas]);

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
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Stock</div>
                        <div className="text-2xl font-semibold text-gray-900">{headerName || (stockId ? String(stockId) : "Stock")}</div>
                    </div>
                ),
                action: headerActions,
            } as unknown as PageHeaderProps),
        [headerActions, headerName, stockId]
    );

    const columns = useMemo(() => getColumns(), []);

    const filteredRows = useMemo(() => {
        if (activeStatus === "Procesadas") {
            return rows.filter((row) => row.estado === "Procesada");
        }
        return rows.filter((row) => row.estado === "Pendiente");
    }, [activeStatus, rows]);

    const totalRecords = filteredRows.length;

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    const filters: StatusFilter[] = ["Procesadas", "Pendientes"];

    const handleStatusChange = (next: StatusFilter) => {
        setActiveStatus(next);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[#e8eaf5] p-6">
            <div className="space-y-4">
                <div className="flex items-center gap-2" role="tablist" aria-label="Filtrar merma por estado">
                    {filters.map((status) => {
                        const active = status === activeStatus;
                        return (
                            <button
                                key={status}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                className={[
                                    "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition",
                                    active
                                        ? "border-blue-500 bg-white text-blue-700"
                                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50",
                                ].join(" ")}
                                onClick={() => handleStatusChange(status)}
                            >
                                <span
                                    className={[
                                        "inline-block h-2.5 w-2.5 rounded-full ring-2 transition",
                                        active ? "bg-blue-600 ring-blue-600" : "bg-white ring-slate-300 group-hover:ring-blue-400",
                                    ].join(" ")}
                                />
                                {status}
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
                        Cargando mermas...
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
            </div>
        </div>
    );
}
