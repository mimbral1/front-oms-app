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

type Estado = "Activo" | "Inactivo";

interface TransicionRow {
    id: number;
    claimMotive: string;
    nombre: string;
    descripcion: string;
    statusFrom: string;
    statusTo: string;
    color: string;
    permisoRequerido: boolean;
    statusResolucion: boolean;
    estado: Estado;
}

type TransicionFilters = {
    search: string;
    motive: string;
    from: string;
    to: string;
    estado: string;
};

const PER_PAGE = 20;

const initialFilters: TransicionFilters = {
    search: "",
    motive: "",
    from: "",
    to: "",
    estado: "",
};

const baseRows: TransicionRow[] = [
    {
        id: 1,
        claimMotive: "Devolución",
        nombre: "Cierre",
        descripcion: "Cierre con éxito",
        statusFrom: "En progreso",
        statusTo: "Finalizado con éxito",
        color: "#10B981",
        permisoRequerido: true,
        statusResolucion: true,
        estado: "Activo",
    },
    {
        id: 2,
        claimMotive: "Devolución",
        nombre: "Reapertura",
        descripcion: "Reabrir caso",
        statusFrom: "Finalizado con éxito",
        statusTo: "En progreso",
        color: "#F59E0B",
        permisoRequerido: false,
        statusResolucion: false,
        estado: "Activo",
    },
    {
        id: 3,
        claimMotive: "Cambio",
        nombre: "Escalar",
        descripcion: "Escalar a segundo nivel",
        statusFrom: "En progreso",
        statusTo: "Escalado",
        color: "#3B82F6",
        permisoRequerido: true,
        statusResolucion: false,
        estado: "Inactivo",
    },
    {
        id: 4,
        claimMotive: "Stockout",
        nombre: "Cancelar",
        descripcion: "Cancelación por stock",
        statusFrom: "En progreso",
        statusTo: "Cancelado",
        color: "#6B7280",
        permisoRequerido: false,
        statusResolucion: false,
        estado: "Activo",
    },
    {
        id: 5,
        claimMotive: "Devolución",
        nombre: "Aprobación",
        descripcion: "Aprobar devolución",
        statusFrom: "Inicio",
        statusTo: "En progreso",
        color: "#8B5CF6",
        permisoRequerido: true,
        statusResolucion: false,
        estado: "Activo",
    },
];

const filterConfig: FilterConfig<TransicionFilters, TransicionRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.nombre} ${row.descripcion}`.toLowerCase().includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "motive",
        label: "Motivo de reclamo",
        type: "select",
        options: [
            { label: "Devolución", value: "Devolución" },
            { label: "Cambio", value: "Cambio" },
            { label: "Stockout", value: "Stockout" },
        ],
        rowValue: (row) => row.claimMotive,
    },
    {
        id: "from",
        label: "Estado desde",
        type: "select",
        options: [
            { label: "Inicio", value: "Inicio" },
            { label: "En progreso", value: "En progreso" },
            { label: "Finalizado con éxito", value: "Finalizado con éxito" },
            { label: "Cancelado", value: "Cancelado" },
            { label: "Escalado", value: "Escalado" },
        ],
        rowValue: (row) => row.statusFrom,
    },
    {
        id: "to",
        label: "Estado hacia",
        type: "select",
        options: [
            { label: "Inicio", value: "Inicio" },
            { label: "En progreso", value: "En progreso" },
            { label: "Finalizado con éxito", value: "Finalizado con éxito" },
            { label: "Cancelado", value: "Cancelado" },
            { label: "Escalado", value: "Escalado" },
        ],
        rowValue: (row) => row.statusTo,
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
];

const Pill = ({ on, text }: { on: boolean; text: string }) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
        {text}
    </span>
);

const StatusBadge = ({ status }: { status: Estado }) => (
    <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${status === "Activo" ? "bg-green-500" : "bg-gray-400"}`}>
        {status}
    </div>
);

const ColorSwatch = ({ color }: { color: string }) => (
    <div className="flex items-center gap-2">
        <span
            className="inline-block h-4 w-4 rounded ring-1 ring-black/10"
            style={{ backgroundColor: color || "#e5e7eb" }}
        />
        <span className="text-xs text-gray-500">{color}</span>
    </div>
);

const getColumns = (): Column<TransicionRow>[] => [
    { header: "Motivo de reclamo", accessorKey: "claimMotive" },
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Descripción", accessorKey: "descripcion" },
    { header: "Estado desde", accessorKey: "statusFrom" },
    { header: "Estado hacia", accessorKey: "statusTo" },
    { header: "Color", accessorKey: "color", cell: (row) => <ColorSwatch color={row.color} /> },
    {
        header: "Permiso requerido",
        accessorKey: "permisoRequerido",
        cell: (row) => <Pill on={row.permisoRequerido} text={row.permisoRequerido ? "Sí" : "No"} />,
    },
    {
        header: "Estado de resolución",
        accessorKey: "statusResolucion",
        cell: (row) => <Pill on={row.statusResolucion} text={row.statusResolucion ? "Sí" : "No"} />,
    },
    { header: "Estado", accessorKey: "estado", cell: (row) => <StatusBadge status={row.estado} /> },
];

export default function TransicionesTicketsView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<TransicionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<TransicionFilters, TransicionRow>({
            initialFilters,
            configs: filterConfig,
        });

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            setRows(baseRows);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando transiciones (mock):", error);
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
        const headers = ["Claim motive", "Nombre", "Descripción", "Status from", "Status to", "Color", "Permiso requerido", "Status de resolución", "Estado"];
        const data = filteredRows.map((row) => [
            row.claimMotive,
            row.nombre,
            row.descripcion,
            row.statusFrom,
            row.statusTo,
            row.color,
            row.permisoRequerido ? "Sí" : "No",
            row.statusResolucion ? "Sí" : "No",
            row.estado,
        ]);

        exportToCsv("transiciones-tickets.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/customers/csx/transiciones-tickets/nuevo"),
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
                title="Transiciones"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={handleHeaderFilterChange}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando transiciones...</p>
                    ) : (
                        <DataTable
                            data={paginatedRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="estado"
                            rowPaddingY={24}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: TransicionRow) => router.push(`/customers/csx/transiciones-tickets/${row.id}`)}
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
