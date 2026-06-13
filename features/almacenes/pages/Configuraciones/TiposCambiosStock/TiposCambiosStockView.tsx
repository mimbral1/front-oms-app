// views\Almacen\Configuraciones\TiposCambiosStock.tsx\TiposCambiosStockView.tsx
"use client";

import React, { useMemo, useState, useCallback, KeyboardEvent, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-picker";
import { AdvancedFilterPopover } from "@/components/ui/filters/advanced-filter-popover";
import { StatusBadge, type StatusVariant } from "@/components/ui/badge/status";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

/* ---------- Tipos UI / dominio ---------- */

type MovementKind = "INGRESO" | "SALIDA" | "INTERNO";

interface StockMovementRow {
    id: string; // ID transacción
    kind: MovementKind;
    kindLabel: string; // texto del motivo: "INGR. COMPRA", "SLOTTING", etc.
    kindVariant: StatusVariant;
    sku: string;
    productName: string;
    extraInfo?: string; // Lote / Orden / etc.
    quantity: number;
    originWarehouse: string;
    originDetail?: string;
    destinationWarehouse: string;
    destinationDetail?: string;
    datetime: string; // fecha formateada
    datetimeRaw?: string; // fecha cruda para filtrar por rango
}

type MovementApiRow = {
    id: string;
    displayId?: string;
    type?: string;
    source?: {
        warehouseId?: string;
        warehouseName?: string;
        positionId?: string;
        positionKey?: string;
    };
    destination?: {
        warehouseId?: string;
        warehouseName?: string;
        positionId?: string;
        positionKey?: string;
    };
    content?: {
        skuId?: string;
        quantity?: number;
        orderId?: string;
    };
    status?: string;
    dateEnded?: string | null;
    dateModified?: string | null;
    dateCreated?: string | null;
};

/* ---------- Helpers UI ---------- */

const PER_PAGE = 20;
const MOVEMENT_API_URL = `${BASE_WAREHOUSES}/movement`;

const getQuantityClasses = (qty: number) => {
    if (qty > 0) return "bg-green-100 text-green-800";
    if (qty < 0) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-700";
};

const QuantityBadge: React.FC<{ quantity: number }> = ({ quantity }) => (
    <span
        className={`inline-flex min-w-[72px] justify-center rounded-full px-3 py-1 text-xs font-semibold ${getQuantityClasses(
            quantity
        )}`}
    >
        {quantity > 0 ? `+${quantity}` : quantity}
    </span>
);

const LocationDot: React.FC<{ label: string }> = ({ label }) => (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        {label}
    </div>
);

const getMovementTypeMeta = (type?: string): { kind: MovementKind; label: string; variant: StatusVariant } => {
    const normalized = String(type || "").trim().toLowerCase();

    if (normalized === "picking") {
        return { kind: "SALIDA", label: "Picking", variant: "error" };
    }

    if (normalized === "internaldistribution") {
        return { kind: "INTERNO", label: "Distribucion interna", variant: "info" };
    }

    if (normalized === "replenishment") {
        return { kind: "INTERNO", label: "Reposicion", variant: "warning" };
    }

    if (normalized === "ingress" || normalized === "ingreso") {
        return { kind: "INGRESO", label: "Ingreso", variant: "success" };
    }

    return {
        kind: "INTERNO",
        label: type ? String(type) : "Movimiento",
        variant: "default",
    };
};

const getTypePastelBadgeClass = (variant: StatusVariant) => {
    if (variant === "success") return "border border-green-200 bg-green-100 text-green-800";
    if (variant === "warning") return "border border-amber-200 bg-amber-100 text-amber-800";
    if (variant === "error") return "border border-red-200 bg-red-100 text-red-800";
    if (variant === "info") return "border border-blue-200 bg-blue-100 text-blue-800";
    return "border border-gray-200 bg-gray-100 text-gray-700";
};

const toDisplayDate = (raw?: string | null) => {
    if (!raw) return "-";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

const toIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const getDefaultLastTwoDays = (): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1);
    return {
        start: toIsoDate(start),
        end: toIsoDate(end),
    };
};

