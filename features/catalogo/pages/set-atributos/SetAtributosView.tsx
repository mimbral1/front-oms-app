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
    PlusIcon,
} from "@heroicons/react/24/outline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

interface ApiAttributeSet {
    Id: number;
    Name: string;
    RefId: string;
    CreatorUserName: string;
    CreatorUserEmail: string;
    Created: string;
    UserName: string;
    UserEmail: string;
    DateModified: string;
    IsActive: boolean;
}

interface AttributeSetRow {
    id: number;
    name: string;
    refId: string;
    creatorUserName: string;
    creatorUserEmail: string;
    created: string;
    userName: string;
    userEmail: string;
    dateModified: string;
    status: "Active" | "Inactive";
}

const MOCK_DATA: ApiAttributeSet[] = [
    {
        Id: 1,
        Name: "Dimensiones",
        RefId: "atr-set",
        CreatorUserName: "Bruno Bellini",
        CreatorUserEmail: "bruno.bellini@fiz...",
        Created: "25/01/2022 12:18",
        UserName: "",
        UserEmail: "",
        DateModified: "",
        IsActive: true,
    },
];

interface Filters {
    name: string;
    refId: string;
    creatorUser: string;
    dateFrom: string;
    dateTo: string;
    user: string;
    modifiedFrom: string;
    modifiedTo: string;
}

const PER_PAGE = 20;

const initialFilters: Filters = {
    name: "",
    refId: "",
    creatorUser: "",
    dateFrom: "",
    dateTo: "",
    user: "",
    modifiedFrom: "",
    modifiedTo: "",
};

const filterConfig: FilterConfig<Filters, AttributeSetRow>[] = [
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
        id: "creatorUser",
        label: "Creator user",
        type: "select",
        options: [{ label: "Bruno Bellini", value: "Bruno Bellini" }],
        emptyOptionLabel: "Todos",
        rowValue: (row) => row.creatorUserName,
    },
    {
        id: "dateFrom",
        label: "Date from",
        type: "text",
    },
    {
        id: "dateTo",
        label: "Date to",
        type: "text",
    },
    {
        id: "user",
        label: "User",
        type: "select",
        options: [],
        emptyOptionLabel: "Todos",
        rowValue: (row) => row.userName,
    },
    {
        id: "modifiedFrom",
        label: "Date from",
        type: "text",
    },
    {
        id: "modifiedTo",
        label: "Date to",
        type: "text",
    },
];

const StatusPill = ({ active }: { active: boolean }) => (
    <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${active ? "bg-green-500" : "bg-gray-400"}`}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

const UserCell = ({ name, email }: { name: string; email: string }) =>
    name ? (
        <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                {name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </div>
            <div className="leading-tight">
                <span className="block text-sm font-medium text-gray-900">{name}</span>
                <span className="block text-xs text-gray-400">{email}</span>
            </div>
        </div>
    ) : (
        <span className="text-sm text-gray-400">-</span>
    );

function getColumns(): Column<AttributeSetRow>[] {
    return [
        {
            header: "Name",
            accessorKey: "name",
            cell: (row) => <span className="text-sm font-medium text-gray-900">{row.name}</span>,
        },
        {
            header: "Ref ID",
            accessorKey: "refId",
            cell: (row) => <span className="text-sm font-semibold text-gray-700">{row.refId}</span>,
        },
        {
            header: "Creator user",
            accessorKey: "creatorUserName",
            cell: (row) => <UserCell name={row.creatorUserName} email={row.creatorUserEmail} />,
        },
        {
            header: "Created",
            accessorKey: "created",
            cell: (row) => <span className="text-sm text-gray-600">{row.created}</span>,
        },
        {
            header: "User",
            accessorKey: "userName",
            cell: (row) => <UserCell name={row.userName} email={row.userEmail} />,
        },
        {
            header: "Modified",
            accessorKey: "dateModified",
            cell: (row) => <span className="text-sm text-gray-600">{row.dateModified || "-"}</span>,
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (row) => <StatusPill active={row.status === "Active"} />,
        },
    ];
}

export default function SetAtributosView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<AttributeSetRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, AttributeSetRow>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 400));
            const mapped: AttributeSetRow[] = MOCK_DATA.map((item) => ({
                id: item.Id,
                name: item.Name,
                refId: item.RefId,
                creatorUserName: item.CreatorUserName,
                creatorUserEmail: item.CreatorUserEmail,
                created: item.Created,
                userName: item.UserName,
                userEmail: item.UserEmail,
                dateModified: item.DateModified,
                status: item.IsActive ? "Active" : "Inactive",
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
        const headers = ["Name", "Ref ID", "Creator user", "Created", "User", "Modified", "Status"];
        const data = filteredRows.map((row) => [
            row.name,
            row.refId,
            row.creatorUserName,
            row.created,
            row.userName,
            row.dateModified,
            row.status,
        ]);
        exportToCsv("attribute-sets-export.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "New",
                variant: "success",
                onClick: () => router.push("/catalogo/set-atributos/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Export",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
        ],
        [router, handleExport]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Attribute set browse"
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
                            Cargando sets de atributos...
                        </div>
                    ) : filteredRows.length === 0 ? (
                        <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                            No se encontraron sets de atributos.
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
                            onRowClick={(row: AttributeSetRow) => router.push(`/catalogo/set-atributos/${row.id}`)}
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
