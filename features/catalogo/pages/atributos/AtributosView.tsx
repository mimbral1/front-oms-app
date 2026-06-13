"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowUpTrayIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

interface ApiAttribute {
    Id: number;
    Name: string;
    RefId: string;
    Group: string;
    Category: string;
    Mandatory: boolean;
    AppliesToSkus: boolean;
    Type: "text" | "number";
    DateModified: string;
    UserName: string;
    UserEmail: string;
    UserAvatar: string | null;
    IsActive: boolean;
}

interface AttributeRow {
    id: number;
    name: string;
    refId: string;
    group: string;
    category: string;
    mandatory: boolean;
    appliesToSkus: boolean;
    type: string;
    dateModified: string;
    userName: string;
    userEmail: string;
    userAvatar: string | null;
    status: "Active" | "Inactive";
}

const MOCK_ATTRIBUTES: ApiAttribute[] = [
    {
        Id: 1,
        Name: "Color",
        RefId: "color123",
        Group: "-",
        Category: "Limpieza y Cuidado del Hogar - Ferreteria - Iluminacion y Electricidad",
        Mandatory: false,
        AppliesToSkus: true,
        Type: "text",
        DateModified: "25/01/2022 10:16",
        UserName: "Bruno Bellini",
        UserEmail: "bruno.bellini@fiz...",
        UserAvatar: null,
        IsActive: true,
    },
    {
        Id: 2,
        Name: "Tamano",
        RefId: "tamano456",
        Group: "Dimensiones",
        Category: "Ferreteria - Construccion",
        Mandatory: true,
        AppliesToSkus: true,
        Type: "text",
        DateModified: "12/03/2022 14:30",
        UserName: "Maria Lopez",
        UserEmail: "maria.lopez@fiz...",
        UserAvatar: null,
        IsActive: true,
    },
    {
        Id: 3,
        Name: "Peso",
        RefId: "peso789",
        Group: "Dimensiones",
        Category: "Construccion",
        Mandatory: false,
        AppliesToSkus: false,
        Type: "number",
        DateModified: "08/05/2022 09:45",
        UserName: "Carlos Ruiz",
        UserEmail: "carlos.ruiz@fiz...",
        UserAvatar: null,
        IsActive: true,
    },
    {
        Id: 4,
        Name: "Material",
        RefId: "material101",
        Group: "-",
        Category: "Ferreteria - Iluminacion y Electricidad",
        Mandatory: true,
        AppliesToSkus: false,
        Type: "text",
        DateModified: "15/06/2022 11:20",
        UserName: "Bruno Bellini",
        UserEmail: "bruno.bellini@fiz...",
        UserAvatar: null,
        IsActive: false,
    },
];

interface Filters {
    name: string;
    refId: string;
    group: string;
    category: string;
    mandatory: string;
    appliesToSkus: string;
}

const PER_PAGE = 20;

const initialFilters: Filters = {
    name: "",
    refId: "",
    group: "",
    category: "",
    mandatory: "",
    appliesToSkus: "",
};

