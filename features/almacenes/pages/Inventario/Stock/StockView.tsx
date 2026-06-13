// views/Almacen/Inventario/StockView.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Avatar } from "@/components/ui/user-avatar";
import { GeneralStatusBadge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { inventoryListStocksPage, type JanisStockListItem } from "@/app/fetchWithAuth/api-inventory/inventory";
import { CATALOG_PRODUCTS_API } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type Filters = {
    sku: string;
    inventario: string;
    stock: string;
};

type StockApiRow = {
    id: string;
    itemSku: string;
    warehouseCode: string;
    warehouseName: string;
    onHandQty: number;
    salesCommitQty: number;
    reservedPhysicalQty: number;
    purchaseOrdQty: number;
    status: string;
    infiniteStock: boolean;
    safetyStock: number;
    availableStock: number;
    updatedAt: string;
    userModified: string;
};

type StockRow = {
    id: string;
    sku: string;
    inventario: string;
    inventarioCode: string;
    onHand: number;
    safety: number;
    reservado_fisico: number;
    reservado_contable: number;
    disponible: number;
    proyectado: number;
    infinito: boolean;
    updatedAt: string;
    usuarioModificador: string;
    status: string;
};

const PER_PAGE = 10;
const STOCK_FETCH_PAGE_SIZE = 100;
const STOCK_FETCH_FALLBACK_PAGE_SIZES = [100, 50, 25];
const CATALOG_PRODUCTS_URL = CATALOG_PRODUCTS_API;

const initialFilters: Filters = {
    sku: "",
    inventario: "",
    stock: "",
};

export default function StockView() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [stockRows, setStockRows] = useState<StockApiRow[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [productNames, setProductNames] = useState<Record<string, string>>({});
    const fetchedSkusRef = useRef<string>("");
    const fetchRunRef = useRef(0);
    const stockAbortRef = useRef<AbortController | null>(null);
    const catalogFetchDisabledRef = useRef(false);

    const getFriendlyStockError = useCallback((error: unknown): string => {
        const message = error instanceof Error ? error.message : String(error || "");

        if (
            /failed to fetch|networkerror|connection|timed out|timeout|ERR_CONNECTION_TIMED_OUT|gateway timeout|\b504\b/i.test(
                message,
            )
        ) {
            return "No se pudo conectar con API de stock (NEXT_PUBLIC_URL_BASE). Verifica red, VPN o que el servicio este levantado.";
        }

        return message || "Error al cargar API de stock.";
    }, []);

    const mapStockRows = useCallback((payload: JanisStockListItem[]): StockApiRow[] => {
        return (payload || []).map((row) => ({
            id: row.id,
            itemSku: row.sku,
            warehouseCode: row.warehouseReferenceId || row.warehouse,
            warehouseName: row.warehouseName || row.warehouseReferenceId || row.warehouse,
            onHandQty: row.stock ?? 0,
            salesCommitQty: row.reservedStock ?? 0,
            reservedPhysicalQty: row.reservedPhysicalStock ?? 0,
            purchaseOrdQty: row.inTransit ?? 0,
            status: row.status || "unknown",
            infiniteStock: !!row.infiniteStock,
            safetyStock: row.securityStock ?? 0,
            availableStock: row.availableStock ?? 0,
            updatedAt: row.dateModified || "",
            userModified: row.userModified || "",
        }));
    }, []);

    const fetchStockPageWithFallback = useCallback(
        async (page: number, signal: AbortSignal) => {
            let lastError: unknown = null;

            for (const pageSize of STOCK_FETCH_FALLBACK_PAGE_SIZES) {
                try {
                    const batch = await inventoryListStocksPage({
                        page,
                        pageSize,
                        signal,
                    });

                    return { batch, pageSize };
                } catch (error: unknown) {
                    if (signal.aborted || (error instanceof Error && error.name === "AbortError")) {
                        throw error;
                    }

                    const status =
                        typeof error === "object" && error !== null && "status" in error
                            ? (error as { status?: number }).status
                            : undefined;
                    const msg = getFriendlyStockError(error);
                    const isGatewayTimeout = status === 504 || /gateway timeout|\b504\b/i.test(msg);

                    if (!isGatewayTimeout) {
                        throw error;
                    }

                    lastError = error;
                }
            }

            throw lastError ?? new Error("HTTP 504");
        },
        []
    );

    const fetchStocks = useCallback(async () => {
        stockAbortRef.current?.abort();
        const controller = new AbortController();
        stockAbortRef.current = controller;

        const runId = fetchRunRef.current + 1;
        fetchRunRef.current = runId;
        catalogFetchDisabledRef.current = false;
        setLoading(true);
        setErrorMessage(null);

        try {
            const first = await fetchStockPageWithFallback(1, controller.signal);
            const firstPage = first.batch;
            const effectivePageSize = first.pageSize || STOCK_FETCH_PAGE_SIZE;

            if (fetchRunRef.current !== runId) return;

            setStockRows(mapStockRows(firstPage));
            setLoading(false);

            if (firstPage.length < effectivePageSize) return;

            const allRows = [...firstPage];
            const seenIds = new Set(firstPage.map((item) => item.id));
            let pageSizeInUse = effectivePageSize;

            for (let page = 2; page <= 200; page += 1) {
                let batch: JanisStockListItem[] = [];

                try {
                    const next = await fetchStockPageWithFallback(page, controller.signal);
                    batch = next.batch;
                    pageSizeInUse = next.pageSize;
                } catch (error: unknown) {
                    if (
                        controller.signal.aborted ||
                        (error instanceof Error && error.name === "AbortError")
                    ) {
                        return;
                    }
                    setErrorMessage(
                        "Se cargaron datos parciales de stock. Algunas paginas no pudieron obtenerse por timeout del servicio.",
                    );
                    break;
                }

                if (fetchRunRef.current !== runId) return;
                if (batch.length === 0) break;

                const newItems = batch.filter((item) => {
                    if (!item.id) return true;
                    if (seenIds.has(item.id)) return false;
                    seenIds.add(item.id);
                    return true;
                });

                if (newItems.length === 0) break;

                allRows.push(...newItems);
                setStockRows(mapStockRows(allRows));

                if (batch.length < pageSizeInUse) break;
            }
        } catch (error: unknown) {
            if (
                controller.signal.aborted ||
                (error instanceof Error && error.name === "AbortError")
            ) {
                return;
            }
            if (fetchRunRef.current !== runId) return;
            setStockRows([]);
            setErrorMessage(getFriendlyStockError(error));
        } finally {
            if (fetchRunRef.current !== runId) return;
            setLoading(false);
        }
    }, [fetchStockPageWithFallback, getFriendlyStockError, mapStockRows]);

    useEffect(() => {
        void fetchStocks();

        return () => {
            stockAbortRef.current?.abort();
        };
    }, [fetchStocks]);

    useEffect(() => {
        if (stockRows.length === 0 || catalogFetchDisabledRef.current) return;

        const uniqueSkus = Array.from(new Set(stockRows.map((row) => row.itemSku).filter(Boolean)));
        const skuKey = uniqueSkus.sort().join(",");
        if (skuKey === fetchedSkusRef.current) return;

        const skuSet = new Set(uniqueSkus);
        const nameMap: Record<string, string> = {};
        const BATCH_SIZE = 10;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            fetchedSkusRef.current = skuKey;

            (async () => {
                try {
                    const firstRes = await fetch(`${CATALOG_PRODUCTS_URL}?page=1&pageSize=100`, {
                        method: "GET",
                        headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                        cache: "no-store",
                        signal: controller.signal,
                    });
                    if (!firstRes.ok) {
                        if (firstRes.status >= 500) catalogFetchDisabledRef.current = true;
                        return;
                    }
                    const firstPayload = await firstRes.json();
                    const totalPages: number = firstPayload.totalPages || 1;

                    for (const product of firstPayload.data || []) {
                        if (product.ItemCode && skuSet.has(product.ItemCode)) nameMap[product.ItemCode] = product.Name || "";
                    }
                    if (Object.keys(nameMap).length >= skuSet.size) {
                        setProductNames({ ...nameMap });
                        return;
                    }

                    for (let batchStart = 2; batchStart <= totalPages; batchStart += BATCH_SIZE) {
                        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
                        const promises = [];
                        for (let page = batchStart; page <= batchEnd; page++) {
                            promises.push(
                                fetch(`${CATALOG_PRODUCTS_URL}?page=${page}&pageSize=100`, {
                                    method: "GET",
                                    headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
                                    cache: "no-store",
                                    signal: controller.signal,
                                }).then((response) => (response.ok ? response.json() : null))
                            );
                        }
                        const results = await Promise.all(promises);
                        for (const payload of results) {
                            if (!payload) continue;
                            for (const product of payload.data || []) {
                                if (product.ItemCode && skuSet.has(product.ItemCode)) nameMap[product.ItemCode] = product.Name || "";
                            }
                        }
                        if (Object.keys(nameMap).length >= skuSet.size) break;
                    }
                } catch (error: unknown) {
                    if (
                        controller.signal.aborted ||
                        (error instanceof Error && error.name === "AbortError")
                    ) {
                        return;
                    }
                    catalogFetchDisabledRef.current = true;
                    console.error("Error fetching product names:", error);
                }
                setProductNames({ ...nameMap });
            })();
        }, 350);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [stockRows]);

    const allInventarios = useMemo(() => {
        return Array.from(new Set(stockRows.map((row) => row.warehouseCode).filter(Boolean))).sort((left, right) =>
            left.localeCompare(right)
        );
    }, [stockRows]);

    const rows: StockRow[] = useMemo(() => {
        return stockRows.map((row) => {
            const onHand = row.onHandQty ?? 0;
            const reservado_fisico = row.reservedPhysicalQty ?? 0;
            const disponible = row.availableStock ?? 0;

            return {
                id: row.id,
                sku: row.itemSku,
                inventario: row.warehouseName || "",
                inventarioCode: row.warehouseCode || "",
                onHand,
                safety: row.safetyStock ?? 0,
                reservado_fisico,
                reservado_contable: row.salesCommitQty ?? 0,
                disponible,
                proyectado: 0,
                infinito: !!row.infiniteStock,
                updatedAt: row.updatedAt || "",
                usuarioModificador: row.userModified || "Sistema",
                status: row.status || "unknown",
            };
        });
    }, [stockRows]);

    const filterConfig = useMemo<FilterConfig<Filters, StockRow>[]>(
        () => [
            {
                id: "sku",
                label: "SKU",
                type: "text",
                placeholder: "SKU",
                match: (row, value) => {
                    const term = String(value ?? "").trim().toLowerCase();
                    if (!term) return true;
                    const name = (productNames[row.sku] || "").toLowerCase();
                    return row.sku.toLowerCase().includes(term) || name.includes(term);
                },
            },
            {
                id: "inventario",
                label: "Inventario",
                type: "select-search",
                placeholder: "Buscar inventario...",
                options: allInventarios.map((value) => ({ label: value, value })),
                rowValue: (row) => row.inventarioCode,
            },
            {
                id: "stock",
                label: "Stock",
                type: "text",
                placeholder: "Stock",
                match: (row, value) => {
                    const term = String(value ?? "").trim().toLowerCase();
                    if (!term) return true;
                    const blob = `${row.onHand} ${row.safety} ${row.reservado_fisico} ${row.disponible} ${row.status} ${row.infinito ? "si" : "no"}`
                        .toLowerCase();
                    return blob.includes(term);
                },
            },
        ],
        [allInventarios, productNames]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, StockRow>({
            initialFilters,
            configs: filterConfig,
        });

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

    const columns = useMemo<Column<StockRow>[]>(
        () => [
            {
                header: "SKU",
                accessorKey: "sku",
                cell: (row: StockRow) => {
                    const name = productNames[row.sku];
                    const label = name ? `${row.sku} - ${name}` : row.sku;
                    return <CopyableText text={row.sku}>{label}</CopyableText>;
                },
            },
            {
                header: "INVENTARIO",
                accessorKey: "inventario",
                cell: (row: StockRow) => (
                    <div className="flex max-w-[260px] flex-col gap-1">
                        <span className="truncate text-sm font-semibold text-gray-800">{row.inventario || "Sin inventario"}</span>
                        <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            Cod: {row.inventarioCode || "-"}
                        </span>
                    </div>
                ),
            },
            {
                header: "STOCK",
                accessorKey: "onHand",
                cell: (row: StockRow) => (
                    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {row.onHand}
                    </span>
                ),
            },
            {
                header: "STOCK DE SEGURIDAD",
                accessorKey: "safety",
                cell: (row: StockRow) => (
                    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {row.safety}
                    </span>
                ),
            },
            {
                header: "RESERVADO FISICO",
                accessorKey: "reservado_fisico",
                cell: (row: StockRow) => (
                    <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        {row.reservado_fisico}
                    </span>
                ),
            },
            {
                header: "RESERVADO CONTABLE",
                accessorKey: "reservado_contable",
                cell: (row: StockRow) => (
                    <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {row.reservado_contable}
                    </span>
                ),
            },
            {
                header: "STOCK DISPONIBLE",
                accessorKey: "disponible",
                cell: (row: StockRow) => (
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {row.disponible}
                    </span>
                ),
            },
            {
                header: "STOCK PROYECTADO",
                accessorKey: "proyectado",
                cell: (row: StockRow) => (
                    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {row.proyectado}
                    </span>
                ),
            },
            {
                header: "STOCK INFINITO",
                accessorKey: "infinito",
                cell: (row: StockRow) => (
                    <GeneralStatusBadge
                        status={row.infinito ? "Si" : "No"}
                        variant={row.infinito ? "success" : "Inactive"}
                        className="px-3 py-1 text-xs"
                    />
                ),
            },
            {
                header: "USUARIO MODIFICADOR",
                accessorKey: "usuarioModificador",
                cell: (row: StockRow) => {
                    const hasDate = !!row.updatedAt;
                    const date = hasDate ? new Date(row.updatedAt) : null;
                    const dateLabel = date
                        ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
                        : "Sin fecha";

                    return (
                        <div className="inline-flex max-w-[280px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
                            <Avatar
                                name={row.usuarioModificador || "Sistema"}
                                alt={row.usuarioModificador || "Sistema"}
                                className="h-8 w-8"
                            />
                            <div className="flex min-w-0 flex-col text-left">
                                <span className="truncate text-sm font-medium text-gray-800">
                                    {row.usuarioModificador || "Sistema"}
                                </span>
                                <span className="truncate text-xs text-gray-500">{dateLabel}</span>
                            </div>
                        </div>
                    );
                },
            },
            {
                header: "ESTADO",
                accessorKey: "status",
                cell: (row: StockRow) => {
                    const label = row.status || "unknown";

                    return (
                        <GeneralStatusBadge
                            status={label}
                            className="px-3 py-1 text-xs"
                            customVariants={{
                                active: "bg-green-100 text-green-700",
                                inactive: "bg-amber-100 text-amber-700",
                                blocked: "bg-amber-100 text-amber-700",
                            }}
                        />
                    );
                },
            },
        ],
        [productNames]
    );

    const headerActions = useMemo(
        () => [
            { label: "Reintentar proceso", variant: "error" as const, onClick: () => fetchStocks(), icon: <ArrowPathIcon className="h-5 w-5" /> },
            { label: "Nuevo", variant: "success" as const, onClick: () => router.push("/almacen/inventario/stock/nuevo"), icon: <PlusIcon className="h-5 w-5" /> },
            {
                label: "Exportar",
                variant: "primary" as const,
                onClick: () => {
                    const headers = [
                        "SKU",
                        "INVENTARIO",
                        "CODIGO INVENTARIO",
                        "STOCK",
                        "STOCK DE SEGURIDAD",
                        "RESERVADO FISICO",
                        "RESERVADO CONTABLE",
                        "STOCK DISPONIBLE",
                        "STOCK PROYECTADO",
                        "STOCK INFINITO",
                        "USUARIO MODIFICADOR",
                        "ESTADO",
                    ];
                    const data = filteredRows.map((row) => [
                        productNames[row.sku] ? `${row.sku} - ${productNames[row.sku]}` : row.sku,
                        row.inventario,
                        row.inventarioCode,
                        row.onHand,
                        row.safety,
                        row.reservado_fisico,
                        row.reservado_contable,
                        row.disponible,
                        row.proyectado,
                        row.infinito ? "Si" : "No",
                        row.usuarioModificador,
                        row.status,
                    ]);
                    exportToCsv("stock.csv", [headers, ...data]);
                },
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            { label: "Importar", variant: "secondary" as const, onClick: () => { }, icon: <ArrowUpTrayIcon className="h-5 w-5" /> },
        ],
        [fetchStocks, filteredRows, productNames, router]
    );

    const totalRows = filteredRows.length;
    const startIndex = (currentPage - 1) * PER_PAGE;
    const endIndex = Math.min(startIndex + PER_PAGE, totalRows);
    const pageRows = filteredRows.slice(startIndex, endIndex);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRows / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRows]);

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Stock"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="rounded-md border bg-white">
                            <Loader label="Cargando stock..." className="py-10" />
                        </div>
                    ) : errorMessage ? (
                        <div
                            className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon
                                        className="h-5 w-5 text-red-400"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">
                                        Error al cargar datos de stock
                                    </h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
                                    <div className="mt-4">
                                        <div className="-mx-2 -my-1.5 flex">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setErrorMessage(null);
                                                    void fetchStocks();
                                                }}
                                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : pageRows.length === 0 ? (
                        <div className="rounded-md border bg-white">
                            <EmptyState
                                title="No hay stock para mostrar"
                                description="Ajusta los filtros o vuelve a cargar para consultar nuevamente el endpoint."
                            />
                        </div>
                    ) : (
                        <DataTable
                            data={pageRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            showStatusBorder
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            onRowClick={(row: StockRow) => {
                                router.push(
                                    `/almacen/inventario/stock/${encodeURIComponent(row.id)}/resumen`
                                );
                            }}
                        />
                    )}

                    {!errorMessage ? (
                        <Pagination
                            currentPage={currentPage}
                            totalRecords={totalRows}
                            pageSize={PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
