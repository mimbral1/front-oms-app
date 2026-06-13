// app/templates/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ArrowsUpDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

export interface Template {
    id: string;
    service: string;
    entity: string;
    code: string;
    dateCreated: string;
    userCreated: string;
    dateModified: string;
    status: "Active" | "Inactive";
}

export const mockTemplates: Template[] = [
    {
        id: "TPL001",
        service: "WMS",
        entity: "position",
        code: "labels",
        dateCreated: "2025-04-10",
        userCreated: "alice@example.com",
        dateModified: "2025-04-12",
        status: "Active",
    },
    {
        id: "TPL002",
        service: "ERP",
        entity: "location",
        code: "slots",
        dateCreated: "2025-03-28",
        userCreated: "bob@example.com",
        dateModified: "2025-04-01",
        status: "Inactive",
    },
    {
        id: "TPL003",
        service: "Mobi",
        entity: "order",
        code: "shipping",
        dateCreated: "2025-02-15",
        userCreated: "carla@example.com",
        dateModified: "2025-03-01",
        status: "Active",
    },
    {
        id: "TPL004",
        service: "API",
        entity: "user",
        code: "auth",
        dateCreated: "2025-01-05",
        userCreated: "david@example.com",
        dateModified: "2025-01-20",
        status: "Active",
    },
    {
        id: "TPL005",
        service: "WMS",
        entity: "inventory",
        code: "reorder",
        dateCreated: "2024-12-30",
        userCreated: "eva@example.com",
        dateModified: "2025-01-10",
        status: "Inactive",
    },
];

interface TemplateFilters {
    service: string;
    position: string;
    code: string;
    dateCreated: string;
    userCreated: string;
    dateModified: string;
}

const ITEMS_PER_PAGE = 10;

const initialFilters: TemplateFilters = {
    service: "",
    position: "",
    code: "",
    dateCreated: "",
    userCreated: "",
    dateModified: "",
};

const filterConfig: FilterConfig<TemplateFilters, Template>[] = [
    {
        id: "service",
        label: "Service",
        type: "select",
        options: [
            { label: "WMS", value: "WMS" },
            { label: "ERP", value: "ERP" },
            { label: "Mobi", value: "Mobi" },
            { label: "API", value: "API" },
        ],
        rowValue: (row) => row.service,
    },
    {
        id: "position",
        label: "Position",
        type: "text",
        rowValue: (row) => row.entity,
    },
    {
        id: "code",
        label: "Code",
        type: "text",
        rowValue: (row) => row.code,
    },
    {
        id: "dateCreated",
        label: "Date created day",
        type: "datetime",
        match: (row, value) => row.dateCreated === String(value ?? ""),
    },
    {
        id: "userCreated",
        label: "User created",
        type: "text",
        rowValue: (row) => row.userCreated,
    },
    {
        id: "dateModified",
        label: "Date modified day",
        type: "datetime",
        match: (row, value) => row.dateModified === String(value ?? ""),
    },
];

function getColumns() {
    return [
        {
            accessorKey: "service" as const,
            header: "Service",
            cell: (row: Template) => (
                <span className="text-sm text-gray-800">{row.service}</span>
            ),
        },
        {
            accessorKey: "entity" as const,
            header: "Entity",
            cell: (row: Template) => (
                <span className="text-sm text-gray-600">{row.entity}</span>
            ),
        },
        {
            accessorKey: "code" as const,
            header: "Code",
            cell: (row: Template) => (
                <span className="text-sm text-gray-800">{row.code}</span>
            ),
        },
        {
            accessorKey: "dateCreated" as const,
            header: "Date created",
            cell: (row: Template) => (
                <span className="text-sm text-gray-600">{row.dateCreated}</span>
            ),
        },
        {
            accessorKey: "userCreated" as const,
            header: "User created",
            cell: (row: Template) => (
                <span className="text-sm text-gray-600">{row.userCreated}</span>
            ),
        },
        {
            accessorKey: "dateModified" as const,
            header: "Date modified",
            cell: (row: Template) => (
                <span className="text-sm text-gray-600">{row.dateModified}</span>
            ),
        },
        {
            accessorKey: "status" as const,
            header: "Status",
            cell: (row: Template) => (
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

export function TemplatesView() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<TemplateFilters, Template>({
            initialFilters,
            configs: filterConfig,
        });

    const filtered = useMemo(() => applyFilters(mockTemplates), [applyFilters]);
    const pageData = useMemo(
        () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
        [filtered, page]
    );

    const handleExport = () => {
        const headers = [
            "Service",
            "Entity",
            "Code",
            "Date created",
            "User created",
            "Date modified",
            "Status",
        ];
        const rows = filtered.map((template) => [
            template.service,
            template.entity,
            template.code,
            template.dateCreated,
            template.userCreated,
            template.dateModified,
            template.status,
        ]);
        exportToCsv("templates.csv", [headers, ...rows]);
    };

    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push("/almacen/configuracion/etiquetas/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "secondary" as const,
            onClick: handleExport,
            icon: <ArrowsUpDownIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Templates"
                description=""
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <div className="overflow-hidden rounded-xl shadow-sm">
                    <DataTable
                        data={pageData}
                        columns={getColumns()}
                        onRowClick={(template) => router.push(`/templates/${template.id}`)}
                        statusKey="status"
                        dataType="General"
                        rowBgClass="bg-white"
                    />
                </div>
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
