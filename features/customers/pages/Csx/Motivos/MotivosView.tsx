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
import { type Estado, getEstadoColor } from "@/utils/status";

interface MotivoRow {
    id: number;
    nombre: string;
    descripcion: string;
    logistica: boolean;
    defaultStockout: boolean;
    estado: Estado;
    creado: string;
}

type MotivoFilters = {
    search: string;
    estado: string;
};

const PER_PAGE = 20;

const initialFilters: MotivoFilters = {
    search: "",
    estado: "",
};

const baseRows: MotivoRow[] = [
    { id: 1, nombre: "Devolución", descripcion: "Devolución de mercadería", logistica: true, defaultStockout: false, estado: "Activo", creado: "07/06/2023 12:01:42" },
    { id: 2, nombre: "Cambio", descripcion: "Cambio por talla/color", logistica: false, defaultStockout: false, estado: "Activo", creado: "02/05/2023 09:15:10" },
    { id: 3, nombre: "Stockout", descripcion: "Falta de stock", logistica: false, defaultStockout: true, estado: "Inactivo", creado: "18/04/2023 16:44:20" },
    { id: 4, nombre: "Daño", descripcion: "Producto dañado", logistica: true, defaultStockout: false, estado: "Activo", creado: "12/03/2023 11:03:00" },
    { id: 5, nombre: "Pedido", descripcion: "Pedido del cliente", logistica: false, defaultStockout: false, estado: "Inactivo", creado: "25/02/2023 08:22:31" },
];

const filterConfig: FilterConfig<MotivoFilters, MotivoRow>[] = [
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
];

const Pill = ({ on, text }: { on: boolean; text: string }) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
        {text}
    </span>
);

const getColumns = (): Column<MotivoRow>[] => [
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Descripción", accessorKey: "descripcion" },
    {
        header: "Logística",
        accessorKey: "logistica",
        cell: (row) => <Pill on={row.logistica} text={row.logistica ? "Sí" : "No"} />,
    },
    {
        header: "Default (stockout)",
        accessorKey: "defaultStockout",
        cell: (row) => <Pill on={row.defaultStockout} text={row.defaultStockout ? "Sí" : "No"} />,
    },
    { header: "Creado", accessorKey: "creado" },
    {
        header: "Estado",
        accessorKey: "estado",
        cell: (row) => (
            <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getEstadoColor(row.estado)}`}>
                {row.estado}
            </div>
        ),
    },
];

export default function MotivosView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<MotivoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<MotivoFilters, MotivoRow>({
            initialFilters,
            configs: filterConfig,
        });

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            setRows(baseRows);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando motivos (mock):", error);
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
        const headers = ["Nombre", "Descripción", "Logística", "Default (stockout)", "Estado", "Creado"];
        const data = filteredRows.map((row) => [
            row.nombre,
            row.descripcion,
            row.logistica ? "Sí" : "No",
            row.defaultStockout ? "Sí" : "No",
            row.estado,
            row.creado,
        ]);

        exportToCsv("motivos.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/customers/csx/motivos/nuevo"),
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
                title="Motivos"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={handleHeaderFilterChange}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando motivos...</p>
                    ) : (
                        <DataTable
                            data={paginatedRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="estado"
                            rowPaddingY={24}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: MotivoRow) => router.push(`/customers/csx/motivos/${row.id}`)}
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
