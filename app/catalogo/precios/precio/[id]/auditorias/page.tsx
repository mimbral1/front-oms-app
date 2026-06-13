"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { DataTable, Column } from "@/components/ui/table";

interface AuditEntry {
    id: string;
    action: string;
    entity: string;
    field: string;
    oldValue: string;
    newValue: string;
    user: string;
    date: string;
}

const MOCK_AUDITS: AuditEntry[] = [
    {
        id: "1",
        action: "UPDATE",
        entity: "Price",
        field: "price",
        oldValue: "15000",
        newValue: "18000",
        user: "admin@mimbral.cl",
        date: "2024-11-15T10:30:00Z",
    },
    {
        id: "2",
        action: "UPDATE",
        entity: "Price",
        field: "precioIva",
        oldValue: "17850",
        newValue: "21420",
        user: "admin@mimbral.cl",
        date: "2024-11-15T10:30:00Z",
    },
    {
        id: "3",
        action: "CREATE",
        entity: "Price",
        field: "-",
        oldValue: "-",
        newValue: "-",
        user: "sistema@mimbral.cl",
        date: "2024-10-01T14:00:00Z",
    },
];

const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
};

export default function AuditsPage() {
    const router = useRouter();
    const { id } = useParams();
    const entityId = Array.isArray(id) ? id[0] : (id ?? "");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const totalPages = Math.ceil(MOCK_AUDITS.length / pageSize);
    const pageData = MOCK_AUDITS.slice((page - 1) * pageSize, page * pageSize);

    usePageHeader(
        () => ({
            title: `Audits · ${entityId}`,
            action: [
                {
                    label: "Volver al listado",
                    icon: <ArrowLeftIcon className="h-5 w-5" />,
                    variant: "secondary" as const,
                    onClick: () => router.push("/catalogo/precios/precio"),
                },
            ],
        }),
        [entityId, router]
    );

    const columns: Column<AuditEntry>[] = [
        {
            accessorKey: "action",
            header: "Action",
            cell: (r) => (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[r.action] ?? "bg-gray-100 text-gray-800"}`}>
                    {r.action}
                </span>
            ),
        },
        { accessorKey: "entity", header: "Entity" },
        { accessorKey: "field", header: "Field" },
        { accessorKey: "oldValue", header: "Old value" },
        { accessorKey: "newValue", header: "New value" },
        { accessorKey: "user", header: "User" },
        {
            accessorKey: "date",
            header: "Date",
            cell: (r) => formatDate(r.date),
        },
    ];

    return (
        <div className="p-6 space-y-4">
            <DataTable
                columns={columns}
                data={pageData}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
