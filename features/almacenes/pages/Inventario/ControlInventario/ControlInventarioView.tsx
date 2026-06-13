// app/views/almacen/inventario/control-de-inventario/Browse/ControlInventarioView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { Avatar } from "@/components/ui/user-avatar";
import { exportToCsv } from "@/components/presets/export/export";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type Estado =
    | "Pendiente de confirmación"
    | "En progreso"
    | "Completado"
    | "Rechazado";

type Row = {
    id: string;
    backendId: string;
    inventario: string;
    asignado: string;
    items: number;
    posiciones: number;
    productos: number;
    estado: Estado;
    usuario: string;
    fecha: string;
    creador: string;
};

type ApiStockControlItem = {
    id: string;
    warehouseId: string;
    displayId: string;
    assigneeId: string | null;
    reviewerId: string | null;
    items: Array<{
        skuReferenceId?: string | null;
        countedQuantity?: number | null;
        positionKey?: string | null;
        ean?: string | null;
    }>;
    skuCount: number | null;
    itemCount: number | null;
    positionCount: number | null;
    status: string;
    dateCreated: string;
    dateModified: string;
    userCreated: string | null;
    userModified: string | null;
};

interface Filters {
    search: string;
    estado: string;
}

const STOCK_CONTROL_URL = `${BASE_WAREHOUSES}/stock-control`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});
const PER_PAGE = 10;

const ESTADOS: Estado[] = [
    "Pendiente de confirmación",
    "En progreso",
    "Completado",
    "Rechazado",
];

const initialFilters: Filters = {
    search: "",
    estado: "",
};

const filterConfig: FilterConfig<Filters, Row>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.id} ${row.inventario} ${row.asignado} ${row.items} ${row.posiciones} ${row.productos} ${row.estado} ${row.usuario} ${row.fecha} ${row.creador}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "estado",
        label: "Estado",
        type: "select",
        options: ESTADOS.map((estado) => ({ label: estado, value: estado })),
        rowValue: (row) => row.estado,
    },
];

const mapEstado = (status: string): Estado => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pendingconfirmation" || normalized === "pending_confirmation") return "Pendiente de confirmación";
    if (normalized === "inprogress" || normalized === "in_progress" || normalized === "started") return "En progreso";
    if (normalized === "confirmed" || normalized === "completed" || normalized === "done") return "Completado";
    if (normalized === "rejected") return "Rechazado";
    return "Pendiente de confirmación";
};

const stateColor = (estado: Estado) =>
    estado === "Pendiente de confirmación"
        ? "bg-amber-500"
        : estado === "Completado"
            ? "bg-green-500"
            : estado === "En progreso"
                ? "bg-blue-500"
                : "bg-rose-500";

function getColumns(): Column<Row>[] {
    return [
        { header: "ID", accessorKey: "id", cell: (row) => <CopyableText text={row.id}>{row.id}</CopyableText> },
        { header: "Inventario", accessorKey: "inventario" },
        { header: "Asignado", accessorKey: "asignado" },
        { header: "Items", accessorKey: "items" },
        { header: "Posiciones", accessorKey: "posiciones" },
        { header: "Productos", accessorKey: "productos" },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (row) => (
                <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${stateColor(row.estado)}`}>
                    {row.estado}
                </div>
            ),
        },
        {
            header: "Usuario",
            accessorKey: "usuario",
            cell: (row) => (
                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1">
                    <Avatar
                        name={row.usuario || "-"}
                        alt={row.usuario || "-"}
                        className="mr-2 h-7 w-7"
                    />
                    <span className="text-sm font-medium leading-tight text-gray-900">{row.usuario || "-"}</span>
                </div>
            ),
        },
        { header: "Fecha", accessorKey: "fecha" },
        {
            header: "Creador",
            accessorKey: "creador",
            cell: (row) => (
                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1">
                    <Avatar
                        name={row.creador || "-"}
                        alt={row.creador || "-"}
                        className="mr-2 h-7 w-7"
                    />
                    <span className="text-sm font-medium leading-tight text-gray-900">{row.creador || "-"}</span>
                </div>
            ),
        },
    ];
}

export default function ControlInventarioView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, Row>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const [stockControls, warehouses] = await Promise.all([
                fetch(STOCK_CONTROL_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                }).then(async (response) => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return (await response.json()) as ApiStockControlItem[];
                }),
                warehousesAll(),
            ]);

            const warehouseNameById = new Map<string, string>();
            for (const warehouse of warehouses.items ?? []) {
                warehouseNameById.set(warehouse.id, warehouse.name || warehouse.referenceId || warehouse.id);
            }

            const data: Row[] = (stockControls ?? []).map((entry) => {
                const warehouseName = warehouseNameById.get(entry.warehouseId) ?? entry.warehouseId;
                return {
                    id: entry.displayId || entry.id,
                    backendId: entry.id,
                    inventario: warehouseName,
                    asignado: entry.assigneeId ?? "--",
                    items: Number(entry.itemCount ?? 0),
                    posiciones: Number(entry.positionCount ?? 0),
                    productos: Number(entry.skuCount ?? 0),
                    estado: mapEstado(entry.status),
                    usuario: entry.reviewerId ?? entry.userModified ?? "--",
                    fecha: new Date(entry.dateModified || entry.dateCreated).toLocaleString("es-CL"),
                    creador: entry.userCreated ?? "--",
                };
            });

            setRows(data);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error al cargar stock control:", error);
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar stock control");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const pageRows = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleExport = useCallback(() => {
        const headers = [
            "ID",
            "Inventario",
            "Asignado",
            "Items",
            "Posiciones",
            "Productos",
            "Estado",
            "Usuario",
            "Fecha",
            "Creador",
        ];
        const data = filteredRows.map((row) => [
            row.id,
            row.inventario,
            row.asignado,
            row.items,
            row.posiciones,
            row.productos,
            row.estado,
            row.usuario,
            row.fecha,
            row.creador,
        ]);
        exportToCsv("stock-control.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Asignar control",
                variant: "success",
                onClick: () => router.push("/almacen/inventario/control-de-inventario/nuevo"),
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
                    void fetchList();
                },
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [fetchList, handleExport, router]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Control de inventario"
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
                    {loadError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                            {loadError}
                        </div>
                    ) : null}

                    {loading ? (
                        <p>Cargando controles...</p>
                    ) : filteredRows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            No hay controles que coincidan con los filtros seleccionados.
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={pageRows}
                                columns={columns}
                                dataType="General2"
                                statusKey="estado"
                                rowPaddingY={12}
                                showStatusBorder
                                rowBgClass="bg-white"
                                onRowClick={(row: Row) => router.push(`/almacen/inventario/control-de-inventario/${row.backendId}`)}
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
        </div>
    );
}
