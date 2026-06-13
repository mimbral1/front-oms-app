"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowPathIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    MapPinIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { CopyableText } from "@/components/ui/copyable-text";
import {
    CATALOG_PRODUCTS_API,
    WAREHOUSE_STOCK_API,
    WAREHOUSE_STORED_GOOD_API,
} from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

const STOCK_DETAIL_URL = WAREHOUSE_STOCK_API;
const STORED_GOOD_URL = WAREHOUSE_STORED_GOOD_API;
const CATALOG_PRODUCTS_URL = CATALOG_PRODUCTS_API;
const PER_PAGE = 20;

type StockDetailResponse = {
    id: string;
    sku: string;
    warehouse: string;
    warehouseName: string;
    warehouseReferenceId: string;
    status: string;
};

type StoredGoodResponse = {
    id: string;
    type?: string | null;
    warehouseId?: string | null;
    warehouseName?: string | null;
    warehouseReferenceId?: string | null;
    positionId?: string | null;
    positionKey?: string | string[] | null;
    schemaType?: string | string[] | null;
    quantity?: number | null;
    skuId?: string | null;
    dateModified?: string | null;
};

type CatalogProductResponse = {
    Name?: string | null;
    name?: string | null;
};

type StorageRow = {
    id: string;
    inventory: string;
    slot: string;
    slotSchema: string;
    type: string;
    storedGood: string;
    quantity: number;
    modifiedAt: string;
};

const normalize = (value?: string | null) => String(value || "").trim().toLowerCase();

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

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
};

const formatLabel = (value?: string | null) => {
    if (!value) return "-";
    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
};

