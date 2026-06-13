"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { type Estado, getEstadoColor } from "@/utils/status";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { ProductGroupIcon } from "@/features/catalogo/components/configuraciones-catalogo/grupos-de-productos/product-group-icons";

interface ProductGroupRow {
    id: number;
    name: string;
    referenceId: string;
    icon: string;
    isProcessing: boolean;
    updatedAt: string;
    userName: string;
    userEmail: string;
    status: Estado;
}

interface Filters {
    search: string;
    isProcessing: string;
    isActive: string;
    userCreated: string;
}

const PER_PAGE = 20;
const getStatusColor = getEstadoColor;

const initialFilters: Filters = {
    search: "",
    isProcessing: "",
    isActive: "",
    userCreated: "",
};

const filterConfig: FilterConfig<Filters, ProductGroupRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        rowValue: (row) => [row.name, row.referenceId],
    },
    {
        id: "isProcessing",
        label: "Está procesando",
        type: "select",
        options: [
            { label: "Sí", value: "1" },
            { label: "No", value: "0" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => (row.isProcessing ? "1" : "0"),
    },
    {
        id: "isActive",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "1" },
            { label: "Inactivo", value: "0" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => (row.status === "Activo" ? "1" : "0"),
    },
    {
        id: "userCreated",
        label: "Usuario creador",
        type: "text",
        rowValue: (row) => [row.userName, row.userEmail],
    },
];

const Pill = ({ on, text }: { on: boolean; text: string }) => (
    <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
    >
        {text}
    </span>
);

function getColumns(): Column<ProductGroupRow>[] {
    return [
        { header: "Nombre", accessorKey: "name" },
        {
            header: "Ref ID",
            accessorKey: "referenceId",
            cell: (row) => <CopyableText text={row.referenceId}>{row.referenceId}</CopyableText>,
        },
        {
            header: "Ícono",
            accessorKey: "icon",
            cell: (row) => (
                <span className="inline-flex items-center justify-center text-[#8b9aba]">
                    <ProductGroupIcon iconKey={row.icon} className="h-5 w-5 stroke-[1.8]" />
                </span>
            ),
        },
        { header: "Modificado", accessorKey: "updatedAt" },
        {
            header: "Usuario",
            accessorKey: "userName",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white">
                        {(row.userName || "?")
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm text-gray-900">{row.userName || "-"}</span>
                        <span className="text-xs text-gray-500">{row.userEmail || "-"}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Está procesando",
            accessorKey: "isProcessing",
            cell: (row) => <Pill on={row.isProcessing} text={row.isProcessing ? "Sí" : "No"} />,
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(row.status)}`}
                >
                    {row.status}
                </div>
            ),
        },
    ];
}

const MOCK_ROWS: ProductGroupRow[] = [
    { id: 1, name: "Candidatos pendientes", referenceId: "CP02", icon: "wind", updatedAt: "30/06/2025 12:18", userName: "Ariel Mikowski", userEmail: "ariel.mikowski@...", isProcessing: false, status: "Inactivo" },
    { id: 2, name: "Congelados", referenceId: "congelados", icon: "snowflake", updatedAt: "08/02/2023 15:25", userName: "", userEmail: "", isProcessing: true, status: "Activo" },
    { id: 3, name: "Electro", referenceId: "Electro - Belgrano", icon: "shopping-bag", updatedAt: "15/08/2025 15:20", userName: "", userEmail: "", isProcessing: false, status: "Inactivo" },
    { id: 4, name: "Pesable calcesur", referenceId: "QxKg", icon: "scale", updatedAt: "29/07/2025 09:56", userName: "", userEmail: "", isProcessing: false, status: "Inactivo" },
    { id: 5, name: "Pesables", referenceId: "PES1234", icon: "scale", updatedAt: "21/11/2024 17:42", userName: "", userEmail: "", isProcessing: true, status: "Activo" },
    { id: 6, name: "Preparables", referenceId: "Prep-04", icon: "beaker", updatedAt: "27/08/2025 15:59", userName: "", userEmail: "", isProcessing: true, status: "Activo" },
    { id: 7, name: "Recetados", referenceId: "RCTD", icon: "archive-box", updatedAt: "08/08/2024 17:29", userName: "Ariel Mikowski", userEmail: "ariel.mikowski@...", isProcessing: false, status: "Activo" },
    { id: 8, name: "Yogurt - Lote y vencimiento", referenceId: "yogurt", icon: "swatch", updatedAt: "20/03/2025 13:26", userName: "Ariel Mikowski", userEmail: "ariel.mikowski@...", isProcessing: false, status: "Inactivo" },
];

export default function GruposProductoView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [currentPage, setCurrentPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters } = useStandardFilters<Filters, ProductGroupRow>({
        initialFilters,
        configs: filterConfig,
    });

    const filteredRows = useMemo(() => applyFilters(MOCK_ROWS), [applyFilters]);
    const totalRecords = filteredRows.length;
    const pageRows = filteredRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const handleExport = useCallback(() => {
        const headers = ["Nombre", "Ref ID", "Is processing", "Ícono", "Modificado", "Usuario", "Email", "Estado"];
        const data = filteredRows.map((row) => [
            row.name,
            row.referenceId,
            row.isProcessing ? "Sí" : "No",
            row.icon,
            row.updatedAt,
            row.userName,
            row.userEmail,
            row.status,
        ]);
        exportToCsv("grupos-producto.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/catalogo/configuraciones-catalogo/grupos-de-productos/nuevo"),
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
                onClick: () => setCurrentPage(1),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Grupos de producto"
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
                    <DataTable
                        data={pageRows}
                        columns={columns}
                        dataType="General2"
                        statusKey="status"
                        rowPaddingY={12}
                        showStatusBorder
                        rowBgClass="bg-white"
                        onRowClick={(row: ProductGroupRow) => router.push(`/catalogo/configuraciones-catalogo/grupos-de-productos/${row.id}`)}
                    />

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
