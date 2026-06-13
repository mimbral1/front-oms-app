// app/views/Exportaciones/Browse/ExportacionesView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ──────────────────────────────────────────────────────────────────────────
 * Tipos y mocks
 * ────────────────────────────────────────────────────────────────────────── */
type ExportStatus = "Enviado" | "Pendiente" | "Error";
type ExportFormat = "xlsx" | "csv" | "json";

interface ExportRow {
    id: string;
    service: "catalog" | "trace" | "commerce" | string;
    entity: "product" | "category" | "log-import" | "sales-channel" | string;
    format: ExportFormat;
    total: number;
    date_created: string; // "DD/MM/YYYY HH:mm"
    status: ExportStatus;
}

const MOCK: ExportRow[] = [
    { id: "exp-001", service: "catalog", entity: "product", format: "xlsx", total: 1, date_created: "15/12/2021 11:17", status: "Enviado" },
    { id: "exp-002", service: "catalog", entity: "product", format: "xlsx", total: 1, date_created: "13/12/2021 13:16", status: "Enviado" },
    { id: "exp-003", service: "catalog", entity: "category", format: "xlsx", total: 4, date_created: "17/11/2021 17:10", status: "Enviado" },
    { id: "exp-004", service: "trace", entity: "log-import", format: "xlsx", total: 8, date_created: "03/11/2021 14:37", status: "Enviado" },
    { id: "exp-005", service: "commerce", entity: "sales-channel", format: "xlsx", total: 3, date_created: "21/10/2021 19:55", status: "Enviado" },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers UI
 * ────────────────────────────────────────────────────────────────────────── */
const PER_PAGE = 10;

const statusPill = (s: ExportStatus) =>
({
    Enviado: "bg-green-500 text-white",
    Pendiente: "bg-yellow-500 text-black",
    Error: "bg-red-500 text-white",
}[s]);

/* ──────────────────────────────────────────────────────────────────────────
 * Filtros para PageHeader
 * ────────────────────────────────────────────────────────────────────────── */
type Filters = {
    service: "" | ExportRow["service"];
    entity: "" | ExportRow["entity"];
    format: "" | ExportFormat;
};

const initialFilters: Filters = { service: "", entity: "", format: "" };

const getFilters = (f: Filters) => [
    {
        id: "service",
        label: "Servicio",
        type: "select-search" as const,
        value: f.service,
        options: [
            { label: "Todos", value: "" },
            ...Array.from(new Set(MOCK.map((r) => r.service))).map((s) => ({ label: s, value: s })),
        ],
    },
    {
        id: "entity",
        label: "Entidad",
        type: "select-search" as const,
        value: f.entity,
        options: [
            { label: "Todas", value: "" },
            ...Array.from(new Set(MOCK.map((r) => r.entity))).map((e) => ({ label: e, value: e })),
        ],
    },
    {
        id: "format",
        label: "Formato",
        type: "select-search" as const,
        value: f.format,
        options: [
            { label: "Todos", value: "" },
            ...Array.from(new Set(MOCK.map((r) => r.format))).map((fmt) => ({ label: fmt, value: fmt })),
        ],
    },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Columnas
 * ────────────────────────────────────────────────────────────────────────── */
function getColumns(): Column<ExportRow>[] {
    const Chip = ({ text }: { text: number }) => (
        <span className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm bg-white">
            {text}
        </span>
    );

    return [
        { header: "Servicio", accessorKey: "service" },
        { header: "Entidad", accessorKey: "entity" },
        { header: "Formato", accessorKey: "format" },
        {
            header: "Total",
            accessorKey: "total",
            cell: (r) => <Chip text={r.total} />,
        },
        { header: "Fecha de creación", accessorKey: "date_created" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => (
                <span className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-sm font-medium ${statusPill(r.status)}`}>
                    {r.status}
                </span>
            ),
        },
    ];
}

/* ──────────────────────────────────────────────────────────────────────────
 * View
 * ────────────────────────────────────────────────────────────────────────── */
export default function ExportacionesView() {
    const router = useRouter();
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = useMemo(() => {
        return MOCK.filter((r) => {
            const byService = !filters.service || r.service === filters.service;
            const byEntity = !filters.entity || r.entity === filters.entity;
            const byFormat = !filters.format || r.format === filters.format;
            return byService && byEntity && byFormat;
        });
    }, [filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const startIndex = (currentPage - 1) * PER_PAGE;
    const paginated = filtered.slice(startIndex, startIndex + PER_PAGE);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    /* Acciones header */
    const handleExport = () => {
        const headers = ["ID", "Servicio", "Entidad", "Formato", "Total", "Fecha creación", "Estado"];
        const rows = filtered.map((r) => [r.id, r.service, r.entity, r.format, r.total, r.date_created, r.status]);
        exportToCsv("exportaciones.csv", [headers, ...rows]);
    };

    const headerActions = [
        {
            label: "Nuevo",
            variant: "success" as const,
            onClick: () => router.push("/cuenta/acciones-masivas/exportaciones/nuevo"),
            icon: <PlusIcon className="h-5 w-5" />,
        },
        {
            label: "Exportar",
            variant: "primary" as const,
            onClick: handleExport,
            icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        },
        {
            label: "Actualizar",
            variant: "secondary" as const,
            onClick: () => setFilters((f) => ({ ...f })), // mock refresh, icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    const columns = getColumns();
    const viewFilters = getFilters(filters);
    const onFilterChange = (id: string, value: string) => {
        setCurrentPage(1);
        setFilters((prev) => ({ ...prev, [id]: value as Filters[keyof Filters] }));
    };

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Exportaciones"
                filters={viewFilters}
                onFilterChange={onFilterChange}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable<ExportRow>
                            data={paginated}
                            columns={columns}
                            dataType="Exportaciones"
                            statusKey="status"
                            rowPaddingY={12}
                            rowBgClass="bg-white"
                            onRowClick={(row) => router.push(`/cuenta/acciones-masivas/exportaciones/${encodeURIComponent(row.id)}`)}
                        />
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalRecords={filtered.length}
                        pageSize={PER_PAGE}
                        onPageChange={setCurrentPage}
                      />
                </div>
            </div>
        </div>
    );
}
