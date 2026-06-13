// views/Logistica/Entregas/SeguiemientoEntregasView.tsx
"use client";
import { WAREHOUSE_API_BASE } from "@/lib/delivery-api";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    TruckIcon,
    EyeIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { fetchJson, useFetchWithAuth, useFetchWithAuthDelivery } from "@/lib/http/client";
import { WAREHOUSE_API } from "@/lib/http/endpoints";

/* ---------- Tipos UI ---------- */
type Row = {
    warehouseId: string;
    inventario: string;
    totales: number;
    pendiente: number;
    paraEntrega: number;
    paraEntregaDetalle?: string;
    inicio: number;
    entregado: number;
    entregadoDetalle?: string;
    noEntregado: number;
    tiempoMedio: string;
    drivers: number;
    carrierIds: string[];
    deliveryTypes: string[];
    shippingDates: string[];
};

type DriverRow = {
    carrierId: string;
    nombre: string;
    totales: number;
    pendiente: number;
    paraEntrega: number;
    inicio: number;
    entregado: number;
    noEntregado: number;
    tiempo: string;
};

type ApiWarehouseItem = {
    id?: string | null;
    _id?: string | null;
    warehouseId?: string | null;
    name?: string | null;
    fullname?: string | null;
    referenceId?: string | null;
    refId?: string | null;
};

type ApiCarrierItem = {
    id?: string | null;
    _id?: string | null;
    carrierId?: string | null;
    name?: string | null;
    fullname?: string | null;
    businessName?: string | null;
    companyName?: string | null;
    refId?: string | null;
};

type ApiShippingItem = {
    id?: string | null;
    refId?: string | null;
    carrierId?: string | null;
    type?: string | null;
    status?: string | null;
    readyForPickup?: boolean | null;
    routePending?: boolean | null;
    receiverFullname?: string | null;
    dropoffCity?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
};

type ApiPaginated<T> = {
    data?: T[] | null;
    rows?: T[] | null;
    items?: T[] | null;
};

const extractList = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (!payload || typeof payload !== "object") return [];

    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.rows, record.items];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate as T[];
        if (candidate && typeof candidate === "object") {
            const nested = candidate as Record<string, unknown>;
            if (Array.isArray(nested.data)) return nested.data as T[];
            if (Array.isArray(nested.rows)) return nested.rows as T[];
            if (Array.isArray(nested.items)) return nested.items as T[];
        }
    }

    return [];
};

const getWarehouseId = (warehouse: ApiWarehouseItem): string =>
    String(warehouse.id ?? warehouse._id ?? warehouse.warehouseId ?? "").trim();

const getWarehouseLabel = (warehouse: ApiWarehouseItem): string => {
    const reference = String(warehouse.referenceId ?? warehouse.refId ?? "-").trim() || "-";
    const name = String(warehouse.name ?? warehouse.fullname ?? "Sin nombre").trim() || "Sin nombre";

    if (reference === "-" || !name) {
        return name || reference;
    }

    const normalizedName = name.toLowerCase();
    const normalizedReference = reference.toLowerCase();

    // Some warehouses already include the reference in the display name.
    if (normalizedName.includes(normalizedReference)) {
        return name;
    }

    return `${reference} - ${name}`;
};

const getCarrierId = (carrier: ApiCarrierItem): string =>
    String(carrier.id ?? carrier._id ?? carrier.carrierId ?? "").trim();

const getCarrierLabel = (carrier: ApiCarrierItem): string => {
    return (
        String(
            carrier.name ??
            carrier.fullname ??
            carrier.businessName ??
            carrier.companyName ??
            carrier.refId ??
            carrier.id ??
            ""
        ).trim() || "Sin carrier"
    );
};

const bubbleToneClasses: Record<string, string> = {
    neutral: "ring-1 ring-inset ring-gray-300 bg-white text-gray-700",
    total: "ring-1 ring-inset ring-indigo-300 bg-indigo-50 text-indigo-700",
    warning: "ring-1 ring-inset ring-yellow-300 bg-yellow-50 text-yellow-700",
    dispatch: "ring-1 ring-inset ring-orange-300 bg-orange-50 text-orange-700",
    info: "ring-1 ring-inset ring-blue-300 bg-blue-50 text-blue-700",
    success: "ring-1 ring-inset ring-emerald-300 bg-emerald-50 text-emerald-700",
    error: "ring-1 ring-inset ring-red-300 bg-red-50 text-red-700",
    drivers: "ring-1 ring-inset ring-violet-300 bg-violet-50 text-violet-700"
};

