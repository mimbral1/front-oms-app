"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action, type PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";

/* Tipos */
interface WebhookRow {
    id: string;
    name: string;
    status: string;
    endpoint: string;
    triggers: string[]; // texto de eventos "order:delivered", etc.
    headersCount: number;
    creator: string;
}

/* Mock */
const MOCK: WebhookRow[] = [
    {
        id: "wh_001",
        name: "Notificación de pedido Listo para facturar",
        status: "Activo",
        endpoint: "https://endpoint.prueba.com/",
        triggers: ["order:ready-for-invoice"],
        headersCount: 2,
        creator: "Bruno Bellini",
    },
    {
        id: "wh_002",
        name: "Webhook de entregas",
        status: "Inactivo",
        endpoint: "https://deliveries.example.io/",
        triggers: ["order:delivered", "order:not-delivered"],
        headersCount: 1,
        creator: "Ana Marin",
    },
];

/* Helpers de paginación */
const PER_PAGE = 20;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

/* Filtros */
interface Filters {
    name: string;
    status: "" | "Activo" | "Inactivo";
    trigger: string;
}
const getFilters = (f: Filters) => [
    { id: "name", label: "Nombre", type: "text" as const, value: f.name },
    {
        id: "status",
        label: "Todos los estados",
        type: "select" as const,
        value: f.status,
        options: [
            { label: "Todos los estados", value: "" },
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
    },
    { id: "trigger", label: "Trigger contiene…", type: "text" as const, value: f.trigger },
];

export default function WebhooksView() {
    const router = useRouter();

    const [filters, setFilters] = useState<Filters>({ name: "", status: "", trigger: "" });
    const [page, setPage] = useState(1);

    const onFilterChange = (id: string, value: string) => {
        setFilters((p) => ({ ...p, [id]: value as any }));
        setPage(1);
    };

    const filtered = useMemo(() => {
        return MOCK.filter((r) => {
            const byName = !filters.name || r.name.toLowerCase().includes(filters.name.toLowerCase());
            const byStatus = !filters.status || r.status === filters.status;
            const byTrig =
                !filters.trigger ||
                r.triggers.join(" ").toLowerCase().includes(filters.trigger.toLowerCase());
            return byName && byStatus && byTrig;
        });
    }, [filters]);

    const headerActions: Action[] = useMemo(
        () => [
            { label: "Nuevo", variant: "success", icon: <PlusIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/webhooks/nuevo") },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: () => {
                    const headers = ["ID", "Nombre", "Estado", "Endpoint", "Triggers", "Headers", "Creador"];
                    const rows = filtered.map((r) => [
                        r.id,
                        r.name,
                        r.status,
                        r.endpoint,
                        r.triggers.join(", "),
                        r.headersCount,
                        r.creator,
                    ]);
                    exportToCsv("webhooks.csv", [headers, ...rows]);
                },
            },
            { label: "Actualizar", variant: "secondary", icon: <ArrowPathIcon className="h-5 w-5" />, onClick: () => console.log("refresh") },
        ],
        [filtered, router]
    );

    /* Page header */
    const header: PageHeaderProps = {
        title: "Webhooks",
        filters: getFilters(filters),
        onFilterChange,
        action: headerActions,
    };

    const columns = useMemo<Column<WebhookRow>[]>(() => {
        return [
            {
                header: "Nombre",
                accessorKey: "name",
                cell: (row) => (
                    <span
                        className="cursor-pointer hover:underline"
                        onClick={() => router.push(`/webhooks/${encodeURIComponent(row.id)}`)}
                    >
                        {row.name}
                    </span>
                ),
            },
            { header: "Endpoint", accessorKey: "endpoint" },
            {
                header: "Triggers",
                accessorKey: "triggers",
                cell: (row) => (
                    <span className="text-sm text-gray-700">{row.triggers.join(", ") || "—"}</span>
                ),
            },
            { header: "Headers", accessorKey: "headersCount" },
            {
                header: "Estado",
                accessorKey: "status",
                cell: (row) => (
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === "Activo" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                            }`}
                    >
                        {row.status}
                    </span>
                ),
            },
            { header: "Creador", accessorKey: "creator" },
        ];
    }, [router]);

    // paginación
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const current = clamp(page, 1, totalPages);
    const sliceStart = (current - 1) * PER_PAGE;
    const sliceEnd = Math.min(sliceStart + PER_PAGE, total);
    const pageRows = filtered.slice(sliceStart, sliceEnd);

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader {...header} />
            <div className="flex-1 p-6">
                <div className="overflow-hidden rounded-xl shadow-sm">
                    <DataTable<WebhookRow>
                        data={pageRows}
                        columns={columns}
                        dataType="General2"
                        rowBgClass="bg-white"
                        rowPaddingY={16}
                        onRowClick={(row) => router.push(`/cuenta/webhooks/${encodeURIComponent(row.id)}`)}
                    />
                </div>

                <Pagination
                    currentPage={page}
                    totalRecords={filtered.length}
                    pageSize={PER_PAGE}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