const getPrimaryValue = (value?: string | string[] | null) => {
    if (Array.isArray(value)) {
        const match = value.find((item) => String(item || "").trim());
        return match ? String(match).trim() : "";
    }

    return String(value || "").trim();
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

const fetchProductName = async (skuId: string) => {
    try {
        const response = await fetch(`${CATALOG_PRODUCTS_URL}/${encodeURIComponent(skuId)}`, {
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

const getStoredGoodList = (payload: StoredGoodResponse[] | { items?: StoredGoodResponse[]; data?: StoredGoodResponse[] }) => {
    if (Array.isArray(payload)) return payload;
    return payload.items || payload.data || [];
};

const getColumns = (): Column<StorageRow>[] => [
    {
        header: "Inventario",
        accessorKey: "inventory",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-slate-500" />
                <span className="text-sm font-medium text-blue-700">{row.inventory}</span>
            </div>
        ),
    },
    {
        header: "Slot",
        accessorKey: "slot",
        cell: (row) => (
            <div className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-5 w-5 text-slate-500" />
                <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-slate-800">{row.slot}</span>
                    {row.slotSchema !== "-" ? <span className="text-xs text-slate-500">{row.slotSchema}</span> : null}
                </div>
            </div>
        ),
    },
    {
        header: "Tipo",
        accessorKey: "type",
        cell: (row) => (
            <span className="inline-flex min-w-[64px] items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                {row.type}
            </span>
        ),
    },
    {
        header: "Bienes almacenados",
        accessorKey: "storedGood",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <CubeIcon className="h-5 w-5 text-slate-500" />
                <span className="text-sm font-medium text-blue-700">
                    <CopyableText text={row.storedGood}>{row.storedGood}</CopyableText>
                </span>
            </div>
        ),
    },
    {
        header: "Cantidad",
        accessorKey: "quantity",
        cell: (row) => (
            <div className="flex justify-center">
                <span className="inline-flex h-8 min-w-[48px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700">
                    {row.quantity}
                </span>
            </div>
        ),
    },
    {
        header: "Modificado",
        accessorKey: "modifiedAt",
        cell: (row) => <span className="text-sm text-slate-700">{row.modifiedAt}</span>,
    },
];

export default function StockAlmacenamientoView() {
    const router = useRouter();
    const { id } = useParams<{ id?: string | string[] }>();
    const stockId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<StockDetailResponse | null>(null);
    const [rows, setRows] = useState<StorageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const load = useCallback(async (targetStockId: string) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const stockResponse = await fetch(`${STOCK_DETAIL_URL}/${encodeURIComponent(targetStockId)}`, {
                method: "GET",
                headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                cache: "no-store",
            });

            if (!stockResponse.ok) {
                throw new Error(`HTTP ${stockResponse.status}`);
            }

            const stock = (await stockResponse.json()) as StockDetailResponse;
            const storedGoodResponse = await fetch(
                `${STORED_GOOD_URL}?filters[warehouseId]=${encodeURIComponent(stock.warehouse || "")}&filters[skuId]=${encodeURIComponent(stock.sku || "")}`,
                {
                    method: "GET",
                    headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                    cache: "no-store",
                }
            );

            if (!storedGoodResponse.ok) {
                throw new Error(`HTTP ${storedGoodResponse.status}`);
            }

            const payload = (await storedGoodResponse.json()) as StoredGoodResponse[] | { items?: StoredGoodResponse[]; data?: StoredGoodResponse[] };
            const storedGoods = getStoredGoodList(payload);
            const productName = stock.sku ? await fetchProductName(stock.sku) : "";
            const inventory = buildInventoryName(stock);

            const mappedRows = storedGoods.map((item) => {
                const skuId = String(item.skuId || stock.sku || "-").trim() || "-";
                const productLabel = productName ? `${skuId} - ${productName}` : skuId;

                return {
                    id: String(item.id || `${skuId}-${item.positionId || item.dateModified || Math.random()}`),
                    inventory,
                    slot: getPrimaryValue(item.positionKey) || "-",
                    slotSchema: formatLabel(getPrimaryValue(item.schemaType)),
                    type: formatLabel(item.type || "sku"),
                    storedGood: productLabel,
                    quantity: Number(item.quantity ?? 0),
                    modifiedAt: formatDate(item.dateModified),
                };
            });

            setRecord(stock);
            setRows(mappedRows);
            setCurrentPage(1);
        } catch (error: unknown) {
            setRecord(null);
            setRows([]);
            setErrorMessage(getErrorMessage(error, "No se pudo cargar el almacenamiento."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!stockId || typeof stockId !== "string") {
            setRecord(null);
            setRows([]);
            setLoading(false);
            return;
        }

        void load(stockId);
    }, [stockId, load]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/stock"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
            ({
                title: (
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Stock</div>
                        <div className="text-2xl font-semibold text-gray-900">{record?.sku || "Almacenamiento"}</div>
                    </div>
                ),
                action: headerActions,
                blocked: record
                    ? { text: record.status !== "active", variant: record.status === "active" ? false : "warning" }
                    : undefined,
            } as unknown as PageHeaderProps),
        [headerActions, record?.sku, record?.status]
    );

    const columns = useMemo(() => getColumns(), []);
    const totalRecords = rows.length;
    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return rows.slice(start, start + PER_PAGE);
    }, [rows, currentPage]);

    return (
        <div className="min-h-screen bg-[#e8eaf5] p-6">
            {errorMessage ? (
                <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm" role="alert">
                    <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-red-400" aria-hidden="true" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">Error al cargar almacenamiento</h3>
                            <p className="mt-2 text-sm">{errorMessage}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (stockId && typeof stockId === "string") void load(stockId);
                                }}
                                className="mt-4 rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center bg-white px-4 py-6 text-center text-sm text-gray-500">
                    <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                    Cargando almacenamiento...
                </div>
            ) : (
                <div className="space-y-4">
                    <DataTable
                        data={pagedRows}
                        columns={columns}
                        dataType="General2"
                        rowPaddingY={16}
                        rowBgClass="bg-white"
                    />

                    <Pagination
                        currentPage={currentPage}
                        totalRecords={totalRecords}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                    />

                    <div className="text-xs text-slate-600">
                        {totalRecords} resultados &nbsp; {PER_PAGE} por pagina
                    </div>
                </div>
            )}
        </div>
    );
}
