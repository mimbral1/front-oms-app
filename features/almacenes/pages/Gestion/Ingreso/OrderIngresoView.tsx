"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge as UiStatusBadge } from "@/components/ui/badge/StatusBadge";
import { Avatar } from "@/components/ui/user-avatar";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type SupplyingStatus = "pending" | "partiallyReceived" | "received" | "approved" | string;

type SupplyingItem = {
    skuId?: string | null;
    skuReferenceId?: string | null;
    quantity?: number | null;
};

type SupplyingRecord = {
    id: string;
    displayId: string;
    warehouseId: string | null;
    supplierId: string | null;
    supplierName?: string | null;
    folioNumber?: string | null;
    packingSlip: string | null;
    invoiceNumber: string | null;
    assigneeId: string | null;
    estimatedDate?: {
        from?: string | null;
        to?: string | null;
    } | null;
    items: SupplyingItem[];
    status: SupplyingStatus;
    dateCreated: string;
    dateModified: string;
    userCreated: string | null;
    userModified: string | null;
};

type SupplyRow = {
    id: string;
    displayId: string;
    inventory: string;
    supplier: string;
    folioNumber: string;
    skus: number;
    items: number;
    assigneeId: string;
    estimatedDate: string;
    arrivalDate: string;
    createdDate: string;
    creator: string;
    status: string;
    statusLabel: string;
    statusForBorder: "Activo";
};

type SupplyFilters = {
    id: string;
    inventory: string;
    supplier: string;
    status: string;
};

const SUPPLYING_URL = `${BASE_WAREHOUSES}/supplying`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});
const PER_PAGE = 10;

const formatDateTimeWithoutSeconds = (value?: string | null) => {
    const formatted = fmtDateTime(value ?? null);
    if (!formatted || formatted === "-") return "-";

    const parts = formatted.split(" ");
    const date = parts[0] ?? "-";
    const time = parts[1] ?? "";
    const timeParts = time.split(":");
    const compactTime = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : time;

    return compactTime ? `${date} ${compactTime}` : date;
};

const initialFilters: SupplyFilters = {
    id: "",
    inventory: "",
    supplier: "",
    status: "",
};

const uniqueSkuCount = (items: SupplyingItem[]) => {
    const keys = new Set(
        (items ?? [])
            .map((item) => item.skuReferenceId || item.skuId || "")
            .map((sku) => String(sku).trim())
            .filter(Boolean)
    );
    return keys.size;
};

const totalItemsCount = (items: SupplyingItem[]) =>
    (items ?? []).reduce((accumulator, item) => accumulator + Number(item.quantity ?? 0), 0);

const getStatusDisplay = (status: SupplyingStatus): {
    label: string;
    variant: "success" | "pending" | "partial" | "processing" | "error" | "default";
} => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pending") return { label: "Pendiente", variant: "pending" };
    if (normalized === "requested") return { label: "Solicitado", variant: "processing" };
    if (normalized === "started") return { label: "Iniciado", variant: "processing" };
    if (normalized === "received") return { label: "Recibido", variant: "success" };
    if (normalized === "rejected") return { label: "Rechazado", variant: "error" };
    if (normalized === "cancelled" || normalized === "canceled") return { label: "Cancelado", variant: "error" };
    if (normalized === "approved") return { label: "Aprobada", variant: "success" };
    if (normalized === "partiallyreceived" || normalized === "partially_received") return { label: "Parcial", variant: "partial" };
    if (normalized === "processing" || normalized === "in_process" || normalized === "in-progress") return { label: "En proceso", variant: "processing" };
    if (normalized === "created") return { label: "Creada", variant: "pending" };
    if (normalized === "draft") return { label: "Borrador", variant: "default" };
    return { label: String(status || "Pendiente"), variant: "default" };
};

function UserAvatarCell({ value }: { value: string }) {
    const display = String(value || "-");
    return (
        <div className="inline-flex max-w-[220px] items-center gap-2">
            <Avatar name={display} alt={display} className="h-7 w-7" />
            <span className="truncate text-sm text-gray-700">{display}</span>
        </div>
    );
}

