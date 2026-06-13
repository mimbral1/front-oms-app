// views\Almacen\Gestion\StockDecision\StockDecisionView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { type Estado, getEstadoColor } from "@/utils/status";
import { PlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type StockDecisionRow = {
    id: string;
    nombre: string;
    version: string;
    engine: string;
    estado: Estado;
    updatedAt: string;
};

interface Filters {
    search: string;
    estado: string;
}

const MOCK_DATA: StockDecisionRow[] = [
    {
        id: "1",
        nombre: "Default",
        version: "v3",
        engine: "Advanced",
        estado: "Activo",
        updatedAt: "2025-11-09 14:22",
    },
    {
        id: "2",
        nombre: "Express",
        version: "v1",
        engine: "Advanced",
        estado: "Activo",
        updatedAt: "2025-10-21 09:10",
    },
    {
        id: "3",
        nombre: "Low stock fallback",
        version: "v2",
        engine: "Basic",
        estado: "Inactivo",
        updatedAt: "2025-09-18 18:47",
    },
];

const PER_PAGE = 20;
const getStatusColor = getEstadoColor;

const initialFilters: Filters = {
    search: "",
    estado: "",
};

const filterConfig: FilterConfig<Filters, StockDecisionRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.nombre} ${row.version} ${row.engine} ${row.estado}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
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

function getColumns(): Column<StockDecisionRow>[] {
    return [
        {
            header: "Nombre",
            accessorKey: "nombre",
            cell: (row) => <div className="flex w-[360px] flex-col">{row.nombre}</div>,
        },
        {
            header: "Versión",
            accessorKey: "version",
            cell: (row) => <div className="flex w-[360px] flex-col">{row.version}</div>,
        },
        {
            header: "Motor",
            accessorKey: "engine",
            cell: (row) => <div className="flex w-[360px] flex-col">{row.engine}</div>,
        },
        {
            header: "Última actualización",
            accessorKey: "updatedAt",
            cell: (row) => <div className="flex w-[360px] flex-col">{row.updatedAt}</div>,
        },
        {
            header: "Estado",
            accessorKey: "estado",
            cell: (row) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
                        row.estado
                    )}`}
                >
                    {row.estado}
                </div>
            ),
        },
    ];
}

export default function StockDecisionView() {
    const router = useRouter();
    const pathname = usePathname();
    const columns = useMemo(() => getColumns(), []);
    const baseRoute = pathname?.startsWith("/almacen/inventario/cambios-stock")
        ? "/almacen/inventario/cambios-stock"
        : "/almacen/gestion/stock-decision";

    const [rows, setRows] = useState<StockDecisionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, StockDecisionRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        setLoading(true);
        setRows([...MOCK_DATA]);
        setCurrentPage(1);
        setLoading(false);
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const pageRows = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, filteredRows.length]);

    const handleExport = useCallback(() => {
        const headers = ["Nombre", "Versión", "Motor", "Estado", "Actualizado"];
        const data = filteredRows.map((row) => [
            row.nombre,
            row.version,
            row.engine,
            row.estado,
            row.updatedAt,
        ]);

        exportToCsv("stock-decision.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => router.push(`${baseRoute}/nuevo`),
            },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
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
        ],
        [baseRoute, fetchList, handleExport, router]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Stock Decision"
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
                        <div className="mt-6 overflow-x-auto rounded-md border bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                                            Cargando...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <DataTable
                            data={pageRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="estado"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: StockDecisionRow) =>
                                router.push(`${baseRoute}/${row.id}`)
                            }
                        />
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalRecords={filteredRows.length}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
