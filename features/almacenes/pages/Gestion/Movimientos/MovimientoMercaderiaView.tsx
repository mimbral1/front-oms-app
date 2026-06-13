"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    DocumentTextIcon,
    EllipsisHorizontalIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/components/ui/badge/status";
import { exportToCsv } from "@/components/presets/export/export";
import { ActionButton } from "@/components/ui/button/action-button";
import { NewButton } from "@/components/presets/buttons/NewButton";
import { ExportButton } from "@/components/presets/buttons/ExportButton";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { BarcodeIcon } from "lucide-react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type ApiMovementRow = {
    id?: string | null;
    displayId?: string | null;
    type?: string | null;
    sprintId?: string | null;
    source?: {
        warehouseId?: string | null;
        warehouseName?: string | null;
        warehousesIds?: string[] | null;
    } | null;
    destination?: {
        warehouseId?: string | null;
        warehouseName?: string | null;
        warehousesIds?: string[] | null;
    } | null;
    content?: {
        orderId?: string | number | null;
        skuId?: string | null;
        quantity?: number | null;
        direction?: string | null;
    } | null;
    assigneeId?: string | null;
    receiverId?: string | null;
    dateCreated?: string | null;
    status?: string | null;
};

type MovementRow = {
    movementId: string;
    title: string;
    sprint: string;
    sourceLocation: string;
    sourceWarehouseGroup: string;
    sourceWarehouse: string;
    destinationWarehouse: string;
    movementSource: string;
    movementDestination: string;
    movementContent: string;
    movementDirection: string;
    movementSkuId: string;
    movementOrderId: string;
    assignee: string;
    receiver: string;
    dateCreated: string;
    status: string;
    statusVariant: StatusVariant;
};

type Filters = {
    sourceLocation: string;
    sourceWarehouseGroup: string;
    sourceWarehouse: string;
    destinationWarehouse: string;
    assignee: string;
    receiver: string;
};

const MOVEMENT_URL = `${BASE_WAREHOUSES}/movement`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});
const PER_PAGE = 10;

const initialFilters: Filters = {
    sourceLocation: "",
    sourceWarehouseGroup: "",
    sourceWarehouse: "",
    destinationWarehouse: "",
    assignee: "",
    receiver: "",
};

const getStatusMeta = (status: string | null | undefined): { label: string; variant: StatusVariant } => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "pending" || normalized === "created" || normalized === "draft") {
        return { label: "Pendiente", variant: "pending" };
    }
    if (normalized === "started" || normalized === "in_progress" || normalized === "processing" || normalized === "in-process") {
        return { label: "Iniciado", variant: "processing" };
    }
    if (normalized === "picked") {
        return { label: "Recolectado", variant: "warning" };
    }
    if (normalized === "ended" || normalized === "posted" || normalized === "completed" || normalized === "done") {
        return { label: "Finalizado", variant: "success" };
    }
    if (normalized === "rejected") {
        return { label: "Rechazado", variant: "error" };
    }
    if (normalized === "canceled" || normalized === "cancelled" || normalized === "canceling") {
        return { label: "Cancelado", variant: "error" };
    }

    return { label: String(status || "-"), variant: "default" };
};

