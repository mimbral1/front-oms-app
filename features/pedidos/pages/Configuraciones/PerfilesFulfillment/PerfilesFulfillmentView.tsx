// views\PedidosView\Configuraciones\PerfilesFulfillment\PerfilesFulfillmentView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

type Estado = "Activo" | "Inactivo";

interface FulfillmentProfileRow {
    id: number;
    name: string;
    engine: "Advanced" | "Basic" | string;
    deliveryTypes: string[];
    status: Estado;
}

const PER_PAGE = 20;
const getStatusColor = (status: Estado) => (status === "Activo" ? "bg-green-500" : "bg-gray-400");

function getColumns(): Column<FulfillmentProfileRow>[] {
    return [
        {
            header: "Nombre",
            accessorKey: "name",
            cell: (row) => (
                <div className="flex w-[360px] flex-col">
                    <span className="font-medium text-gray-900">{row.name}</span>
                </div>
            ),
        },
        {
            header: "Motor",
            accessorKey: "engine",
            cell: (row) => (
                <div className="flex w-[360px] flex-col">
                    <span className="font-medium text-gray-900">{row.engine}</span>
                </div>
            ),
        },
        {
            header: "Tipo de entrega",
            accessorKey: "deliveryTypes",
            cell: (row) => (
                <div className="flex w-[360px] flex-col">
                    <span className="text-gray-700">{row.deliveryTypes.join(" | ")}</span>
                </div>
            ),
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (row) => (
                <div
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
                        row.status
                    )}`}
                >
                    {row.status}
                </div>
            ),
        },
    ];
}

const MOCK_ROWS: FulfillmentProfileRow[] = [
    {
        id: 1,
        name: "Janis Order - Pilar",
        engine: "Advanced",
        deliveryTypes: ["delivery", "store_pickup"],
        status: "Activo",
    },
    {
        id: 2,
        name: "Store pickup - Consolidar",
        engine: "Advanced",
        deliveryTypes: ["drive_through", "store_pickup"],
        status: "Activo",
    },
    {
        id: 3,
        name: "default",
        engine: "Advanced",
        deliveryTypes: ["express_delivery", "delivery"],
        status: "Activo",
    },
];

interface Filters {
    name: string;
    engine: string;
    status: string;
}

const initialFilters: Filters = {
    name: "",
    engine: "",
    status: "",
};

const filterConfig: FilterConfig<Filters, FulfillmentProfileRow>[] = [
    {
        id: "name",
        label: "Nombre",
        type: "text",
        rowValue: (row) => row.name,
    },
    {
        id: "engine",
        label: "Motor",
        type: "select",
        options: [
            { label: "Advanced", value: "Advanced" },
            { label: "Basic", value: "Basic" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => row.engine,
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

export default function PerfilesFulfillmentView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows] = useState<FulfillmentProfileRow[]>(MOCK_ROWS);
    const [currentPage, setCurrentPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, FulfillmentProfileRow>({
            initialFilters,
            configs: filterConfig,
        });

    const filtered = applyFilters(rows);
    const totalRecords = filtered.length;
    const pageStart = (currentPage - 1) * PER_PAGE;
    const pageRows = filtered.slice(pageStart, pageStart + PER_PAGE);

    const handleExport = () => {
        const headers = ["Nombre", "Motor", "Tipo de entrega", "Estado"];
        const data = filtered.map((row) => [
            row.name,
            row.engine,
            row.deliveryTypes.join("|"),
            row.status,
        ]);
        exportToCsv("perfiles-fulfillment.csv", [headers, ...data]);
    };

    const headerActions: Action[] = [
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/pedidos/configuraciones/perfiles-fulfillment/nuevo"),
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
            onClick: () => {},
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Perfiles de Fulfillment"
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
                        onRowClick={(row: FulfillmentProfileRow) =>
                            router.push(`/pedidos/configuraciones/perfiles-fulfillment/${row.id}`)
                        }
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
