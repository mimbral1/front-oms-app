// app/views/Cuenta/AccionesMasivas/Importaciones/ImportacionesView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";

import { Pagination } from "@/components/ui/pagination";
import { ClearFiltersButton } from "@/components/ui/clear-filters";

/* --------------------------------------------------------------------------
   Tipos UI 
--------------------------------------------------------------------------- */

type Estado = "Processed" | "Processing" | "Error";

interface ImportRow {
    id: string;
    service: string; // catalog, i18n, etc.
    entity: string; // category, translate, etc.
    name: string; // archivo
    size: string; // "0.0003MB"
    total: number;
    created: number;
    updated: number;
    notModified: number;
    error: number;
    startDate: string; // "18/11/2021 15:09"
    endDate: string; // idem
    createdAt: string; // fecha creación (columna "Creación" en screenshot)
    status: Estado; // badge (en español en header, pero valor tal cual del mock)
}

/* --------------------------------- Helpers -------------------------------- */
const PER_PAGE = 20;
const getStatusClass = (s: Estado) =>
    s === "Processed"
        ? "bg-green-500"
        : s === "Processing"
            ? "bg-blue-500"
            : "bg-red-500";

const Bubble = ({ value }: { value: number | string }) => (
    <span className="inline-flex min-w-[44px] items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        {value}
    </span>
);