const QtyChip = ({ value }: { value: number }) => (
    <span className="inline-flex h-9 min-w-[56px] items-center justify-center rounded-full border border-gray-300 bg-[#f8f8fb] px-3 text-sm font-semibold text-gray-600">
        {value}
    </span>
);

function getColumns(): Column<SupplyRow>[] {
    return [
        {
            header: "ID",
            accessorKey: "id",
            cell: (row) => (
                <div className="w-[260px] max-w-[260px] overflow-hidden text-sm font-semibold leading-5 text-gray-700">
                    <CopyableText text={row.displayId} className="max-w-full">
                        {row.displayId}
                    </CopyableText>
                </div>
            ),
        },
        { header: "Inventario", accessorKey: "inventory", cell: (row) => <span className="text-sm text-gray-700">{row.inventory}</span> },
        { header: "Proveedor", accessorKey: "supplier", cell: (row) => <span className="text-sm text-gray-700">{row.supplier}</span> },
        { header: "Remito #", accessorKey: "folioNumber", cell: (row) => <span className="text-sm text-gray-700">{row.folioNumber}</span> },
        { header: "SKUs", accessorKey: "skus", cell: (row) => <QtyChip value={row.skus} /> },
        { header: "Ítems", accessorKey: "items", cell: (row) => <QtyChip value={row.items} /> },
        { header: "Asignado", accessorKey: "assigneeId", cell: (row) => <UserAvatarCell value={row.assigneeId} /> },
        {
            header: "Fecha estimada",
            accessorKey: "estimatedDate",
            cell: (row) => {
                const [fromDate = "-", toDate = "-"] = String(row.estimatedDate || "-").split(" - ");
                return (
                    <div className="space-y-0.5 text-sm text-gray-700">
                        <p>{fromDate}</p>
                        {toDate && toDate !== "-" ? <p>{toDate}</p> : null}
                    </div>
                );
            },
        },
        { header: "Llegada", accessorKey: "arrivalDate", cell: (row) => <span className="text-sm text-gray-700">{row.arrivalDate}</span> },
        { header: "Creación", accessorKey: "createdDate", cell: (row) => <span className="text-sm leading-5 text-gray-700">{row.createdDate}</span> },
        { header: "Usuario creador", accessorKey: "creator", cell: (row) => <UserAvatarCell value={row.creator} /> },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => {
                const statusDisplay = getStatusDisplay(row.status);
                return <UiStatusBadge status={row.status} label={statusDisplay.label} variant={statusDisplay.variant} />;
            },
        },
    ];
}

