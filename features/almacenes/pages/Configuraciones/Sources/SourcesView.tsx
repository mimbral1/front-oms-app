// app/views/Almacen/Configuracion/Sources/SourcesView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { type Estado, getEstadoColor } from "@/utils/status";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

interface SourceRow {
    id: string;
    sourceName: string;
    sourceDescription: string;
    refId: string;
    code: string;
    warehouseName: string;
    warehouseCode: string;
    location: string;
    platform: string;
    channels: string[];
    status: Estado;
}

interface Filters {
    search: string;
    estado: string;
    platform: string;
}

const MOCK_SOURCES: SourceRow[] = [
    {
        id: "CD_TALCA",
        sourceName: "CD Talca - Adobe Source",
        sourceDescription: "Source principal de Adobe para CD Talca",
        refId: "AC_SOURCE_CD_TALCA",
        code: "talca_source_1",
        warehouseName: "CD Talca",
        warehouseCode: "CD_TALCA",
        location: "Talca - Centro Distribución",
        platform: "adobe-commerce",
        channels: ["B2C_WEB", "B2B_EMPRESA"],
        status: "Activo",
    },
    {
        id: "TIENDA_CHORRILLOS",
        sourceName: "Tienda Chorrillos - Adobe Source",
        sourceDescription: "Source vinculado a tienda física para stock de góndola",
        refId: "AC_SOURCE_TIENDA_CHORRILLOS",
        code: "chorrillos_source_1",
        warehouseName: "Tienda Chorrillos",
        warehouseCode: "TIENDA_CHORRILLOS",
        location: "San Javier - Tienda Chorrillos",
        platform: "adobe-commerce",
        channels: ["B2C_WEB"],
        status: "Activo",
    },
];

const PER_PAGE = 20;
const getStatusColor = getEstadoColor;

const initialFilters: Filters = {
    search: "",
    estado: "",
    platform: "",
};

const filterConfig: FilterConfig<Filters, SourceRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        placeholder: "Nombre, refId, warehouse...",
        match: (row, value) =>
            `${row.sourceName} ${row.refId} ${row.warehouseName} ${row.location}`
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
        rowValue: (row) => row.status,
    },
    {
        id: "platform",
        label: "Plataforma",
        type: "select",
        options: [
            { label: "adobe-commerce", value: "adobe-commerce" },
        ],
        rowValue: (row) => row.platform,
    },
];

const Pill = ({ text }: { text: string }) => (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        {text}
    </span>
);

function getColumns(): Column<SourceRow>[] {
    return [
        {
            header: "Source",
            accessorKey: "sourceName",
            cell: (row) => (
                <div className="flex w-[360px] flex-col">
                    <span className="font-medium text-gray-900">{row.sourceName}</span>
                    <span className="text-xs text-gray-500">{row.sourceDescription}</span>
                </div>
            ),
        },
        {
            header: "RefID / Código",
            accessorKey: "refId",
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span className="text-gray-900">{row.refId}</span>
                    <span className="text-xs text-gray-500">{row.code}</span>
                </div>
            ),
        },
        {
            header: "Almacén",
            accessorKey: "warehouseName",
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span className="text-gray-900">{row.warehouseName}</span>
                    <span className="text-xs text-gray-500">{row.warehouseCode}</span>
                </div>
            ),
        },
        { header: "Ubicación", accessorKey: "location" },
        {
            header: "Plataforma",
            accessorKey: "platform",
            cell: (row) => <Pill text={row.platform} />,
        },
        {
            header: "Canales",
            accessorKey: "channels",
            cell: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.channels.map((channel) => (
                        <Pill key={channel} text={channel} />
                    ))}
                </div>
            ),
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => (
                <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(row.status)}`}>
                    {row.status}
                </div>
            ),
        },
    ];
}

export default function SourcesView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<SourceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, SourceRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            setRows(MOCK_SOURCES);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando sources:", error);
            setRows([]);
            setErrorMessage("Error al cargar sources.");
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
        const headers = ["Source", "Descripción", "RefID", "Código", "Warehouse", "Location", "Plataforma", "Canales", "Estado"];
        const data = filteredRows.map((row) => [
            row.sourceName,
            row.sourceDescription,
            row.refId,
            row.code,
            row.warehouseName,
            row.location,
            row.platform,
            row.channels.join(", "),
            row.status,
        ]);

        exportToCsv("sources.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo source",
                variant: "success",
                onClick: () => router.push("/almacen/configuracion/sources/nuevo"),
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
                title="Sources"
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
                    ) : errorMessage ? (
                        <div
                            className="mt-6 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">Error al cargar sources</h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                            No hay sources que coincidan con los filtros seleccionados.
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={pageRows}
                                columns={columns}
                                dataType="General2"
                                rowPaddingY={12}
                                rowBgClass="bg-white"
                                onRowClick={(row: SourceRow) =>
                                    router.push(`/almacen/configuracion/sources/${row.id}`)
                                }
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