/* ----------------------------- Columnas (UI) ------------------------------ */
function getColumns(): Column<ImportRow>[] {
    return [
        { header: "Servicio", accessorKey: "service" },
        { header: "Entidad", accessorKey: "entity" },
        { header: "Nombre", accessorKey: "name" },
        { header: "Tamaño", accessorKey: "size" },
        { header: "Total", accessorKey: "total", cell: (r) => <Bubble value={r.total} /> },
        { header: "Created", accessorKey: "created", cell: (r) => <Bubble value={r.created} /> },
        { header: "Updated", accessorKey: "updated", cell: (r) => <Bubble value={r.updated} /> },
        { header: "Not modified", accessorKey: "notModified", cell: (r) => <Bubble value={r.notModified} /> },
        { header: "Error", accessorKey: "error", cell: (r) => <Bubble value={r.error} /> },
        { header: "Fecha inicio", accessorKey: "startDate" },
        { header: "Fecha fin", accessorKey: "endDate" },
        { header: "Creación", accessorKey: "createdAt" },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => (
                <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusClass(r.status)}`}>
                    {/* label en español */}
                    {r.status === "Processed" ? "Procesado" : r.status === "Processing" ? "Procesando" : "Error"}
                </div>
            )
        },
    ];
}

/* --------------------------- Filtros del Header --------------------------- */
interface Filters {
    service: string; // "", "catalog", "i18n"...
    entity: string; // "", "category", "translate"...
    minSize: string; // ">= tamaño" (texto para mantener estilo simple)
    maxSize: string; // "<= tamaño"
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
}

const getFiltersConfig = (f: Filters) => [
    {
        id: "service", label: "Servicio", type: "select" as const, value: f.service, options: [
            { label: "Todos", value: "" },
            { label: "catalog", value: "catalog" },
            { label: "i18n", value: "i18n" },
        ]
    },
    {
        id: "entity", label: "Entidad", type: "select" as const, value: f.entity, options: [
            { label: "Todas", value: "" },
            { label: "category", value: "category" },
            { label: "translate", value: "translate" },
        ]
    },
    { id: "minSize", label: "Mayor que", type: "text" as const, value: f.minSize },
    { id: "maxSize", label: "Menor que", type: "text" as const, value: f.maxSize },
    { id: "startDate", label: "Día de inicio", type: "datetime" as const, value: f.startDate },
    { id: "endDate", label: "Día de fin", type: "datetime" as const, value: f.endDate },
];

/* ------------------------------- Página View ------------------------------ */
export default function ImportacionesView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);

    // tabla
    const [rows, setRows] = useState<ImportRow[]>([]);
    const [loading, setLoading] = useState(true);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // filtros
    const [filters, setFilters] = useState<Filters>({
        service: "",
        entity: "",
        minSize: "",
        maxSize: "",
        startDate: "",
        endDate: ""
    });

    const hasActiveFilters = useMemo(
        () => Object.values(filters).some((value) => String(value ?? "").trim() !== ""),
        [filters]
    );

    const handleClear = useCallback(() => {
        setCurrentPage(1);
        setFilters({
            service: "",
            entity: "",
            minSize: "",
            maxSize: "",
            startDate: "",
            endDate: ""
        });
    }, []);

    /* -------------------------- Mock de datos (UI) -------------------------- */
    const MOCK: ImportRow[] = [
        {
            id: "1",
            service: "catalog",
            entity: "category",
            name: "3aa1a237-1ab5-45fb-a784-857d2de5adef.json",
            size: "0.0003MB",
            total: 2,
            created: 2,
            updated: 0,
            notModified: 0,
            error: 0,
            startDate: "18/11/2021 15:09",
            endDate: "18/11/2021 15:09",
            createdAt: "18/11/2021 15:09",
            status: "Processed"
        },
        {
            id: "2",
            service: "catalog",
            entity: "category",
            name: "category-batch.json",
            size: "0.0002MB",
            total: 2,
            created: 0,
            updated: 2,
            notModified: 0,
            error: 0,
            startDate: "17/11/2021 19:25",
            endDate: "17/11/2021 19:25",
            createdAt: "17/11/2021 19:25",
            status: "Processed"
        },
        {
            id: "3",
            service: "catalog",
            entity: "category",
            name: "test2.csv",
            size: "0.002MB",
            total: 14,
            created: 14,
            updated: 0,
            notModified: 0,
            error: 0,
            startDate: "17/11/2021 17:49",
            endDate: "17/11/2021 17:49",
            createdAt: "17/11/2021 17:49",
            status: "Processed"
        },
        {
            id: "4",
            service: "i18n",
            entity: "translate",
            name: "translate-batch.csv",
            size: "0MB",
            total: 1,
            created: 1,
            updated: 0,
            notModified: 0,
            error: 0,
            startDate: "25/10/2021 14:13",
            endDate: "25/10/2021 14:13",
            createdAt: "25/10/2021 14:13",
            status: "Processed"
        },
    ];

    // simulación de carga (siguiendo tu patrón de setLoading)
    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            // MOCK: filtrar localmente según filtros simples
            const filtered = MOCK.filter((r) => {
                if (filters.service && r.service !== filters.service) return false;
                if (filters.entity && r.entity !== filters.entity) return false;
                if (filters.minSize) {
                    const n = Number(r.size.replace(/MB|GB|KB/gi, ""));
                    const m = Number(filters.minSize.replace(/[^0-9.]/g, ""));
                    if (!Number.isNaN(m) && !(n >= m)) return false;
                }
                if (filters.maxSize) {
                    const n = Number(r.size.replace(/MB|GB|KB/gi, ""));
                    const m = Number(filters.maxSize.replace(/[^0-9.]/g, ""));
                    if (!Number.isNaN(m) && !(n <= m)) return false;
                }
                // fechas: si vienen, no parseamos locales (mock); solo pasamos
                return true;
            });

            const startIdx = (currentPage - 1) * PER_PAGE;
            const pageData = filtered.slice(startIdx, startIdx + PER_PAGE);

            setRows(pageData);
            setTotalRecords(filtered.length);
            setTotalPages(Math.max(1, Math.ceil(filtered.length / PER_PAGE)));
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters]);

    useEffect(() => { fetchList(); }, [fetchList]);

    /* ----------------------------- Acciones header ----------------------------- */
    const handleExport = useCallback(() => {
        const headers = [
            "Servicio",
            "Entidad",
            "Nombre",
            "Tamaño",
            "Total",
            "Created",
            "Updated",
            "Not modified",
            "Error",
            "Fecha inicio",
            "Fecha fin",
            "Creación",
            "Status",
        ];
        const data = rows.map((r) => [
            r.service,
            r.entity,
            r.name,
            r.size,
            r.total,
            r.created,
            r.updated,
            r.notModified,
            r.error,
            r.startDate,
            r.endDate,
            r.createdAt,
            r.status,
        ]);
        exportToCsv("importaciones.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success" as const,
                onClick: () => router.push("/cuenta/acciones-masivas/importaciones/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />
            },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport
            },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => fetchList()
            },
        ],
        [handleExport, fetchList]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Importaciones"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setCurrentPage(1); // reset de página al cambiar filtros
                    setFilters((prev) => ({ ...prev, [id]: value } as Filters));
                }}
                filterTitle
                filtersRight={<ClearFiltersButton onClick={handleClear} disabled={!hasActiveFilters} />}
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando importaciones…</p>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status" // mantiene borde de estado
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: ImportRow) => router.push(`/cuenta/acciones-masivas/importaciones/${row.id}`)}
                        />
                    )}

                    {/* Paginación (ventana de 3 páginas) */}
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
