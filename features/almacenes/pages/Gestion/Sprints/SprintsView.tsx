"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import UpdateIcon from "@mui/icons-material/Update";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/badge/status";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { exportToCsv } from "@/components/presets/export/export";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type SprintStatus = "Started" | "Ended" | "Rejected";

type ApiSprintRow = {
    id?: string | null;
    displayId?: string | null;
    source?: {
        warehouseName?: string | null;
        warehousesIds?: string[] | null;
    } | null;
    destination?: {
        warehouseName?: string | null;
        warehousesIds?: string[] | null;
    } | null;
    totals?: {
        movements?: number | null;
        warehouses?: number | null;
        orders?: number | null;
        packages?: number | null;
    } | null;
    assigneeId?: string | null;
    userCreated?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    status?: string | null;
};

export interface SprintRow {
    sprintId: string;
    id: string;
    title: string;
    sourceGroup: string;
    destinationGroup: string;
    warehouses: number;
    movements: number;
    orders: number;
    packages: number;
    assignee?: { name: string; email: string };
    creator: { name: string; email: string };
    createdAt: string;
    updatedAt: string;
    status: SprintStatus;
}

type Filters = {
    id: string;
    source: string;
    destination: string;
    status: "" | SprintStatus;
};

const SPRINT_URL = `${BASE_WAREHOUSES}/sprint`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});
const PER_PAGE = 10;

const initialFilters: Filters = {
    id: "",
    source: "",
    destination: "",
    status: "",
};

const filterConfig: FilterConfig<Filters, SprintRow>[] = [
    {
        id: "id",
        label: "ID",
        type: "text",
        placeholder: "210930-...",
        rowValue: (row) => row.id,
    },
    {
        id: "source",
        label: "Grupo Origen",
        type: "text",
        placeholder: "Piso 1...",
        rowValue: (row) => row.sourceGroup,
    },
    {
        id: "destination",
        label: "Grupo Destino",
        type: "text",
        placeholder: "Piso 2...",
        rowValue: (row) => row.destinationGroup,
    },
    {
        id: "status",
        label: "Estado",
        type: "select-search",
        options: [
            { label: "Started", value: "Started" },
            { label: "Ended", value: "Ended" },
            { label: "Rejected", value: "Rejected" },
        ],
        rowValue: (row) => row.status,
    },
];

const statusVariant = (status: SprintStatus) =>
    status === "Started" ? "success" : status === "Ended" ? "default" : "warning";

const getColumns = (router: ReturnType<typeof useRouter>): Column<SprintRow>[] => [
    {
        header: "ID",
        accessorKey: "id",
        cell: (row) => (
            <span
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={() => router.push(`/almacen/gestion/sprints/${encodeURIComponent(row.sprintId)}`)}
            >
                {row.id}
            </span>
        ),
    },
    { header: "Origen (grupo)", accessorKey: "sourceGroup" },
    { header: "Destino (grupo)", accessorKey: "destinationGroup" },
    {
        header: "Totales",
        accessorKey: "warehouses",
        cell: (row) => (
            <div className="flex gap-3 text-sm">
                <span>Almacenes: <b>{row.warehouses}</b></span>
                <span>Movimientos: <b>{row.movements}</b></span>
                <span>Pedidos: <b>{row.orders}</b></span>
                <span>Paquetes: <b>{row.packages}</b></span>
            </div>
        ),
    },
    {
        header: "Asignado",
        accessorKey: "assignee",
        cell: (row) => row.assignee ? (
            <div className="flex items-center gap-2">
                <Avatar name={row.assignee.name} />
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.assignee.name}</span>
                    <span className="text-xs text-gray-500">{row.assignee.email}</span>
                </div>
            </div>
        ) : <span className="text-xs text-gray-400">—</span>,
    },
    {
        header: "Creador",
        accessorKey: "creator",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <Avatar name={row.creator.name} />
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.creator.name}</span>
                    <span className="text-xs text-gray-500">{row.creator.email}</span>
                </div>
            </div>
        ),
    },
    { header: "Creación", accessorKey: "createdAt" },
    { header: "Modificado", accessorKey: "updatedAt" },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (row) => <StatusBadge status={row.status} variant={statusVariant(row.status)} />,
    },
];