function getColumns(): Column<MovementRow>[] {
    return [
        {
            header: "Título",
            accessorKey: "title",
            cell: (row) => (
                <div className="space-y-0.5">
                    <span className="font-semibold text-gray-900">
                        {row.title}
                    </span>
                    <p className="text-xs text-gray-500">{row.movementId || "-"}</p>
                </div>
            ),
        },
        {
            header: "Sprint",
            accessorKey: "sprint",
            cell: (row) => <span className="font-medium text-gray-800">{row.sprint}</span>,
        },
        {
            header: "Origen",
            accessorKey: "movementSource",
            cell: (row) => (
                <div className="space-y-0.5">
                    <p className="font-medium text-gray-800">{row.movementSource}</p>
                    <p className="text-xs text-gray-500">{row.sourceWarehouseGroup}</p>
                </div>
            ),
        },
        {
            header: "Destino",
            accessorKey: "movementDestination",
            cell: (row) => (
                <div className="space-y-0.5">
                    <p className="font-medium text-gray-800">{row.movementDestination}</p>
                    <p className="text-xs text-gray-500">{row.destinationWarehouse}</p>
                </div>
            ),
        },
        {
            header: "Contenido",
            accessorKey: "movementContent",
            cell: (row) => (
                <div className="space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-1.5">
                        <ShoppingCartIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-800">{row.movementOrderId || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BarcodeIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-800">{row.movementSkuId || "-"}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Asignado",
            accessorKey: "assignee",
            cell: (row) => (
                <div className="space-y-0.5">
                    <p className="font-medium text-gray-800">{row.assignee}</p>
                    <p className="text-xs text-gray-500">Usuario asignado</p>
                </div>
            ),
        },
        {
            header: "Receptor",
            accessorKey: "receiver",
            cell: (row) => <span className="text-gray-600">{row.receiver}</span>,
        },
        {
            header: "Fecha de creación",
            accessorKey: "dateCreated",
            cell: (row) => {
                const parts = String(row.dateCreated || "-").split(" ");
                const date = parts[0] ?? "-";
                const rawTime = parts[1] ?? "-";
                const timeParts = rawTime.split(":");
                const time = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : rawTime;
                return (
                    <div className="space-y-0.5">
                        <p className="font-medium text-gray-800">{date}</p>
                        <p className="text-xs text-gray-500">{time}</p>
                    </div>
                );
            },
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => <StatusBadge status={row.status} variant={row.statusVariant} />,
        },
    ];
}

export default function MovimientoMercaderiaView() {
    const router = useRouter();
    const [rows, setRows] = useState<MovementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const filterConfig = useMemo<FilterConfig<Filters, MovementRow>[]>(
        () => [
            {
                id: "sourceLocation",
                label: "Source location",
                type: "select-search",
                options: Array.from(new Set(rows.map((row) => row.sourceLocation))).filter(Boolean).map((value) => ({ label: value, value })),
                rowValue: (row) => row.sourceLocation,
            },
            {
                id: "sourceWarehouseGroup",
                label: "Source warehouse group",
                type: "select-search",
                options: Array.from(new Set(rows.map((row) => row.sourceWarehouseGroup))).filter(Boolean).map((value) => ({ label: value, value })),
                rowValue: (row) => row.sourceWarehouseGroup,
            },
            {
                id: "sourceWarehouse",
                label: "Source warehouse",
                type: "select-search",
                options: Array.from(new Set(rows.map((row) => row.sourceWarehouse))).filter(Boolean).map((value) => ({ label: value, value })),
                rowValue: (row) => row.sourceWarehouse,
            },
            {
                id: "destinationWarehouse",
                label: "Destination warehouse",
                type: "select-search",
                options: Array.from(new Set(rows.map((row) => row.destinationWarehouse))).filter(Boolean).map((value) => ({ label: value, value })),
                rowValue: (row) => row.destinationWarehouse,
            },
            {
                id: "assignee",
                label: "Assignee",
                type: "select-search",
                options: Array.from(new Set(rows.map((row) => row.assignee))).filter(Boolean).map((value) => ({ label: value, value })),
                rowValue: (row) => row.assignee,
            },
            {
                id: "receiver",
                label: "Receiver",
                type: "select-search",
                options: Array.from(new Set(rows.map((row) => row.receiver))).filter(Boolean).map((value) => ({ label: value, value })),
                rowValue: (row) => row.receiver,
            },
        ],
        [rows]
    );

    const { headerFilters, handleFilterChange, applyFilters } = useStandardFilters<Filters, MovementRow>({
        initialFilters,
        configs: filterConfig,
    });

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch(MOVEMENT_URL, {
                method: "GET",
                headers: JANIS_HEADERS,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = (await response.json()) as ApiMovementRow[];
            const mappedRows: MovementRow[] = (Array.isArray(data) ? data : []).map((item) => {
                const movementId = String(item.id || "");
                const sourceName = String(item.source?.warehouseName || "-");
                const destinationName = String(item.destination?.warehouseName || item.destination?.warehouseId || "-");
                const contentOrderId = String(item.content?.orderId || "-");
                const contentSkuId = String(item.content?.skuId || "-");
                const contentQuantity = Number(item.content?.quantity ?? 0);
                const contentDirection = String(item.content?.direction || item.type || "-");
                const statusMeta = getStatusMeta(item.status);

                return {
                    movementId,
                    title: String(item.displayId || movementId || "-"),
                    sprint: String(item.sprintId || "-"),
                    sourceLocation: sourceName,
                    sourceWarehouseGroup: sourceName,
                    sourceWarehouse: sourceName,
                    destinationWarehouse: destinationName,
                    movementSource: sourceName,
                    movementDestination: destinationName,
                    movementContent: `${contentDirection} | SKU ${contentSkuId} | Qty ${contentQuantity} | Order ${contentOrderId}`,
                    movementDirection: contentDirection,
                    movementSkuId: contentSkuId,
                    movementOrderId: contentOrderId,
                    assignee: String(item.assigneeId || "-"),
                    receiver: String(item.receiverId || "-"),
                    dateCreated: item.dateCreated ? fmtDateTime(item.dateCreated) : "-",
                    status: statusMeta.label,
                    statusVariant: statusMeta.variant,
                };
            });

            setRows(mappedRows);
            setPage(1);
        } catch (error: any) {
            setRows([]);
            setErrorMessage(error?.message || "Error al cargar movimientos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const columns = useMemo(() => getColumns(), []);
    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const shown = useMemo(() => filteredRows.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filteredRows, page]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [filteredRows.length, page]);

    const handleExport = useCallback(() => {
        exportToCsv(
            "movement-browse.csv",
            filteredRows.map((row) => ({
                Title: row.title,
                Sprint: row.sprint,
                MovementSource: row.movementSource,
                MovementDestination: row.movementDestination,
                MovementContent: row.movementContent,
                Assignee: row.assignee,
                Receiver: row.receiver,
                DateCreated: row.dateCreated,
                Status: row.status,
            }))
        );
    }, [filteredRows]);

    const headerActions = (
        <div className="flex items-center gap-2">
            <ActionButton
                variant="secondary"
                onClick={() => {
                    void fetchList();
                }}
            >
                <ArrowPathIcon className="h-5 w-5" />
                Actualizar
            </ActionButton>
            <ActionButton variant="primary" onClick={() => router.push("/almacen/gestion/sprints/nuevo")}>
                <ArrowPathIcon className="h-5 w-5" />
                Create sprint
            </ActionButton>
            <NewButton label="New" onClick={() => router.push("/almacen/gestion/movimiento/nuevo")} />
            <ExportButton label="Export" onClick={handleExport} />
            <ActionButton variant="secondary" onClick={() => { }}>
                <EllipsisHorizontalIcon className="h-5 w-5" />
            </ActionButton>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Listado de movimientos"
                description="Gestiona y monitorea los movimientos activos"
                filters={headerFilters}
                filterTitle={false}
                filtersAppearance="minimal"
                className="flex-wrap"
                onFilterChange={(id, value) => {
                    setPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
            />

            <div className="flex-1 p-3 px-6">
                <div className="space-y-6">
                    <div className="rounded-xl shadow-sm overflow-x-auto">
                        {loading ? (
                            <div className="bg-white">
                                <table className="min-w-full text-sm">
                                    <tbody>
                                        <tr>
                                            <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                                Cargando movimientos...
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : errorMessage ? (
                            <div
                                className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                                role="alert"
                            >
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium">Error al cargar datos de movimientos</h3>
                                        <p className="mt-2 text-sm">{errorMessage}</p>
                                        <div className="mt-4">
                                            <div className="-mx-2 -my-1.5 flex">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void fetchList();
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
                        ) : shown.length === 0 ? (
                            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm py-5">
                                <DocumentTextIcon className="h-16 w-16 text-gray-300 mb-4" />
                                <p className="text-lg font-medium text-gray-700">No hay movimientos para mostrar</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Prueba ajustando los filtros o intenta nuevamente mas tarde.
                                </p>
                            </div>
                        ) : (
                            <DataTable
                                data={shown}
                                columns={columns}
                                layout="adaptive"
                                dataType="Pedidos"
                                rowGap={6}
                                rowBgClass="bg-white shadow-sm"
                                rowPaddingY={12}
                            />
                        )}
                    </div>

                    {!errorMessage && (
                        <Pagination
                            currentPage={page}
                            totalRecords={filteredRows.length}
                            pageSize={PER_PAGE}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