const filterConfig: FilterConfig<Filters, AttributeRow>[] = [
    {
        id: "name",
        label: "Name",
        type: "text",
        rowValue: (row) => row.name,
    },
    {
        id: "refId",
        label: "Ref ID",
        type: "text",
        rowValue: (row) => row.refId,
    },
    {
        id: "group",
        label: "Group",
        type: "select",
        options: [
            { label: "Dimensiones", value: "Dimensiones" },
            { label: "General", value: "General" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => row.group,
    },
    {
        id: "category",
        label: "Category",
        type: "select",
        options: [
            { label: "Ferreteria", value: "Ferreteria" },
            { label: "Construccion", value: "Construccion" },
            { label: "Iluminacion", value: "Iluminacion" },
        ],
        emptyOptionLabel: "Todas",
        rowValue: (row) => row.category,
        matchMode: "includes",
    },
    {
        id: "mandatory",
        label: "Mandatory",
        type: "select",
        options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => String(row.mandatory),
    },
    {
        id: "appliesToSkus",
        label: "Applies to SKUs",
        type: "select",
        options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
        ],
        emptyOptionLabel: "Todos",
        rowValue: (row) => String(row.appliesToSkus),
    },
];

const BoolPill = ({ value }: { value: boolean }) => (
    <span
        className={`inline-flex items-center justify-center rounded-full border px-3 py-0.5 text-xs font-medium ${value
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
    >
        {value ? "Yes" : "No"}
    </span>
);

const StatusPill = ({ active }: { active: boolean }) => (
    <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${active ? "bg-green-500" : "bg-gray-400"}`}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

function getColumns(): Column<AttributeRow>[] {
    return [
        {
            header: "Name",
            accessorKey: "name",
            cell: (row) => <span className="text-sm font-medium text-gray-900">{row.name}</span>,
        },
        {
            header: "Ref ID",
            accessorKey: "refId",
            cell: (row) => <span className="text-sm text-gray-600">{row.refId}</span>,
        },
        {
            header: "Group",
            accessorKey: "group",
            cell: (row) => <span className="text-sm text-gray-600">{row.group || "-"}</span>,
        },
        {
            header: "Category",
            accessorKey: "category",
            cell: (row) => <span className="line-clamp-2 text-sm text-gray-600">{row.category}</span>,
        },
        {
            header: "Mandatory",
            accessorKey: "mandatory",
            cell: (row) => <BoolPill value={row.mandatory} />,
        },
        {
            header: "Applies to SKUs",
            accessorKey: "appliesToSkus",
            cell: (row) => <BoolPill value={row.appliesToSkus} />,
        },
        {
            header: "Type",
            accessorKey: "type",
            cell: (row) => <span className="text-sm text-gray-600">{row.type}</span>,
        },
        {
            header: "Modified",
            accessorKey: "dateModified",
            cell: (row) => <span className="text-sm text-gray-600">{row.dateModified}</span>,
        },
        {
            header: "User",
            accessorKey: "userName",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                        {row.userName
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .slice(0, 2)}
                    </div>
                    <div className="leading-tight">
                        <span className="block text-sm font-medium text-gray-900">{row.userName}</span>
                        <span className="block text-xs text-gray-400">{row.userEmail}</span>
                    </div>
                </div>
            ),
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (row) => <StatusPill active={row.status === "Active"} />,
        },
    ];
}

export default function AtributosView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<AttributeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, AttributeRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const mapped: AttributeRow[] = MOCK_ATTRIBUTES.map((attribute) => ({
                id: attribute.Id,
                name: attribute.Name,
                refId: attribute.RefId,
                group: attribute.Group,
                category: attribute.Category,
                mandatory: attribute.Mandatory,
                appliesToSkus: attribute.AppliesToSkus,
                type: attribute.Type,
                dateModified: attribute.DateModified,
                userName: attribute.UserName,
                userEmail: attribute.UserEmail,
                userAvatar: attribute.UserAvatar,
                status: attribute.IsActive ? "Active" : "Inactive",
            }));
            setRows(mapped);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const pageRows = filteredRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    const handleExport = useCallback(() => {
        const headers = ["Name", "Ref ID", "Group", "Category", "Mandatory", "Applies to SKUs", "Type", "Modified", "User", "Status"];
        const data = filteredRows.map((row) => [
            row.name,
            row.refId,
            row.group,
            row.category,
            row.mandatory ? "Yes" : "No",
            row.appliesToSkus ? "Yes" : "No",
            row.type,
            row.dateModified,
            row.userName,
            row.status,
        ]);
        exportToCsv("attributes-export.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "New",
                variant: "success",
                onClick: () => router.push("/catalogo/atributos/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Export",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Import",
                variant: "secondary",
                onClick: () => console.log("Import"),
                icon: <ArrowUpTrayIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Attributes"
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
                        <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                            Cargando atributos...
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                            No se encontraron atributos.
                        </div>
                    ) : (
                        <DataTable
                            data={pageRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: AttributeRow) => router.push(`/catalogo/atributos/${row.id}`)}
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