export default function SprintsView() {
    const router = useRouter();
    const [rows, setRows] = useState<SprintRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, SprintRow>({
            initialFilters,
            configs: filterConfig,
        });

    const normalizeStatus = useCallback((status: string | null | undefined): SprintStatus => {
        const normalized = String(status || "").trim().toLowerCase();
        if (normalized === "ended" || normalized === "posted") return "Ended";
        if (normalized === "rejected" || normalized === "canceled" || normalized === "cancelled") return "Rejected";
        return "Started";
    }, []);

    const toGroup = useCallback((node?: { warehouseName?: string | null; warehousesIds?: string[] | null } | null) => {
        const warehouseName = String(node?.warehouseName || "").trim();
        return warehouseName || "-";
    }, []);

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch(SPRINT_URL, {
                method: "GET",
                headers: JANIS_HEADERS,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = (await response.json()) as ApiSprintRow[];
            const mapped: SprintRow[] = (Array.isArray(data) ? data : []).map((item) => {
                const sprintId = String(item.id || "");
                const displayId = String(item.displayId || sprintId || "-");
                return {
                    sprintId,
                    id: displayId,
                    title: displayId,
                    sourceGroup: toGroup(item.source),
                    destinationGroup: toGroup(item.destination),
                    warehouses: Number(item.totals?.warehouses ?? 0),
                    movements: Number(item.totals?.movements ?? 0),
                    orders: Number(item.totals?.orders ?? 0),
                    packages: Number(item.totals?.packages ?? 0),
                    assignee: item.assigneeId ? { name: String(item.assigneeId), email: "-" } : undefined,
                    creator: { name: String(item.userCreated || "-"), email: "-" },
                    createdAt: item.dateCreated ? fmtDateTime(item.dateCreated) : "-",
                    updatedAt: item.dateModified ? fmtDateTime(item.dateModified) : "-",
                    status: normalizeStatus(item.status),
                };
            });

            setRows(mapped);
            setPage(1);
        } catch (error: any) {
            setRows([]);
            setErrorMessage(error?.message || "Error al cargar sprints");
        } finally {
            setLoading(false);
        }
    }, [normalizeStatus, toGroup]);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const columns = useMemo(() => getColumns(router), [router]);
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
            "sprints.csv",
            filteredRows.map((row) => ({
                ID: row.id,
                Origen: row.sourceGroup,
                Destino: row.destinationGroup,
                Warehouses: row.warehouses,
                Movements: row.movements,
                Orders: row.orders,
                Packages: row.packages,
                Asignado: row.assignee?.name ?? "",
                Creador: row.creator.name,
                Creacion: row.createdAt,
                Modificado: row.updatedAt,
                Estado: row.status,
            }))
        );
    }, [filteredRows]);

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            icon: <PlusIcon className="h-5 w-5" />,
            onClick: () => router.push("/almacen/gestion/sprints/nuevo"),
        },
        {
            label: "Exportar",
            variant: "primary",
            icon: <UpdateIcon fontSize="small" />,
            onClick: handleExport,
        },
        {
            label: "Actualizar",
            variant: "secondary",
            icon: <ArrowPathIcon className="h-5 w-5" />,
            onClick: () => {
                void fetchList();
            },
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Sprints"
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <div className="overflow-hidden rounded-xl shadow-sm">
                    <DataTable
                        data={shown}
                        columns={columns}
                        dataType="General"
                        rowPaddingY={20}
                        rowBgClass="bg-white"
                        onRowClick={(row: SprintRow) =>
                            router.push(`/almacen/gestion/sprints/${encodeURIComponent(row.sprintId)}`)
                        }
                    />
                </div>

                {errorMessage ? (
                    <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
                ) : null}

                <Pagination
                    currentPage={page}
                    totalRecords={filteredRows.length}
                    pageSize={PER_PAGE}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
