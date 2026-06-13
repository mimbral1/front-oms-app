// views\Cuenta\Trace\ImportarLogs\ImportarLogsView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* Tipos */
type Estado = "Completado" | "En proceso" | "Fallido";

interface ImportLogRow {
    id: string;               // ej: 625f0d9ebcd30700090b24c4
    servicio: string;         // ej: wms | commerce | api
    entidad: string;          // ej: sku_position
    idEntidad: string;        // ej: "-" o un id
    motivo: string;           // ej: new
    fechaDesde: string;       // dd/MM/yyyy HH:mm
    fechaHasta: string;       // dd/MM/yyyy HH:mm
    athenaId: string;         // id de ejecución
    cantidad: number;         // Cant.
    tamano: string;           // "0 GB", "1.2 GB"
    tiempo: string;           // "2.33 secs"
    estado: Estado;
}

/* Helpers UI (chips) */
const getStatusColor = (s: Estado) =>
    s === "Completado" ? "bg-green-500" : s === "En proceso" ? "bg-blue-500" : "bg-red-500";

const StatusPill = ({ status }: { status: Estado }) => (
    <div
        className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
            status
        )}`}
    >
        {status}
    </div>
);

/* Columnas (estilo de columnas calcado a las demas views) */
function getColumns(): Column<ImportLogRow>[] {
    return [
        { header: "ID", accessorKey: "id" },
        { header: "Servicio", accessorKey: "servicio" },
        { header: "Entidad", accessorKey: "entidad" },
        { header: "ID Entidad", accessorKey: "idEntidad" },
        { header: "Motivo", accessorKey: "motivo" },
        { header: "Fecha desde", accessorKey: "fechaDesde" },
        { header: "Fecha hasta", accessorKey: "fechaHasta" },
        { header: "Cant.", accessorKey: "cantidad" },
        { header: "Tamaño", accessorKey: "tamano" },
        { header: "Tiempo", accessorKey: "tiempo" },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => <StatusPill status={r.estado} />,
        },
    ];
}

/* Filtros de header  */
interface Filters {
    search: string;
    servicio: string;
    entidad: string;
    estado: string; // "", "done", "running", "failed"
    motivo: string;
}

const getFiltersConfig = (f: Filters) => [
    { id: "search", label: "Buscar", type: "text" as const, value: f.search },
    {
        id: "servicio",
        label: "Servicio",
        type: "select" as const,
        value: f.servicio,
        options: [
            { label: "Todos", value: "" },
            { label: "wms", value: "wms" },
            { label: "commerce", value: "commerce" },
            { label: "api", value: "api" },
        ],
    },
    {
        id: "entidad",
        label: "Entidad",
        type: "select" as const,
        value: f.entidad,
        options: [
            { label: "Todas", value: "" },
            { label: "sku_position", value: "sku_position" },
            { label: "api", value: "api" },
            { label: "orders", value: "orders" },
        ],
    },
    {
        id: "motivo",
        label: "Motivo",
        type: "select" as const,
        value: f.motivo,
        options: [
            { label: "Todos", value: "" },
            { label: "new", value: "new" },
            { label: "sync", value: "sync" },
            { label: "fix", value: "fix" },
        ],
    },
    {
        id: "estado",
        label: "Estado",
        type: "select" as const,
        value: f.estado,
        options: [
            { label: "Todos", value: "" },
            { label: "Completado", value: "done" },
            { label: "En proceso", value: "running" },
            { label: "Fallido", value: "failed" },
        ],
    },
];

const PER_PAGE = 20;

export default function ImportarLogsView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);

    /* tabla + paginación (idéntico flujo que SalesChannelsView) */
    const [rows, setRows] = useState<ImportLogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /* filtros */
    const [filters, setFilters] = useState<Filters>({
        search: "",
        servicio: "",
        entidad: "",
        estado: "",
        motivo: "",
    });

    /* fetch list (MOCK por ahora) */
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            // MOCK acorde a las capturas
            const all: ImportLogRow[] = [
                {
                    id: "625f0d9ebcd30700090b24c4",
                    servicio: "commerce",
                    entidad: "api",
                    idEntidad: "-",
                    motivo: "-",
                    fechaDesde: "11/08/2020 00:00:00",
                    fechaHasta: "15/08/2020 23:59:59",
                    athenaId: "2a257e8f-db16-4650-8867-f0c84b785cde",
                    cantidad: 10,
                    tamano: "0 GB",
                    tiempo: "2.33 secs",
                    estado: "Completado",
                },
                {
                    id: "IMPL-0001",
                    servicio: "wms",
                    entidad: "sku_position",
                    idEntidad: "-",
                    motivo: "new",
                    fechaDesde: "01/01/2022 00:00",
                    fechaHasta: "04/01/2022 23:59",
                    athenaId: "—",
                    cantidad: 0,
                    tamano: "—",
                    tiempo: "—",
                    estado: "En proceso",
                },
            ];

            // Filtros rápidos
            const q = (filters.search || "").toLowerCase();
            const filtered = all.filter(
                (r) =>
                    (!q ||
                        `${r.id} ${r.servicio} ${r.entidad} ${r.idEntidad} ${r.motivo}`.toLowerCase().includes(q)) &&
                    (!filters.servicio || r.servicio === filters.servicio) &&
                    (!filters.entidad || r.entidad === filters.entidad) &&
                    (!filters.motivo || r.motivo === filters.motivo) &&
                    (!filters.estado ||
                        (filters.estado === "done" && r.estado === "Completado") ||
                        (filters.estado === "running" && r.estado === "En proceso") ||
                        (filters.estado === "failed" && r.estado === "Fallido"))
            );

            const total = filtered.length;
            const start = (currentPage - 1) * PER_PAGE;
            const end = Math.min(start + PER_PAGE, total);
            setRows(filtered.slice(start, end));
            setTotalRecords(total);
            setTotalPages(Math.max(1, Math.ceil(total / PER_PAGE)));
        } finally {
            setLoading(false);
        }
    }, [filters.search, filters.servicio, filters.entidad, filters.estado, filters.motivo, currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* acciones header (Nuevo / Exportar / Actualizar) – mismo patrón */
    const handleExport = useCallback(() => {
        const headers = [
            "ID",
            "Servicio",
            "Entidad",
            "ID Entidad",
            "Motivo",
            "Fecha desde",
            "Fecha hasta",
            "ID ejecución Athena",
            "Cant.",
            "Tamaño",
            "Tiempo",
            "Estado",
        ];
        const data = rows.map((r) => [
            r.id,
            r.servicio,
            r.entidad,
            r.idEntidad,
            r.motivo,
            r.fechaDesde,
            r.fechaHasta,
            r.athenaId,
            r.cantidad,
            r.tamano,
            r.tiempo,
            r.estado,
        ]);
        exportToCsv("importar-logs.csv", [headers, ...data]);
    }, [rows]); // export 

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/cuenta/trace/importar-logs/nuevo"),
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
    ); // mismas acciones que el listado de canales 

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Importar logs"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando…</p>
                    ) : (
                        <DataTable<ImportLogRow>
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            rowPaddingY={24}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row) => router.push(`/cuenta/trace/importar-logs/${encodeURIComponent(row.id)}`)}
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
