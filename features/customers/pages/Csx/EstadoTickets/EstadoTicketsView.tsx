"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type Activo = "Activo" | "Inactivo";

interface EstadoTicketRow {
    id: number;
    nombre: string;
    descripcion: string;
    orden: number;
    color: string;
    esFinal: boolean;
    notificable: boolean;
    estado: Activo;
    creado: string;
}

type EstadoTicketFilters = {
    search: string;
    estado: string;
    final: string;
};

const PER_PAGE = 20;

const initialFilters: EstadoTicketFilters = {
    search: "",
    estado: "",
    final: "",
};

const baseRows: EstadoTicketRow[] = [
    {
        id: 1,
        nombre: "Abierto",
        descripcion: "Ticket recién creado",
        orden: 1,
        color: "#60A5FA",
        esFinal: false,
        notificable: true,
        estado: "Activo",
        creado: "05/01/2024 10:12:30",
    },
    {
        id: 2,
        nombre: "En progreso",
        descripcion: "Asignado y trabajando",
        orden: 2,
        color: "#F59E0B",
        esFinal: false,
        notificable: true,
        estado: "Activo",
        creado: "05/01/2024 10:12:30",
    },
    {
        id: 3,
        nombre: "Esperando cliente",
        descripcion: "Pendiente de respuesta del cliente",
        orden: 3,
        color: "#A78BFA",
        esFinal: false,
        notificable: true,
        estado: "Activo",
        creado: "06/01/2024 09:01:10",
    },
    {
        id: 4,
        nombre: "Resuelto",
        descripcion: "Solución aplicada",
        orden: 4,
        color: "#34D399",
        esFinal: true,
        notificable: true,
        estado: "Activo",
        creado: "06/01/2024 09:01:10",
    },
    {
        id: 5,
        nombre: "Cerrado",
        descripcion: "Ticket cerrado definitivamente",
        orden: 5,
        color: "#6B7280",
        esFinal: true,
        notificable: false,
        estado: "Inactivo",
        creado: "07/01/2024 15:42:00",
    },
];

const filterConfig: FilterConfig<EstadoTicketFilters, EstadoTicketRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.nombre} ${row.descripcion}`.toLowerCase().includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "estado",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
        rowValue: (row) => row.estado,
    },
    {
        id: "final",
        label: "Final",
        type: "select",
        options: [
            { label: "Sí", value: "si" },
            { label: "No", value: "no" },
        ],
        match: (row, value) => (value === "si" ? row.esFinal : value === "no" ? !row.esFinal : true),
    },
];

const Pill = ({ on, text }: { on: boolean; text: string }) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
        {text}
    </span>
);

const StatusBadge = ({ status }: { status: Activo }) => (
    <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${status === "Activo" ? "bg-green-500" : "bg-gray-400"}`}>
        {status}
    </div>
);

const ColorSwatch = ({ color }: { color: string }) => (
    <div className="flex items-center gap-2">
        <span
            className="inline-block h-4 w-4 rounded ring-1 ring-black/10"
            style={{ backgroundColor: color || "#e5e7eb" }}
            aria-label={`Color ${color}`}
            title={color}
        />
        <span className="text-xs text-gray-500">{color}</span>
    </div>
);

const getColumns = (): Column<EstadoTicketRow>[] => [
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Descripción", accessorKey: "descripcion" },
    { header: "Orden", accessorKey: "orden" },
    { header: "Color", accessorKey: "color", cell: (row) => <ColorSwatch color={row.color} /> },
    { header: "Final", accessorKey: "esFinal", cell: (row) => <Pill on={row.esFinal} text={row.esFinal ? "Sí" : "No"} /> },
    { header: "Notificable", accessorKey: "notificable", cell: (row) => <Pill on={row.notificable} text={row.notificable ? "Sí" : "No"} /> },
    { header: "Creado", accessorKey: "creado" },
    { header: "Estado", accessorKey: "estado", cell: (row) => <StatusBadge status={row.estado} /> },
];

export default function EstadoTicketsView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<EstadoTicketRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<EstadoTicketFilters, EstadoTicketRow>({
            initialFilters,
            configs: filterConfig,
        });

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            setRows(baseRows);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando estados de tickets (mock):", error);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRows();
    }, [loadRows]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleHeaderFilterChange = useCallback(
        (id: string, value: string) => {
            setCurrentPage(1);
            handleFilterChange(id, value);
        },
        [handleFilterChange]
    );

    const handleExport = useCallback(() => {
        const headers = ["Nombre", "Descripción", "Orden", "Color", "Final", "Notificable", "Estado", "Creado"];
        const data = filteredRows.map((row) => [
            row.nombre,
            row.descripcion,
            row.orden,
            row.color,
            row.esFinal ? "Sí" : "No",
            row.notificable ? "Sí" : "No",
            row.estado,
            row.creado,
        ]);

        exportToCsv("estados-tickets.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/customers/csx/estado-ticket/nuevo"),
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
                    void loadRows();
                },
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [handleExport, loadRows, router]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Estados de tickets"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={handleHeaderFilterChange}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando estados...</p>
                    ) : (
                        <DataTable
                            data={paginatedRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="estado"
                            rowPaddingY={24}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: EstadoTicketRow) => router.push(`/customers/csx/estado-ticket/${row.id}`)}
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
