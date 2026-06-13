// app/warehouse-groups/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { Avatar } from "@/components/ui/user-avatar";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

export interface WarehouseGroup {
    id: string;
    name: string;
    location: string;
    dateCreated: string;
    userCreated: {
        name: string;
        email: string;
        avatar?: string;
    };
    dateModified: string;
    userModified: {
        name: string;
        email: string;
        avatar?: string;
    };
    status: "Active" | "Inactive";
}

type ApiWarehouseGroup = {
    id?: string | null;
    name?: string | null;
    location?: string | null;
    status?: string | null;
    dateCreated?: string | null;
    dateModified?: string | null;
    userCreated?: string | null;
    userModified?: string | null;
};

interface Filters {
    name: string;
    location: string;
    dateCreated: string;
    userCreated: string;
    dateModified: string;
    userModified: string;
}

const WAREHOUSE_GROUP_URL = `${BASE_WAREHOUSES}/warehouse-group`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});
const ITEMS_PER_PAGE = 10;

const initialFilters: Filters = {
    name: "",
    location: "",
    dateCreated: "",
    userCreated: "",
    dateModified: "",
    userModified: "",
};

const filterConfig: FilterConfig<Filters, WarehouseGroup>[] = [
    {
        id: "name",
        label: "Name",
        type: "text",
        rowValue: (row) => row.name,
    },
    {
        id: "location",
        label: "Location",
        type: "text",
        rowValue: (row) => row.location,
    },
    {
        id: "dateCreated",
        label: "Date created day",
        type: "datetime",
        match: (row, value) => row.dateCreated.startsWith(String(value ?? "")),
    },
    {
        id: "userCreated",
        label: "User created",
        type: "text",
        rowValue: (row) => row.userCreated.name,
    },
    {
        id: "dateModified",
        label: "Date modified day",
        type: "datetime",
        match: (row, value) => row.dateModified.startsWith(String(value ?? "")),
    },
    {
        id: "userModified",
        label: "User modified",
        type: "text",
        rowValue: (row) => row.userModified.name,
    },
];

function getColumns() {
    return [
        {
            accessorKey: "name" as const,
            header: "Name",
            cell: (row: WarehouseGroup) => (
                <span className="text-sm text-gray-800">{row.name}</span>
            ),
        },
        {
            accessorKey: "location" as const,
            header: "Location",
            cell: (row: WarehouseGroup) => (
                <span className="text-sm text-gray-600">{row.location}</span>
            ),
        },
        {
            accessorKey: "dateCreated" as const,
            header: "Date created",
            cell: (row: WarehouseGroup) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.dateCreated).toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "userCreated" as const,
            header: "User created",
            cell: (row: WarehouseGroup) => (
                <div className="flex items-center gap-2">
                    <Avatar
                        name={row.userCreated.name || row.userCreated.email || "-"}
                        src={row.userCreated.avatar}
                        alt={row.userCreated.name || row.userCreated.email || "-"}
                        className="h-6 w-6"
                    />
                    <div>
                        <div className="text-sm font-medium">{row.userCreated.name}</div>
                        <div className="text-xs text-gray-500">{row.userCreated.email}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "dateModified" as const,
            header: "Date modified",
            cell: (row: WarehouseGroup) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.dateModified).toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "userModified" as const,
            header: "User modified",
            cell: (row: WarehouseGroup) => (
                <div className="flex items-center gap-2">
                    <Avatar
                        name={row.userModified.name || row.userModified.email || "-"}
                        src={row.userModified.avatar}
                        alt={row.userModified.name || row.userModified.email || "-"}
                        className="h-6 w-6"
                    />
                    <div>
                        <div className="text-sm font-medium">{row.userModified.name}</div>
                        <div className="text-xs text-gray-500">
                            {row.userModified.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status" as const,
            header: "Status",
            cell: (row: WarehouseGroup) => (
                <span
                    className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${row.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-800"
                        }`}
                >
                    {row.status}
                </span>
            ),
        },
    ];
}

export function WarehouseGroupBrowsePage() {
    const router = useRouter();
    const [allRows, setAllRows] = useState<WarehouseGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<Filters, WarehouseGroup>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);

            const response = await fetch(WAREHOUSE_GROUP_URL, {
                method: "GET",
                headers: JANIS_HEADERS,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            const data = (await response.json()) as ApiWarehouseGroup[];
            const mapped: WarehouseGroup[] = (Array.isArray(data) ? data : []).map((item) => ({
                id: String(item.id || ""),
                name: String(item.name || "-"),
                location: String(item.location || "-"),
                dateCreated: String(item.dateCreated || ""),
                userCreated: {
                    name: String(item.userCreated || "-"),
                    email: "",
                },
                dateModified: String(item.dateModified || ""),
                userModified: {
                    name: String(item.userModified || "-"),
                    email: "",
                },
                status: String(item.status || "").toLowerCase() === "active" ? "Active" : "Inactive",
            }));

            setAllRows(mapped);
            setPage(1);
        } catch (error: any) {
            setAllRows([]);
            setErrorMessage(error?.message || "No se pudo cargar grupos de almacenes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const filtered = useMemo(() => applyFilters(allRows), [allRows, applyFilters]);
    const pageData = useMemo(
        () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
        [filtered, page]
    );

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [filtered.length, page]);

    const handleExport = useCallback(() => {
        const headers = [
            "Name",
            "Location",
            "Date created",
            "User created",
            "Date modified",
            "User modified",
            "Status",
        ];
        const rows = filtered.map((warehouseGroup) => [
            warehouseGroup.name,
            warehouseGroup.location,
            new Date(warehouseGroup.dateCreated).toLocaleString(),
            `${warehouseGroup.userCreated.name}${warehouseGroup.userCreated.email ? ` <${warehouseGroup.userCreated.email}>` : ""}`,
            new Date(warehouseGroup.dateModified).toLocaleString(),
            `${warehouseGroup.userModified.name}${warehouseGroup.userModified.email ? ` <${warehouseGroup.userModified.email}>` : ""}`,
            warehouseGroup.status,
        ]);
        exportToCsv("warehouse-groups.csv", [headers, ...rows]);
    }, [filtered]);

    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push("/almacen/configuracion/grupos/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "secondary" as const,
            onClick: handleExport,
            icon: <ArrowsUpDownIcon className="h-5 w-5" />,
        },
        {
            label: "Actualizar",
            variant: "primary" as const,
            onClick: () => {
                void fetchList();
            },
            icon: <ArrowsUpDownIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Warehouse Group Browse"
                description=""
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    {loading ? (
                        <div className="p-6 text-sm text-gray-500">Cargando grupos de almacenes...</div>
                    ) : (
                        <DataTable
                            data={pageData}
                            columns={getColumns()}
                            onRowClick={(warehouseGroup) => router.push(`/almacen/configuracion/grupos/${warehouseGroup.id}`)}
                            statusKey="status"
                            dataType="General"
                        />
                    )}
                </div>

                {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

                {filtered.length > 0 ? (
                    <div className="mt-4 flex flex-col items-center">
                        <Pagination
                            currentPage={page}
                            totalRecords={filtered.length}
                            pageSize={ITEMS_PER_PAGE}
                            onPageChange={setPage}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            {filtered.length} resultados
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