/* ---------- Helpers UI ---------- */
const Bubble = ({
    text,
    emphasized = false,
    tone = "neutral"
}: {
    text: string;
    emphasized?: boolean;
    tone?: "neutral" | "total" | "warning" | "dispatch" | "info" | "success" | "error" | "drivers";
}) => {
    const toneClass = bubbleToneClasses[tone] ?? bubbleToneClasses.neutral;

    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                emphasized
                    ? "ring-1 ring-inset ring-blue-300 text-blue-600 bg-blue-50"
                    : toneClass,
            ].join(" ")}
        >
            {text}
        </span>
    );
};

const centerHeader = (label: string) => (
    <span className="block w-full text-center">{label}</span>
);

const centeredCell = (
    content: React.ReactNode,
    detail?: React.ReactNode,
    detailClassName = "text-xs text-gray-500"
) => (
    <div className="grid min-h-[58px] w-full grid-rows-[32px_18px] items-center justify-items-center text-center">
        <div className="flex h-8 items-center justify-center">{content}</div>
        <div className={`flex h-[18px] items-start justify-center ${detailClassName}`}>
            {detail ?? <span className="invisible">-</span>}
        </div>
    </div>
);

const leftCell = (content: React.ReactNode) => (
    <div className="grid min-h-[58px] w-full grid-rows-[32px_18px] items-center text-left">
        <div className="flex h-8 items-center">{content}</div>
        <div className="h-[18px]">
            <span className="invisible">-</span>
        </div>
    </div>
);

