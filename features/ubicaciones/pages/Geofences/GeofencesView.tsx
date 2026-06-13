"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/user-avatar";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type ApiGeofence = {
    id: string | number;
    name: string;
    status: "active" | "inactive";
    dateCreated?: string | null;
    userCreated?: string | null;
    dateModified?: string | null;
    userModified?: string | null;
    description?: string | null;
    coverage?: unknown;
};

const errorPayload = (err: unknown): unknown => {
    if (err && typeof err === "object" && "payload" in err) {
        return (err as { payload?: unknown }).payload ?? err;
    }
    return err;
};

type GeofenceRow = {
    id: string | number;
    name: string;
    description: string;
    dateCreated: string | null;
    userCreated: string | null;
    dateModified: string | null;
    userModified: string | null;
    status: "active" | "inactive";
};

interface Filters {
    search: string;
    status: "" | "active" | "inactive";
}

const PER_PAGE = 20;

const initialFilters: Filters = {
    search: "",
    status: "",
};

const filterConfig: FilterConfig<Filters, GeofenceRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        rowValue: (row) => [row.name, row.description],
    },
    {
        id: "status",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "active" },
            { label: "Inactivo", value: "inactive" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => row.status,
    },
];

const formatDate = (iso?: string | null) => {
    if (!iso) return "--";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("es-CL", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const getStatusColor = (status: "active" | "inactive") =>
    status === "active" ? "bg-green-500" : "bg-gray-400";

function getColumns(): Column<GeofenceRow>[] {
    return [
        { header: "ID", accessorKey: "id", cell: (row) => String(row.id ?? "--") },
        { header: "NOMBRE", accessorKey: "name", cell: (row) => row.name || "--" },
        { header: "DESCRIPCION", accessorKey: "description", cell: (row) => row.description || "--" },
        { header: "CREACION", accessorKey: "dateCreated", cell: (row) => formatDate(row.dateCreated) },
        {
            header: "USUARIO CREADOR",
            accessorKey: "userCreated",
            cell: (row) =>
                row.userCreated ? (
                    <div className="flex items-center gap-2 text-sm">
                        <Avatar name={row.userCreated} alt={row.userCreated} className="h-7 w-7" />
                        <span>{row.userCreated}</span>
                    </div>
                ) : "--",
        },
        { header: "MODIFICADO", accessorKey: "dateModified", cell: (row) => formatDate(row.dateModified) },
        {
            header: "USUARIO MODIFICADOR",
            accessorKey: "userModified",
            cell: (row) =>
                row.userModified ? (
                    <div className="flex items-center gap-2 text-sm">
                        <Avatar name={row.userModified} alt={row.userModified} className="h-7 w-7" />
                        <span>{row.userModified}</span>
                    </div>
                ) : "--",
        },
        {
            header: "ESTADO",
            accessorKey: "status",
            cell: (row) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(row.status)}`}
                >
                    {row.status === "active" ? "Activo" : "Inactivo"}
                </div>
            ),
        },
    ];
}

export default function GeofenceView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();
    const [rows, setRows] = useState<GeofenceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, GeofenceRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetchWithAuth<ApiGeofence[]>("comerce-service/geofences");
            const data = Array.isArray(response) ? response : [];
            const mapped: GeofenceRow[] = data.map((geofence) => ({
                id: geofence.id,
                name: geofence.name || "",
                description: geofence.description || "",
                dateCreated: geofence.dateCreated ?? null,
                userCreated: geofence.userCreated ?? null,
                dateModified: geofence.dateModified ?? null,
                userModified: geofence.userModified ?? null,
                status: geofence.status ?? "inactive",
            }));
            setRows(mapped);
        } catch (error) {
            console.error("Error listando geocercas:", errorPayload(error));
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [token, fetchWithAuth]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const pageRows = filteredRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const handleExport = useCallback(() => {
        const headers = [
            "ID",
            "NOMBRE",
            "DESCRIPCION",
            "FECHA_CREACION",
            "USUARIO_CREADOR",
            "FECHA_MODIFICACION",
            "USUARIO_MODIFICADOR",
            "ESTADO",
        ];
        const data = filteredRows.map((row) => [
            row.id,
            row.name,
            row.description,
            formatDate(row.dateCreated),
            row.userCreated ?? "",
            formatDate(row.dateModified),
            row.userModified ?? "",
            row.status === "active" ? "Activo" : "Inactivo",
        ]);
        exportToCsv("geofences.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/ubicaciones/geocercas/nuevo"),
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
                onClick: () => fetchList(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport, fetchList]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Geocercas"
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
                        <p>Cargando geocercas...</p>
                    ) : (
                        <DataTable<GeofenceRow>
                            data={pageRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row) => router.push(`/ubicaciones/geocercas/${row.id}`)}
                        />
                    )}

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
