"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import { getEstadoColor } from "@/utils/status";
import { Avatar } from "@/components/ui/user-avatar";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

interface LabelRow {
    id: string;
    name: string;
    code: string;
    size: string;
    user_created: { initials: string; name: string; email: string };
    date_created: string;
    user_modified: { initials: string; name: string; email: string };
    date_modified: string;
    status: "Activo" | "Inactivo";
}

interface Filters {
    name: string;
    code: string;
    status: "" | "Activo" | "Inactivo";
}

const PER_PAGE = 10;

const initialFilters: Filters = {
    name: "",
    code: "",
    status: "",
};

const filterConfig: FilterConfig<Filters, LabelRow>[] = [
    {
        id: "name",
        label: "Nombre",
        type: "text",
        rowValue: (row) => row.name,
    },
    {
        id: "code",
        label: "Código",
        type: "text",
        rowValue: (row) => row.code,
    },
    {
        id: "status",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => row.status,
    },
];

const mockRows: LabelRow[] = [
    {
        id: "1",
        name: "Precio Rebajado",
        code: "label-promo",
        size: "10x8 cm",
        user_created: { initials: "JM", name: "Jonathan Molina", email: "jmolina@mimbral.cl" },
        date_created: "18/08/2025 10:12",
        user_modified: { initials: "JM", name: "Jonathan Molina", email: "jmolina@mimbral.cl" },
        date_modified: "18/08/2025 10:12",
        status: "Activo",
    },
    {
        id: "2",
        name: "Precio Oferta",
        code: "label-offer",
        size: "8x6 cm",
        user_created: { initials: "MC", name: "Marcelo Cancino", email: "mcancino@mimbral.cl" },
        date_created: "18/08/2025 10:12",
        user_modified: { initials: "MC", name: "Marcelo Cancino", email: "mcancino@mimbral.cl" },
        date_modified: "18/08/2025 10:12",
        status: "Activo",
    },
];

function UserChip({ initials, name, email }: { initials: string; name: string; email: string }) {
    return (
        <div className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
            <Avatar
                name={name || email || initials || "-"}
                alt={name || email || "-"}
                className="h-8 w-8"
            />
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-gray-500">{email}</span>
        </div>
    );
}

const getStatusColor = getEstadoColor;

function getColumns(): Column<LabelRow>[] {
    return [
        { header: "Nombre", accessorKey: "name", cell: (row) => row.name },
        { header: "Código", accessorKey: "code", cell: (row) => row.code },
        { header: "Tamaño", accessorKey: "size", cell: (row) => row.size },
        { header: "Usuario creador", accessorKey: "user_created", cell: (row) => <UserChip {...row.user_created} /> },
        { header: "Fecha creación", accessorKey: "date_created", cell: (row) => row.date_created },
        { header: "Usuario modificador", accessorKey: "user_modified", cell: (row) => <UserChip {...row.user_modified} /> },
        { header: "Fecha de modificación", accessorKey: "date_modified", cell: (row) => row.date_modified },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => (
                <span className={`inline-block rounded-full px-4 py-1 text-sm font-medium text-white ${getStatusColor(row.status)}`}>
                    {row.status}
                </span>
            ),
        },
    ];
}

export default function PriceLabelsView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [currentPage, setCurrentPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters, resetFilters } = useStandardFilters<Filters, LabelRow>({
        initialFilters,
        configs: filterConfig,
    });

    const filteredRows = useMemo(() => applyFilters(mockRows), [applyFilters]);
    const paginatedRows = useMemo(
        () => filteredRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
        [filteredRows, currentPage]
    );

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/catalogo/configuraciones-catalogo/etiquetas-de-precio/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary",
            onClick: () => {
                const headers = ["Nombre", "Código", "Tamaño", "Usuario creador", "Fecha creación", "Usuario modificador", "Fecha de modificación", "Estado"];
                const data = filteredRows.map((row) => [
                    row.name,
                    row.code,
                    row.size,
                    row.user_created.name,
                    row.date_created,
                    row.user_modified.name,
                    row.date_modified,
                    row.status,
                ]);
                exportToCsv("etiquetas-precio.csv", [headers, ...data]);
            },
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
        {
            label: "Actualizar",
            variant: "secondary",
            onClick: () => {
                setCurrentPage(1);
                resetFilters();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Etiquetas de precio"
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={paginatedRows}
                            dataType="General2"
                            statusKey="status"
                            columns={columns}
                            rowBgClass="bg-white"
                            rowPaddingY={12}
                            onRowClick={(row: LabelRow) => router.push(`/catalogo/configuraciones-catalogo/etiquetas-de-precio/${encodeURIComponent(row.id)}`)}
                        />
                    </div>

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