/* ---------- Columnas tabla izquierda (inventarios) ---------- */
function getColumns(
    onViewDrivers: (row: Row) => void,
    selectedWarehouseId: string | null
): Column<Row>[] {
    return [
        {
            header: centerHeader("Inventario"),
            accessorKey: "inventario",
            cell: (r) => leftCell(<span>{r.inventario}</span>)
        },
        {
            header: centerHeader("Totales"),
            accessorKey: "totales",
            cell: (r) => centeredCell(<Bubble text={String(r.totales)} tone="total" />)
        },
        {
            header: centerHeader("Pendiente"),
            accessorKey: "pendiente",
            cell: (r) => centeredCell(<Bubble text={String(r.pendiente)} tone="warning" />)
        },
        {
            header: centerHeader("Para entrega"),
            accessorKey: "paraEntrega",
            cell: (r) =>
                centeredCell(
                    <Bubble text={String(r.paraEntrega)} tone="dispatch" />,
                    r.paraEntregaDetalle ? <span className="whitespace-nowrap">{r.paraEntregaDetalle}</span> : undefined,
                    "text-xs text-gray-600"
                )
        },
        {
            header: centerHeader("Inicio"),
            accessorKey: "inicio",
            cell: (r) => centeredCell(<Bubble text={String(r.inicio)} tone="info" />)
        },
        {
            header: centerHeader("Entregado"),
            accessorKey: "entregado",
            cell: (r) =>
                centeredCell(
                    <Bubble text={String(r.entregado)} tone="success" />,
                    r.entregadoDetalle ? <span className="whitespace-nowrap">{r.entregadoDetalle}</span> : undefined,
                    "text-xs text-green-600"
                )
        },
        {
            header: centerHeader("No entregado"),
            accessorKey: "noEntregado",
            cell: (r) => centeredCell(<Bubble text={String(r.noEntregado)} tone="error" />)
        },
        {
            header: centerHeader("Tiempo medio"),
            accessorKey: "tiempoMedio",
            cell: (r) =>
                centeredCell(
                    r.tiempoMedio ? (
                        <Bubble text={r.tiempoMedio} tone="info" />
                    ) : (
                        <span className="text-sm text-gray-400">-</span>
                    )
                )
        },
        {
            header: centerHeader("Drivers"),
            accessorKey: "drivers",
            cell: (r) => centeredCell(<Bubble text={String(r.drivers)} tone="drivers" />)
        },
        {
            header: centerHeader(""),
            accessorKey: "drivers",
            cell: (r) => {
                const isSelected = selectedWarehouseId === r.warehouseId;
                return (
                    centeredCell(
                        <button
                            type="button"
                            onClick={() => onViewDrivers(r)}
                            className={[
                                "inline-flex items-center justify-center rounded-full border px-2 py-1",
                                isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-600"
                                    : "border-gray-300 bg-white text-gray-500 hover:bg-gray-100",
                            ].join(" ")}
                            aria-label="Ver detalle de drivers"
                        >
                            <EyeIcon
                                className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-gray-400"
                                    }`}
                            />
                        </button>
                    )
                );
            }
        },
    ];
}

function getCompactColumns(
    onViewDrivers: (row: Row) => void,
    selectedWarehouseId: string | null
): Column<Row>[] {
    return [
        {
            header: centerHeader("Inventario"),
            accessorKey: "inventario",
            cell: (r) => leftCell(<span>{r.inventario}</span>)
        },
        {
            header: centerHeader("Totales"),
            accessorKey: "totales",
            cell: (r) => centeredCell(<Bubble text={String(r.totales)} tone="total" />)
        },
        {
            header: centerHeader(""),
            accessorKey: "drivers",
            cell: (r) => {
                const isSelected = selectedWarehouseId === r.warehouseId;
                return (
                    centeredCell(
                        <button
                            type="button"
                            onClick={() => onViewDrivers(r)}
                            className={[
                                "inline-flex h-8 w-8 items-center justify-center rounded-full border",
                                isSelected
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300 bg-white hover:bg-gray-100",
                            ].join(" ")}
                            aria-label="Ver detalle de drivers"
                        >
                            <EyeIcon
                                className={`h-4 w-4 ${isSelected ? "text-blue-600" : "text-gray-400"
                                    }`}
                            />
                        </button>
                    )
                );
            }
        },
    ];
}

/* ---------- Columnas tabla derecha (drivers) ---------- */
function getDriverColumns(): Column<DriverRow>[] {
    return [
        {
            header: centerHeader("Carrier"),
            accessorKey: "nombre",
            cell: (r) => centeredCell(<span>{r.nombre}</span>)
        },
        {
            header: centerHeader("Totales"),
            accessorKey: "totales",
            cell: (r) => centeredCell(<Bubble text={String(r.totales)} tone="total" />)
        },
        {
            header: centerHeader("Pendiente"),
            accessorKey: "pendiente",
            cell: (r) => centeredCell(<Bubble text={String(r.pendiente)} tone="warning" />)
        },
        {
            header: centerHeader("Para entrega"),
            accessorKey: "paraEntrega",
            cell: (r) => centeredCell(<Bubble text={String(r.paraEntrega)} tone="dispatch" />)
        },
        {
            header: centerHeader("Inicio"),
            accessorKey: "inicio",
            cell: (r) => centeredCell(<Bubble text={String(r.inicio)} tone="info" />)
        },
        {
            header: centerHeader("Entregado"),
            accessorKey: "entregado",
            cell: (r) => centeredCell(<Bubble text={String(r.entregado)} tone="success" />)
        },
        {
            header: centerHeader("No entregado"),
            accessorKey: "noEntregado",
            cell: (r) => centeredCell(<Bubble text={String(r.noEntregado)} tone="error" />)
        },
        {
            header: centerHeader("Time"),
            accessorKey: "tiempo",
            cell: (r) => centeredCell(<Bubble text={r.tiempo} tone="info" />)
        }
    ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
    dateRange: string; // JSON DateRange | ""
    almacen: string;
    transportista: string;
    tipoEntrega: string;
}

const INITIAL_FILTERS: Filters = {
    dateRange: "",
    almacen: "",
    transportista: "",
    tipoEntrega: ""
};

const parseDateRange = (raw: string): { start: string; end: string } | null => {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { start?: string; end?: string };
        if (!parsed.start || !parsed.end) return null;
        return { start: parsed.start, end: parsed.end };
    } catch {
        return null;
    }
};

const toTimestamp = (value?: string | null): number | null => {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const uniqueValues = (values: Array<string | null | undefined>) =>
    Array.from(
        new Set(
            values
                .map((value) => String(value ?? "").trim())
                .filter(Boolean)
        )
    );

const filterShippingsForMetrics = (
    shippings: ApiShippingItem[],
    filters: Filters
) => {
    const dateRange = parseDateRange(filters.dateRange);
    const fromTimestamp = dateRange
        ? toTimestamp(`${dateRange.start}T00:00:00`)
        : null;
    const toTimestampValue = dateRange
        ? toTimestamp(`${dateRange.end}T23:59:59.999`)
        : null;

    return shippings.filter((shipping) => {
        if (filters.transportista && shipping.carrierId !== filters.transportista) {
            return false;
        }

        if (filters.tipoEntrega && String(shipping.type ?? "").trim() !== filters.tipoEntrega) {
            return false;
        }

        if (fromTimestamp === null && toTimestampValue === null) {
            return true;
        }

        const shippingTimestamp = toTimestamp(shipping.dateCreated);
        if (shippingTimestamp === null) {
            return false;
        }

        if (fromTimestamp !== null && shippingTimestamp < fromTimestamp) {
            return false;
        }

        if (toTimestampValue !== null && shippingTimestamp > toTimestampValue) {
            return false;
        }

        return true;
    });
};

const buildFilterConfig = (
    warehouseOptions: Array<{ label: string; value: string }>,
    carrierOptions: Array<{ label: string; value: string }>,
    deliveryTypeOptions: Array<{ label: string; value: string }>
): FilterConfig<Filters, Row>[] => [
        {
            id: "dateRange",
            label: "Rango de entrega",
            type: "date-range",
            match: (row, value) => {
                const dateRange = parseDateRange(String(value ?? ""));
                if (!dateRange) return true;

                return row.shippingDates.some((dateValue) => {
                    const rowDate = dateValue.slice(0, 10);
                    return rowDate >= dateRange.start && rowDate <= dateRange.end;
                });
            },
        },
        {
            id: "almacen",
            label: "Almacén",
            type: "select",
            options: warehouseOptions,
            rowValue: (row) => row.warehouseId,
        },
        {
            id: "transportista",
            label: "Transportista",
            type: "select",
            options: carrierOptions,
            rowValue: (row) => row.carrierIds,
        },
        {
            id: "tipoEntrega",
            label: "Tipo de entrega",
            type: "select",
            options: deliveryTypeOptions,
            rowValue: (row) => row.deliveryTypes,
        },
    ];

/* ---------- Paginación ---------- */
const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

const PER_PAGE = 25;
const DETAIL_PER_PAGE = 10;

const DELIVERED_STATUSES = new Set(["delivered"]);
const IN_PROGRESS_STATUSES = new Set(["started", "in_progress", "arrived"]);
const NOT_DELIVERED_STATUSES = new Set(["no_delivered", "not_delivered", "failed", "cancelled"]);

const toMinutes = (dateFrom?: string | null, dateTo?: string | null): number | null => {
    if (!dateFrom || !dateTo) return null;
    const fromMs = Date.parse(dateFrom);
    const toMs = Date.parse(dateTo);
    if (Number.isNaN(fromMs) || Number.isNaN(toMs) || toMs < fromMs) return null;
    return Math.round((toMs - fromMs) / 60000);
};

const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainderMinutes = minutes % 60;
    if (remainderMinutes === 0) return `${hours} h`;
    return `${hours} h ${remainderMinutes} min`;
};

const mapShippingMetrics = (shippings: ApiShippingItem[]) => {
    let pendiente = 0;
    let paraEntrega = 0;
    let inicio = 0;
    let entregado = 0;
    let noEntregado = 0;
    const carriers = new Set<string>();
    const deliveredDurations: number[] = [];

    shippings.forEach((shipping) => {
        const status = (shipping.status ?? "").toLowerCase();
        const carrierId = shipping.carrierId ?? "";

        if (carrierId) {
            carriers.add(carrierId);
        }

        if (DELIVERED_STATUSES.has(status)) {
            entregado += 1;
            const deliveredMinutes = toMinutes(shipping.dateCreated, shipping.dateModified);
            if (deliveredMinutes !== null) {
                deliveredDurations.push(deliveredMinutes);
            }
            return;
        }

        if (NOT_DELIVERED_STATUSES.has(status)) {
            noEntregado += 1;
            return;
        }

        if (IN_PROGRESS_STATUSES.has(status)) {
            inicio += 1;
            return;
        }

        if (shipping.readyForPickup || shipping.routePending) {
            paraEntrega += 1;
            return;
        }

        pendiente += 1;
    });

    const avgMinutes =
        deliveredDurations.length > 0
            ? Math.round(
                deliveredDurations.reduce((total, current) => total + current, 0) /
                deliveredDurations.length
            )
            : null;

    return {
        totales: shippings.length,
        pendiente,
        paraEntrega,
        inicio,
        entregado,
        noEntregado,
        drivers: carriers.size,
        tiempoMedio: avgMinutes === null ? "" : formatMinutes(avgMinutes)
    };
};

/* ---------- Página ---------- */
export default function SeguiemientoEntregasView() {
    const { fetchWithAuth } = useFetchWithAuth();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const updateIsMobile = (event: MediaQueryList | MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        updateIsMobile(mediaQuery);
        const supportsModernListener = typeof mediaQuery.addEventListener === "function";

        if (supportsModernListener) {
            mediaQuery.addEventListener("change", updateIsMobile);
            return () => mediaQuery.removeEventListener("change", updateIsMobile);
        }

        mediaQuery.addListener(updateIsMobile);
        return () => mediaQuery.removeListener(updateIsMobile);
    }, []);

    const [warehouseList, setWarehouseList] = useState<ApiWarehouseItem[]>([]);
    const [allRows, setAllRows] = useState<Row[]>([]);
    const [warehouseShippings, setWarehouseShippings] = useState<Record<string, ApiShippingItem[]>>({});
    const [carrierMap, setCarrierMap] = useState<Record<string, string>>({});

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [detailCurrentPage, setDetailCurrentPage] = useState(1);

    const warehouseOptions = useMemo(
        () =>
            warehouseList
                .filter((warehouse) => getWarehouseId(warehouse))
                .map((warehouse) => ({
                    label: getWarehouseLabel(warehouse),
                    value: getWarehouseId(warehouse)
                })),
        [warehouseList]
    );

    const carrierOptions = useMemo(
        () =>
            Object.entries(carrierMap)
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [carrierMap]
    );

    const deliveryTypeOptions = useMemo(
        () =>
            uniqueValues(
                Object.values(warehouseShippings).flatMap((shippings) =>
                    shippings.map((shipping) => shipping.type)
                )
            )
                .map((value) => ({ label: value, value }))
                .sort((a, b) => a.label.localeCompare(b.label)),
        [warehouseShippings]
    );

    const filterConfig = useMemo(
        () => buildFilterConfig(warehouseOptions, carrierOptions, deliveryTypeOptions),
        [warehouseOptions, carrierOptions, deliveryTypeOptions]
    );

    const { filters, headerFilters, handleFilterChange, resetFilters, applyFilters } =
        useStandardFilters<Filters, Row>({
            initialFilters: INITIAL_FILTERS,
            configs: filterConfig,
        });

    const rows = useMemo(() => {
        return allRows.map((row) => {
            const filteredShippings = filterShippingsForMetrics(
                warehouseShippings[row.warehouseId] ?? [],
                filters
            );
            const metrics = mapShippingMetrics(filteredShippings);

            return {
                ...row,
                ...metrics,
                paraEntregaDetalle: metrics.paraEntrega > 0 ? `${metrics.paraEntrega} Sin conductor` : "",
                entregadoDetalle:
                    metrics.totales > 0
                        ? `${Math.round((metrics.entregado / metrics.totales) * 100)}% a tiempo`
                        : "",
                carrierIds: uniqueValues(filteredShippings.map((shipping) => shipping.carrierId)),
                deliveryTypes: uniqueValues(filteredShippings.map((shipping) => shipping.type)),
                shippingDates: uniqueValues(filteredShippings.map((shipping) => shipping.dateCreated))
            };
        });
    }, [allRows, filters, warehouseShippings]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

    useEffect(() => {
        const pages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
        setTotalRecords(filteredRows.length);
        setTotalPages(pages);
        setCurrentPage((p) => clamp(p, 1, pages));
    }, [filteredRows]);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return filteredRows.slice(start, end);
    }, [filteredRows, currentPage]);

    const handleViewDrivers = useCallback((row: Row) => {
        setSelectedWarehouseId(row.warehouseId);
    }, []);

    const columns = useMemo(
        () =>
            selectedWarehouseId
                ? getCompactColumns(handleViewDrivers, selectedWarehouseId)
                : getColumns(handleViewDrivers, selectedWarehouseId),
        [handleViewDrivers, selectedWarehouseId]
    );

    const driverColumns = useMemo(() => getDriverColumns(), []);

    const driverRows: DriverRow[] = useMemo(() => {
        if (!selectedWarehouseId) return [];

        const shippings = filterShippingsForMetrics(
            warehouseShippings[selectedWarehouseId] ?? [],
            filters
        );
        const groupedByCarrier = new Map<string, ApiShippingItem[]>();

        shippings.forEach((shipping) => {
            const carrierId = shipping.carrierId ?? "sin-carrier";
            const current = groupedByCarrier.get(carrierId) ?? [];
            current.push(shipping);
            groupedByCarrier.set(carrierId, current);
        });

        const rowsByCarrier = Array.from(groupedByCarrier.entries()).map(([carrierId, carrierShippings]) => {
            const metrics = mapShippingMetrics(carrierShippings);
            return {
                carrierId,
                nombre: carrierMap[carrierId] ?? (carrierId === "sin-carrier" ? "Sin carrier" : carrierId),
                totales: metrics.totales,
                pendiente: metrics.pendiente,
                paraEntrega: metrics.paraEntrega,
                inicio: metrics.inicio,
                entregado: metrics.entregado,
                noEntregado: metrics.noEntregado,
                tiempo: metrics.tiempoMedio || "-"
            };
        });

        return rowsByCarrier;
    }, [selectedWarehouseId, warehouseShippings, carrierMap, filters]);

    useEffect(() => {
        const detailPages = Math.max(1, Math.ceil(driverRows.length / DETAIL_PER_PAGE));
        setDetailCurrentPage((p) => clamp(p, 1, detailPages));
    }, [driverRows.length]);

    const pagedDriverRows: DriverRow[] = useMemo(() => {
        const start = (detailCurrentPage - 1) * DETAIL_PER_PAGE;
        const end = start + DETAIL_PER_PAGE;
        return driverRows.slice(start, end);
    }, [driverRows, detailCurrentPage]);

    const selectedRow = useMemo(() => {
        if (!selectedWarehouseId) return null;
        return filteredRows.find((row) => row.warehouseId === selectedWarehouseId) ?? null;
    }, [filteredRows, selectedWarehouseId]);

    useEffect(() => {
        if (!selectedWarehouseId) return;
        if (filteredRows.some((row) => row.warehouseId === selectedWarehouseId)) return;
        setSelectedWarehouseId(null);
    }, [filteredRows, selectedWarehouseId]);

    const pagedRowsWithoutSelected = useMemo(() => {
        if (!selectedWarehouseId) return pagedRows;
        return pagedRows.filter((row) => row.warehouseId !== selectedWarehouseId);
    }, [pagedRows, selectedWarehouseId]);

    const loadWarehouseRows = useCallback(async () => {
        let warehouses: ApiWarehouseItem[] = [];

        try {
            const warehouseResponse = await fetchWithAuth<ApiPaginated<ApiWarehouseItem> | ApiWarehouseItem[]>(
                `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`
            );
            warehouses = extractList<ApiWarehouseItem>(warehouseResponse);
        } catch {
            const fallbackResponse = await fetchJson<ApiPaginated<ApiWarehouseItem> | ApiWarehouseItem[]>(
                `${WAREHOUSE_API_BASE}/warehouse?sortBy=referenceId&sortDirection=asc`
            );
            warehouses = extractList<ApiWarehouseItem>(fallbackResponse);
        }

        setWarehouseList(warehouses);

        const shippingEntries = await Promise.all(
            warehouses
                .filter((warehouse) => getWarehouseId(warehouse))
                .map(async (warehouse) => {
                    const warehouseId = getWarehouseId(warehouse);
                    try {
                        const shippingResponse = await fetchWithAuthDelivery<ApiPaginated<ApiShippingItem> | ApiShippingItem[]>(
                            `shipping?senderWarehouseId=${warehouseId}`
                        );
                        return [warehouseId, extractList<ApiShippingItem>(shippingResponse)] as const;
                    } catch {
                        return [warehouseId, []] as const;
                    }
                })
        );

        const nextWarehouseShippings: Record<string, ApiShippingItem[]> = Object.fromEntries(shippingEntries);
        setWarehouseShippings(nextWarehouseShippings);

        const nextRows: Row[] = warehouses
            .filter((warehouse) => getWarehouseId(warehouse))
            .map((warehouse) => {
                const warehouseId = getWarehouseId(warehouse);
                const shippings = nextWarehouseShippings[warehouseId] ?? [];
                const metrics = mapShippingMetrics(shippings);
                return {
                    warehouseId,
                    inventario: getWarehouseLabel(warehouse),
                    totales: metrics.totales,
                    pendiente: metrics.pendiente,
                    paraEntrega: metrics.paraEntrega,
                    paraEntregaDetalle: metrics.paraEntrega > 0 ? `${metrics.paraEntrega} Sin conductor` : "",
                    inicio: metrics.inicio,
                    entregado: metrics.entregado,
                    entregadoDetalle:
                        metrics.totales > 0
                            ? `${Math.round((metrics.entregado / metrics.totales) * 100)}% a tiempo`
                            : "",
                    noEntregado: metrics.noEntregado,
                    tiempoMedio: metrics.tiempoMedio,
                    drivers: metrics.drivers,
                    carrierIds: uniqueValues(shippings.map((shipping) => shipping.carrierId)),
                    deliveryTypes: uniqueValues(shippings.map((shipping) => shipping.type)),
                    shippingDates: uniqueValues(shippings.map((shipping) => shipping.dateCreated))
                };
            });

        setAllRows(nextRows);
    }, [fetchWithAuth, fetchWithAuthDelivery]);

    const loadCarrierMap = useCallback(async () => {
        const carrierResponse = await fetchWithAuthDelivery<ApiPaginated<ApiCarrierItem>>("carrier");
        const carriers = extractList<ApiCarrierItem>(carrierResponse);
        const nextCarrierMap: Record<string, string> = {};

        carriers.forEach((carrier) => {
            const carrierId = getCarrierId(carrier);
            if (!carrierId) return;
            nextCarrierMap[carrierId] = getCarrierLabel(carrier);
        });

        setCarrierMap(nextCarrierMap);
    }, [fetchWithAuthDelivery]);

    useEffect(() => {
        void Promise.all([loadWarehouseRows(), loadCarrierMap()]);
    }, [loadWarehouseRows, loadCarrierMap]);

    /* ---------- Acciones header ---------- */
    const handleExport = useCallback(() => {
        const headers = [
            "Inventario",
            "Totales",
            "Pendiente",
            "Para entrega",
            "Detalle para entrega",
            "Inicio",
            "Entregado",
            "Detalle entregado",
            "No entregado",
            "Tiempo medio",
            "Drivers",
        ];

        const data = filteredRows.map((r) => [
            r.inventario,
            r.totales,
            r.pendiente,
            r.paraEntrega,
            r.paraEntregaDetalle ?? "",
            r.inicio,
            r.entregado,
            r.entregadoDetalle ?? "",
            r.noEntregado,
            r.tiempoMedio,
            r.drivers,
        ]);

        exportToCsv("seguimiento-entregas.csv", [headers, ...data]);
    }, [filteredRows]);

    const handleRefresh = useCallback(() => {
        void Promise.all([loadWarehouseRows(), loadCarrierMap()]);
        setCurrentPage(1);
    }, [loadWarehouseRows, loadCarrierMap]);

    const handleClear = useCallback(() => {
        resetFilters();
        setCurrentPage(1);
        setDetailCurrentPage(1);
        setSelectedWarehouseId(null);
    }, [resetFilters]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: <span className="hidden sm:inline">Exportar</span>,
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />
            },
            {
                label: <span className="hidden sm:inline">Actualizar</span>,
                variant: "secondary",
                onClick: handleRefresh,
                icon: <ArrowPathIcon className="h-5 w-5" />
            },
        ],
        [handleExport, handleRefresh]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Entregas"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    handleFilterChange(id, String(value ?? ""));
                    setCurrentPage(1);
                    setDetailCurrentPage(1);
                }}
                filterTitle
                filtersGridClassName="lg:pr-6"
                filtersRight={!isMobile ? <ClearFiltersButton onClick={handleClear} /> : undefined}
            />

            <div className="flex-1 p-3 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                    <div
                        className={selectedWarehouseId
                            ? "grid grid-cols-1 gap-3 xl:grid-cols-[34%_1fr] xl:gap-x-4"
                            : "grid grid-cols-1"
                        }
                    >
                        <div className="space-y-0">
                            {!selectedWarehouseId && (
                                <div className="overflow-hidden rounded-xl shadow-sm">
                                    <DataTable
                                        data={pagedRows}
                                        columns={columns}
                                        dataType="General2"
                                        rowPaddingY={12}
                                        showStatusBorder={false}
                                        rowBgClass="bg-white"
                                    />
                                </div>
                            )}

                            {selectedWarehouseId && selectedRow && (
                                <>
                                    <div className="overflow-hidden rounded-t-xl shadow-sm">
                                        <DataTable
                                            data={[selectedRow]}
                                            columns={columns}
                                            dataType="General2"
                                            rowPaddingY={12}
                                            showStatusBorder={false}
                                            rowBgClass="bg-white"
                                        />
                                    </div>

                                    <div className="overflow-hidden border border-t-0 border-gray-200 bg-white">
                                        <SummaryMetricRow label="Pendiente" value={selectedRow.pendiente} tone="warning" />
                                        <SummaryMetricRow label="Listo para la entrega" value={selectedRow.paraEntrega} tone="dispatch" />
                                        <SummaryMetricRow label="Inicio" value={selectedRow.inicio} tone="info" />
                                        <SummaryMetricRow label="Entregado" value={selectedRow.entregado} tone="success" />
                                        <SummaryMetricRow label="No entregado" value={selectedRow.noEntregado} tone="error" />
                                    </div>

                                    {pagedRowsWithoutSelected.length > 0 && (
                                        <div className="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white shadow-sm">
                                            <DataTable
                                                data={pagedRowsWithoutSelected}
                                                columns={columns}
                                                dataType="General2"
                                                rowPaddingY={12}
                                                showStatusBorder={false}
                                                rowBgClass="bg-white"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedRow && !selectedWarehouseId && (
                                <div className="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white">
                                    <SummaryMetricRow label="Pendiente" value={selectedRow.pendiente} tone="warning" />
                                    <SummaryMetricRow label="Listo para la entrega" value={selectedRow.paraEntrega} tone="dispatch" />
                                    <SummaryMetricRow label="Inicio" value={selectedRow.inicio} tone="info" />
                                    <SummaryMetricRow label="Entregado" value={selectedRow.entregado} tone="success" />
                                    <SummaryMetricRow label="No entregado" value={selectedRow.noEntregado} tone="error" />
                                </div>
                            )}
                        </div>

                        {selectedWarehouseId && (
                            <div className="flex flex-col md:flex-row">
                                <div className="flex flex-row items-center justify-between gap-3 rounded-t-xl border-x border-t border-blue-300 bg-white px-3 py-3 md:flex-col md:justify-start md:gap-4 md:rounded-l-xl md:rounded-tr-none md:border-y md:border-l-2 md:border-r-0 md:border-blue-400 md:px-2 md:py-4">
                                    <button
                                        type="button"
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blue-400 bg-blue-50 text-blue-600"
                                        aria-label="Ver drivers"
                                    >
                                        <TruckIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedWarehouseId(null);
                                        }}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                                        aria-label="Cerrar detalle"
                                    >
                                        <ArrowRightIcon className="h-5 w-5 rotate-90 md:rotate-0" />
                                    </button>
                                </div>
                                <div className="flex-1 rounded-b-xl border border-t-0 border-blue-300 bg-[#e8eaf5] md:rounded-r-xl md:rounded-bl-none md:border-t md:border-l-0">
                                    <div className="flex items-center justify-between border-b bg-white px-4 py-3 sm:px-6 sm:py-4">
                                        <div className="text-4 font-semibold text-gray-900">
                                            {selectedRow?.inventario ?? ""}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedWarehouseId(null);
                                            }}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                            aria-label="Cerrar detalle"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="p-3 sm:p-6">
                                        <DataTable
                                            data={pagedDriverRows}
                                            columns={driverColumns}
                                            dataType="General2"
                                            rowPaddingY={12}
                                            showStatusBorder={false}
                                            rowBgClass="bg-white"
                                        />

                                        <div className="mt-4 flex flex-col items-center gap-3">
                                            <Pagination
                                                currentPage={detailCurrentPage}
                                                totalRecords={driverRows.length}
                                                pageSize={DETAIL_PER_PAGE}
                                                onPageChange={setDetailCurrentPage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Paginación general (parte inferior centrada) */}
                <div className="mt-4 flex flex-col items-center gap-4 sm:mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalRecords={totalRecords}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}

function SummaryMetricRow({
    label,
    value,
    tone
}: {
    label: string;
    value: number;
    tone: "warning" | "dispatch" | "info" | "success" | "error";
}) {
    const toneClasses: Record<string, string> = {
        warning: "bg-yellow-400 text-white",
        dispatch: "bg-orange-500 text-white",
        info: "bg-blue-500 text-white",
        success: "bg-emerald-500 text-white",
        error: "bg-red-500 text-white"
    };

    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 first:border-t-0">
            <span className="text-sm text-gray-700">{label}</span>
            <span
                className={`inline-flex min-w-[44px] items-center justify-center rounded-full px-3 py-1 text-sm font-medium ${toneClasses[tone]}`}
            >
                {value}
            </span>
        </div>
    );
}

