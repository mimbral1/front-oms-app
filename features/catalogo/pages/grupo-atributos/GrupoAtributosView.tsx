"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ArrowUpTrayIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";

/* ── Tipos ── */
interface ApiAttributeGroup {
    Id: number;
    Name: string;
    RefId: string;
    Created: string;
    CreatorUserName: string;
    CreatorUserEmail: string;
    DateModified: string;
    UserName: string;
    UserEmail: string;
    IsActive: boolean;
}

interface AttributeGroupRow {
    id: number;
    name: string;
    refId: string;
    created: string;
    creatorUserName: string;
    creatorUserEmail: string;
    dateModified: string;
    userName: string;
    userEmail: string;
    status: "Active" | "Inactive";
}

/* ── Mock data ── */
const MOCK_DATA: ApiAttributeGroup[] = [
    {
        Id: 1,
        Name: "Dimensiones",
        RefId: "DIM-123",
        Created: "25/01/2022 12:00",
        CreatorUserName: "Bruno Bellini",
        CreatorUserEmail: "bruno.bellini@fiz...",
        DateModified: "",
        UserName: "",
        UserEmail: "",
        IsActive: true,
    },
];

const PER_PAGE = 20;

const StatusPill = ({ active }: { active: boolean }) => (
    <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${active ? "bg-green-500" : "bg-gray-400"
            }`}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

const UserCell = ({ name, email }: { name: string; email: string }) =>
    name ? (
        <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
            </div>
            <div className="leading-tight">
                <span className="block text-sm font-medium text-gray-900">{name}</span>
                <span className="block text-xs text-gray-400">{email}</span>
            </div>
        </div>
    ) : (
        <span className="text-sm text-gray-400">-</span>
    );

function getColumns(): Column<AttributeGroupRow>[] {
    return [
        {
            header: "Name",
            accessorKey: "name",
            cell: (r) => <span className="text-sm font-medium text-gray-900">{r.name}</span>,
        },
        {
            header: "Ref ID",
            accessorKey: "refId",
            cell: (r) => <span className="text-sm font-semibold text-gray-700">{r.refId}</span>,
        },
        {
            header: "Created",
            accessorKey: "created",
            cell: (r) => <span className="text-sm text-gray-600">{r.created}</span>,
        },
        {
            header: "Creator user",
            accessorKey: "creatorUserName",
            cell: (r) => <UserCell name={r.creatorUserName} email={r.creatorUserEmail} />,
        },
        {
            header: "Modified",
            accessorKey: "dateModified",
            cell: (r) => <span className="text-sm text-gray-600">{r.dateModified || "-"}</span>,
        },
        {
            header: "User",
            accessorKey: "userName",
            cell: (r) => <UserCell name={r.userName} email={r.userEmail} />,
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (r) => <StatusPill active={r.status === "Active"} />,
        },
    ];
}

/* ── Filtros ── */
interface Filters {
    name: string;
    refId: string;
    accounts: string;
    creatorUser: string;
    dateFrom: string;
    dateTo: string;
    user: string;
}

const getFiltersConfig = (f: Filters) => [
    { id: "name", label: "Name", type: "text" as const, value: f.name },
    { id: "refId", label: "Ref ID", type: "text" as const, value: f.refId },
    {
        id: "accounts",
        label: "Accounts",
        type: "select" as const,
        value: f.accounts,
        options: [
            { label: "Todas", value: "" },
            { label: "Mimbral", value: "mimbral" },
        ],
    },
    {
        id: "creatorUser",
        label: "Creator user",
        type: "select" as const,
        value: f.creatorUser,
        options: [
            { label: "Todos", value: "" },
            { label: "Bruno Bellini", value: "Bruno Bellini" },
        ],
    },
    { id: "dateFrom", label: "Date from", type: "text" as const, value: f.dateFrom },
    { id: "dateTo", label: "Date to", type: "text" as const, value: f.dateTo },
    {
        id: "user",
        label: "User",
        type: "select" as const,
        value: f.user,
        options: [{ label: "Todos", value: "" }],
    },
];

/* ── Página principal ── */
export default function GrupoAtributosView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);

    const [rows, setRows] = useState<AttributeGroupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [filters, setFilters] = useState<Filters>({
        name: "",
        refId: "",
        accounts: "",
        creatorUser: "",
        dateFrom: "",
        dateTo: "",
        user: "",
    });

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 400));

            let data = [...MOCK_DATA];
            if (filters.name)
                data = data.filter((a) => a.Name.toLowerCase().includes(filters.name.toLowerCase()));
            if (filters.refId)
                data = data.filter((a) => a.RefId.toLowerCase().includes(filters.refId.toLowerCase()));

            const mapped: AttributeGroupRow[] = data.map((a) => ({
                id: a.Id,
                name: a.Name,
                refId: a.RefId,
                created: a.Created,
                creatorUserName: a.CreatorUserName,
                creatorUserEmail: a.CreatorUserEmail,
                dateModified: a.DateModified,
                userName: a.UserName,
                userEmail: a.UserEmail,
                status: a.IsActive ? "Active" : "Inactive",
            }));

            setRows(mapped);
            setTotalRecords(mapped.length);
        } catch {
            setRows([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleExport = useCallback(() => {
        const headers = ["Name", "Ref ID", "Created", "Creator user", "Modified", "User", "Status"];
        const data = rows.map((r) => [
            r.name, r.refId, r.created, r.creatorUserName,
            r.dateModified, r.userName, r.status,
        ]);
        exportToCsv("attribute-groups-export.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "New",
                variant: "success",
                onClick: () => router.push("/catalogo/grupo-atributos/nuevo"),
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
        [router, handleExport],
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Attribute groups"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                            <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
                            Cargando grupos de atributos…
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
                            No se encontraron grupos de atributos.
                        </div>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: AttributeGroupRow) =>
                                router.push(`/catalogo/grupo-atributos/${row.id}`)
                            }
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