const getStatusLabelEs = (status?: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pending") return "Pendiente";
    if (normalized === "ended") return "Finalizado";
    if (normalized === "canceled") return "Cancelado";
    if (normalized === "rejected") return "Rechazado";
    if (normalized === "started") return "Iniciado";
    if (normalized === "picked") return "Recolectado";
    return normalized ? normalized : "Sin estado";
};

const formatDateRangeText = (range: DateRange | null) => {
    if (!range?.start || !range?.end) return "Sin rango";
    const start = new Date(`${range.start}T00:00:00`);
    const end = new Date(`${range.end}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Sin rango";
    return `${start.toLocaleDateString("es-CL")} - ${end.toLocaleDateString("es-CL")}`;
};


/* ---------- Columnas ---------- */

function getColumns(): Column<StockMovementRow>[] {
    return [
        {
            header: "ID transacción",
            accessorKey: "id",
        },
        {
            header: "Tipo / motivo",
            accessorKey: "kindLabel",
            cell: (r) => (
                <div className="flex flex-col gap-1">
                    <StatusBadge
                        status={r.kindLabel}
                        variant={r.kindVariant}
                        fixed
                        className={getTypePastelBadgeClass(r.kindVariant)}
                    />
                </div>
            ),
        },
        {
            header: "SKU / Producto",
            accessorKey: "sku",
            cell: (r) => (
                <div className="flex flex-col">
                    <div className="text-sm font-semibold text-gray-900">{r.sku}</div>
                    <div className="text-sm text-gray-700">{r.productName}</div>
                    {r.extraInfo && <div className="mt-0.5 text-xs text-gray-500">{r.extraInfo}</div>}
                </div>
            ),
        },
        {
            header: "Cantidad",
            accessorKey: "quantity",
            cell: (r) => (
                <div className="flex justify-center">
                    <QuantityBadge quantity={r.quantity} />
                </div>
            ),
        },
        {
            header: "Origen",
            accessorKey: "originWarehouse",
            cell: (r) => (
                <div className="flex flex-col gap-1 text-sm">
                    <LocationDot label={r.originWarehouse} />
                    {r.originDetail && <div className="text-xs text-gray-500">Posición: {r.originDetail}</div>}
                </div>
            ),
        },
        {
            header: "Destino",
            accessorKey: "destinationWarehouse",
            cell: (r) => (
                <div className="flex flex-col gap-1 text-sm">
                    <LocationDot label={r.destinationWarehouse} />
                    {r.destinationDetail && <div className="text-xs text-gray-500">Posición: {r.destinationDetail}</div>}
                </div>
            ),
        },
        {
            header: "Fecha",
            accessorKey: "datetime",
        },
    ];
}

/* ---------- Página ---------- */

type MovementFilterKey = "ingresos" | "salidas" | "internos";

interface TiposCambiosStockViewProps {
    allowedMovementFilters?: MovementFilterKey[];
    defaultMovementFilter?: MovementFilterKey;
    pageTitle?: string;
}

export default function TiposCambiosStockView({
    allowedMovementFilters,
    defaultMovementFilter,
    pageTitle,
}: TiposCambiosStockViewProps = {}) {
    const columns = useMemo(() => getColumns(), []);

    const allPills: { key: MovementFilterKey; label: string; color: "green" | "red" | "amber" }[] = useMemo(
        () => [
            { key: "ingresos", label: "Ingresos", color: "green" },
            { key: "salidas", label: "Salidas / merma", color: "red" },
            { key: "internos", label: "Movimientos internos", color: "amber" },
        ],
        []
    );

    const allowedKeys = useMemo(() => {
        const source = allowedMovementFilters?.length ? allowedMovementFilters : allPills.map((p) => p.key);
        return Array.from(new Set(source));
    }, [allowedMovementFilters, allPills]);

    const pills = useMemo(
        () => allPills.filter((pill) => allowedKeys.includes(pill.key)),
        [allPills, allowedKeys]
    );

    const initialFilter = useMemo<MovementFilterKey>(() => {
        if (defaultMovementFilter && allowedKeys.includes(defaultMovementFilter)) return defaultMovementFilter;
        return (allowedKeys[0] || "ingresos") as MovementFilterKey;
    }, [defaultMovementFilter, allowedKeys]);

    const [rows, setRows] = useState<StockMovementRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [movementFilter, setMovementFilter] = useState<MovementFilterKey>(initialFilter);
    const [warehouseFilter, setWarehouseFilter] = useState<string>("");
    const [skuFilter, setSkuFilter] = useState<string>("");
    const [transactionIdFilter, setTransactionIdFilter] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | null>(null);

    useEffect(() => {
        if (!allowedKeys.includes(movementFilter)) {
            setMovementFilter(initialFilter);
        }
    }, [allowedKeys, movementFilter, initialFilter]);

    const [currentPage, setCurrentPage] = useState(1);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (transactionIdFilter.trim()) count += 1;
        if (skuFilter.trim()) count += 1;
        if (warehouseFilter.trim()) count += 1;
        if (dateRange?.start && dateRange?.end) count += 1;
        return count;
    }, [transactionIdFilter, skuFilter, warehouseFilter, dateRange]);

    const clearAllFilters = useCallback(() => {
        setTransactionIdFilter("");
        setSkuFilter("");
        setWarehouseFilter("");
        setDateRange(null);
        setCurrentPage(1);
    }, []);

    const loadMovements = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await fetch(MOVEMENT_API_URL, {
                method: "GET",
                headers: withAuthPlatformHeaders({
                    "janis-api-key": "test-key",
                    "janis-api-secret": "test-secret",
                    "janis-client": "test-client",
                }),
                cache: "no-store",
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` - ${body}` : ""}`);
            }

            const payload = (await res.json()) as MovementApiRow[];
            const mapped = (payload || []).map<StockMovementRow>((item) => {
                const movementType = getMovementTypeMeta(item.type);
                const rawQty = Number(item.content?.quantity ?? 0);
                const signedQty = movementType.kind === "SALIDA" ? -Math.abs(rawQty) : rawQty;
                const sourceWarehouse = item.source?.warehouseName || item.source?.warehouseId || "-";
                const destinationWarehouse = item.destination?.warehouseName || item.destination?.warehouseId || "-";
                const movementDate = item.dateEnded || item.dateModified || item.dateCreated || "";

                return {
                    id: item.content?.orderId || item.displayId || item.id,
                    kind: movementType.kind,
                    kindLabel: movementType.label,
                    kindVariant: movementType.variant,
                    sku: item.content?.skuId || "-",
                    productName: item.content?.skuId || "-",
                    extraInfo: item.status ? `Estado: ${getStatusLabelEs(item.status)}` : "",
                    quantity: signedQty,
                    originWarehouse: sourceWarehouse,
                    originDetail: item.source?.positionKey || item.source?.positionId || "",
                    destinationWarehouse,
                    destinationDetail: item.destination?.positionKey || item.destination?.positionId || "",
                    datetime: toDisplayDate(movementDate),
                    datetimeRaw: movementDate,
                };
            });

            setRows(mapped);
            setCurrentPage(1);
        } catch (error: any) {
            setRows([]);
            setErrorMessage(error?.message || "Error al cargar movimientos de stock.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMovements();
    }, [loadMovements]);

    const warehouseOptions = useMemo(() => {
        return Array.from(
            new Set(
                rows.flatMap((r) => [r.originWarehouse, r.destinationWarehouse]).filter(Boolean)
            )
        ).sort((a, b) => a.localeCompare(b));
    }, [rows]);

    const filteredRows = useMemo(() => {
        return rows.filter((r) => {
            if (movementFilter === "ingresos" && r.kind !== "INGRESO") return false;
            if (movementFilter === "salidas" && r.kind !== "SALIDA") return false;
            if (movementFilter === "internos" && r.kind !== "INTERNO") return false;

            if (warehouseFilter && r.destinationWarehouse !== warehouseFilter && r.originWarehouse !== warehouseFilter)
                return false;

            if (transactionIdFilter && !r.id.toLowerCase().includes(transactionIdFilter.toLowerCase())) return false;

            if (skuFilter && !r.sku.toLowerCase().includes(skuFilter.toLowerCase())) return false;

            if (dateRange?.start && dateRange?.end) {
                const rowDate = r.datetimeRaw ? new Date(r.datetimeRaw) : null;
                if (!rowDate || Number.isNaN(rowDate.getTime())) return false;

                const start = new Date(`${dateRange.start}T00:00:00`);
                const end = new Date(`${dateRange.end}T23:59:59.999`);

                if (rowDate < start || rowDate > end) return false;
            }

            return true;
        });
    }, [rows, movementFilter, warehouseFilter, transactionIdFilter, skuFilter, dateRange]);

    const totalRecords = filteredRows.length;

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    const netIngresos = useMemo(
        () => filteredRows.reduce((acc, r) => (r.quantity > 0 ? acc + r.quantity : acc), 0),
        [filteredRows]
    );
    const totalSalidas = useMemo(
        () => filteredRows.reduce((acc, r) => (r.quantity < 0 ? acc + r.quantity : acc), 0),
        [filteredRows]
    );

    const showSalidasSummary = useMemo(
        () => allowedKeys.includes("salidas"),
        [allowedKeys]
    );

    const handleExport = useCallback(() => {
        const headers = [
            "ID transacción",
            "Tipo / motivo",
            "SKU",
            "Producto",
            "Información extra",
            "Cantidad",
            "Origen",
            "Detalle origen",
            "Destino",
            "Detalle destino",
            "Fecha",
        ];
        const data = filteredRows.map((r) => [
            r.id,
            r.kindLabel,
            r.sku,
            r.productName,
            r.extraInfo || "",
            r.quantity,
            r.originWarehouse,
            r.originDetail || "",
            r.destinationWarehouse,
            r.destinationDetail || "",
            r.datetime,
        ]);
        exportToCsv("historial-movimientos-stock.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar CSV",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: loadMovements,
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [handleExport, loadMovements]
    );

    const handlePillsKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const order = pills.map((pill) => pill.key);
        if (!order.length) return;
        const idx = order.indexOf(movementFilter);
        if (e.key === "ArrowRight") {
            setMovementFilter(order[(idx + 1) % order.length]);
        }
        if (e.key === "ArrowLeft") {
            setMovementFilter(order[(idx - 1 + order.length) % order.length]);
        }
    };

    const getPillColorClasses = (color: "green" | "red" | "amber", active: boolean) => {
        if (color === "green") {
            return active
                ? "border-emerald-500 bg-white text-emerald-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:bg-gray-50";
        }
        if (color === "red") {
            return active
                ? "border-rose-500 bg-white text-rose-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-rose-400 hover:bg-gray-50";
        }
        return active
            ? "border-amber-500 bg-white text-amber-700"
            : "border-gray-300 bg-white text-gray-700 hover:border-amber-400 hover:bg-gray-50";
    };

    const getPillDotClasses = (color: "green" | "red" | "amber", active: boolean) => {
        if (color === "green") {
            return active ? "bg-emerald-600 ring-emerald-600" : "bg-white ring-gray-300 group-hover:ring-emerald-400";
        }
        if (color === "red") {
            return active ? "bg-rose-600 ring-rose-600" : "bg-white ring-gray-300 group-hover:ring-rose-400";
        }
        return active ? "bg-amber-500 ring-amber-500" : "bg-white ring-gray-300 group-hover:ring-amber-400";
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title={
                    <div>
                        <div className="text-2xl font-semibold text-gray-900">{pageTitle || "Historial de movimientos"}</div>
                    </div>
                }
                description="Vista operacional de cambios de stock por SKU, bodega y motivo de movimiento."
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <section className="space-y-4">
                    {/* Toolbar superior con pills (estilo ItemsView) */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div
                            role="tablist"
                            aria-label="Filtrar por tipo de movimiento"
                            onKeyDown={handlePillsKey}
                            className="flex flex-wrap items-center gap-2"
                        >
                            {pills.map((pill) => {
                                const active = movementFilter === pill.key;
                                return (
                                    <button
                                        key={pill.key}
                                        role="tab"
                                        aria-selected={active}
                                        type="button"
                                        onClick={() => {
                                            setMovementFilter(pill.key);
                                            setCurrentPage(1);
                                        }}
                                        className={[
                                            "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm",
                                            "transition-all focus:outline-none focus:ring-2 focus:ring-blue-200",
                                            getPillColorClasses(pill.color, active),
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                                                getPillDotClasses(pill.color, active),
                                            ].join(" ")}
                                        />
                                        <span className="whitespace-nowrap">{pill.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenido principal en tarjeta blanca */}
                    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                        {/* Header del bloque */}
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Movimientos de stock</h2>
                                {/* <p className="mt-1 text-sm text-gray-500">
                                    Vista operacional de cambios de stock por SKU, bodega y motivo de movimiento.
                                </p> */}
                            </div>
                        </div>

                        {/* Filtros secundarios dentro de la tarjeta */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">ID transacción</span>
                                    <input
                                        type="text"
                                        value={transactionIdFilter}
                                        onChange={(e) => {
                                            setTransactionIdFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="block w-44 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="ID transacción..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">SKU</span>
                                    <input
                                        type="text"
                                        value={skuFilter}
                                        onChange={(e) => {
                                            setSkuFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="block w-44 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="SKU..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Bodega</span>
                                    <select
                                        value={warehouseFilter}
                                        onChange={(e) => {
                                            setWarehouseFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="block w-40 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Todas</option>
                                        {warehouseOptions.map((w) => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-500">Rango</span>
                                    <div className="w-[260px]">
                                        <DateRangeFilter
                                            label="Rango de fechas"
                                            value={dateRange}
                                            onChange={(range) => {
                                                setDateRange(range);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <AdvancedFilterPopover
                                activeCount={activeFilterCount}
                                hasAnyActive={activeFilterCount > 0}
                                onClearAll={clearAllFilters}
                                width="w-[340px]"
                            >
                                <div className="space-y-1 text-xs text-gray-600">
                                    <div>{activeFilterCount > 0 ? `${activeFilterCount} filtros activos` : "Sin filtros avanzados"}</div>
                                    <div>{transactionIdFilter ? `ID: ${transactionIdFilter}` : "ID: Todos"}</div>
                                    <div>{skuFilter ? `SKU: ${skuFilter}` : "SKU: Todos"}</div>
                                    <div>{warehouseFilter || "Bodega: Todas"}</div>
                                    <div>{`Rango: ${formatDateRangeText(dateRange)}`}</div>
                                </div>
                            </AdvancedFilterPopover>
                        </div>

                        {/* Tabla + footer */}
                        <div className="px-6 pb-4 pt-2">
                            {loading ? (
                                <div className="py-6 text-sm text-gray-500">
                                    Cargando movimientos...
                                </div>
                            ) : errorMessage ? (
                                <div className="py-6 text-sm text-red-600">
                                    {errorMessage}
                                </div>
                            ) : (
                                <DataTable
                                    data={pagedRows}
                                    columns={columns}
                                    dataType="General2"
                                    rowPaddingY={12}
                                    rowBgClass="bg-white"
                                    showStatusBorder={false}
                                />
                            )}

                            {/* Resumen de totales */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="font-medium text-gray-700">
                                            Ingresos netos:&nbsp;
                                            <span className="text-green-700">
                                                {netIngresos >= 0 ? `+${netIngresos}` : netIngresos} uds
                                            </span>
                                        </span>
                                    </div>
                                    {showSalidasSummary && (
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-red-500" />
                                            <span className="font-medium text-gray-700">
                                                Salidas / merma:&nbsp;
                                                <span className="text-red-700">{totalSalidas} uds</span>
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                                        Transacciones:&nbsp;
                                        <span className="font-semibold">{totalRecords}</span>
                                    </div>
                                </div>
                                {/* Paginación */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalRecords={totalRecords}
                                    pageSize={PER_PAGE}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