export default function OrderView() {
    const router = useRouter();
    const [rows, setRows] = useState<SupplyRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const columns = useMemo(() => getColumns(), []);

    const inventoryOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((row) => row.inventory).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const supplierOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((row) => row.supplier).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const statusOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((row) => row.statusLabel).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const filterConfig = useMemo<FilterConfig<SupplyFilters, SupplyRow>[]>(
        () => [
            {
                id: "id",
                label: "ID",
                type: "text",
                rowValue: (row) => [row.id, row.displayId],
            },
            {
                id: "inventory",
                label: "Inventario",
                type: "select-search",
                options: inventoryOptions,
                rowValue: (row) => row.inventory,
            },
            {
                id: "supplier",
                label: "Proveedor",
                type: "select-search",
                options: supplierOptions,
                rowValue: (row) => row.supplier,
            },
            {
                id: "status",
                label: "Estado",
                type: "select-search",
                options: statusOptions,
                rowValue: (row) => row.statusLabel,
            },
        ],
        [inventoryOptions, statusOptions, supplierOptions]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<SupplyFilters, SupplyRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMsg(null);

            const [supplyRes, warehousesRes] = await Promise.all([
                fetch(SUPPLYING_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                }),
                warehousesAll({ page: 1, pageSize: 500 }),
            ]);

            if (!supplyRes.ok) {
                throw new Error(`HTTP ${supplyRes.status}: no se pudo cargar supplying`);
            }

            const supplyList = (await supplyRes.json()) as SupplyingRecord[];
            const warehouseById = new Map(
                (warehousesRes.items ?? []).map((warehouse) => [String(warehouse.id).toUpperCase(), warehouse.name])
            );

            const mappedRows: SupplyRow[] = (Array.isArray(supplyList) ? supplyList : []).map((item) => {
                const estimatedFrom = formatDateTimeWithoutSeconds(item.estimatedDate?.from ?? null);
                const estimatedTo = formatDateTimeWithoutSeconds(item.estimatedDate?.to ?? null);
                const estimatedValue =
                    estimatedFrom !== "-" && estimatedTo !== "-"
                        ? `${estimatedFrom} - ${estimatedTo}`
                        : estimatedFrom !== "-"
                            ? estimatedFrom
                            : estimatedTo;
                const supplierName = String(item.supplierName ?? "").trim();
                const supplierId = String(item.supplierId ?? "").trim();
                const statusDisplay = getStatusDisplay(item.status);

                return {
                    id: item.id,
                    displayId: item.displayId || item.id,
                    inventory: warehouseById.get(String(item.warehouseId || "").toUpperCase()) || "-",
                    supplier: supplierName || supplierId || "-",
                    folioNumber: item.invoiceNumber || "-",
                    skus: uniqueSkuCount(item.items || []),
                    items: totalItemsCount(item.items || []),
                    assigneeId: item.assigneeId ? String(item.assigneeId) : "-",
                    estimatedDate: estimatedValue,
                    arrivalDate: formatDateTimeWithoutSeconds(item.dateModified || null),
                    createdDate: formatDateTimeWithoutSeconds(item.dateCreated || null),
                    creator: item.userCreated ? String(item.userCreated) : "-",
                    status: String(item.status || "pending"),
                    statusLabel: statusDisplay.label,
                    statusForBorder: "Activo",
                };
            });

            setRows(mappedRows);
            setCurrentPage(1);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al cargar movimientos de mercadería";
            setErrorMsg(message);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const paginatedRows = useMemo(
        () => filteredData.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
        [currentPage, filteredData]
    );

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, filteredData.length]);

    const handleExport = useCallback(() => {
        const headers = [
            "ID",
            "INVENTARIO",
            "PROVEEDOR",
            "REMITO",
            "SKUS",
            "ITEMS",
            "ASIGNADO",
            "FECHA_ESTIMADA",
            "LLEGADA",
            "CREACION",
            "USUARIO_CREADOR",
            "ESTADO",
        ];

        const data = filteredData.map((row) => [
            row.id,
            row.inventory,
            row.supplier,
            row.folioNumber,
            row.skus,
            row.items,
            row.assigneeId,
            row.estimatedDate,
            row.arrivalDate,
            row.createdDate,
            row.creator,
            row.statusLabel,
        ]);

        exportToCsv("MovimientosMercaderia.csv", [headers, ...data]);
    }, [filteredData]);

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/almacen/gestion/ordenes-compra/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary",
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => {
                void fetchData();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Ordenes de compra"
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-4">
                    {loading ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
                            Cargando órdenes de compra...
                        </div>
                    ) : null}

                    {errorMsg ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMsg}</div>
                    ) : null}

                    {!loading && !errorMsg ? (
                        <>
                            <div className="overflow-hidden rounded-xl shadow-sm">
                                <DataTable<SupplyRow>
                                    data={paginatedRows}
                                    columns={columns}
                                    dataType="General2"
                                    statusKey="statusForBorder"
                                    rowBgClass="bg-white"
                                    rowPaddingY={12}
                                    onRowClick={(row) => router.push(`/almacen/gestion/ordenes-compra/${row.id}`)}
                                />
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalRecords={filteredData.length}
                                pageSize={PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
