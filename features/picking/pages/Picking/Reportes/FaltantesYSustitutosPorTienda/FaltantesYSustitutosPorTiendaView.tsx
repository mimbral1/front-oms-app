// views\Picking\Reportes\FaltantesYSustitutosPorTienda\FaltantesYSustitutosPorTiendaView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { ClearFiltersButton } from "@/components/ui/clear-filters";

/* ---------- Tipos UI ---------- */
type Row = {
    tienda: string;
    totalPedidos: number;

    productosTotales: number;
    unidadesTotales: number;

    productosFaltantes: number;
    unidadesFaltantes: number;
    porcentajeFaltante: number; // 0..100

    productosSustituidos: number;
    unidadesSustituidas: number;
    porcentajeSustitucion: number; // 0..100
};

/* ---------- Helpers UI (chips) ---------- */
const Bubble = ({
    text,
    emphasized = false
}: {
    text: string;
    emphasized?: boolean;
}) => (
    <span
        className={[
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
            emphasized
                ? "ring-1 ring-inset ring-blue-300 text-blue-600 bg-blue-50"
                : "ring-1 ring-inset ring-gray-400 bg-white text-gray-700",
        ].join(" ")}
    >
        {text}
    </span>
);

/* ---------- Columnas tabla ---------- */
function getColumns(): Column<Row>[] {
    return [
        { header: "Tienda", accessorKey: "tienda" },
        { header: "Total de pedidos", accessorKey: "totalPedidos" },

        {
            header: "Productos totales",
            accessorKey: "productosTotales",
            cell: (r) => <Bubble text={String(r.productosTotales)} />
        },
        {
            header: "Unidades totales",
            accessorKey: "unidadesTotales",
            cell: (r) => <Bubble text={r.unidadesTotales.toFixed(2)} />
        },

        {
            header: "Productos faltantes",
            accessorKey: "productosFaltantes",
            cell: (r) => <Bubble text={String(r.productosFaltantes)} />
        },
        {
            header: "Unidades faltantes",
            accessorKey: "unidadesFaltantes",
            cell: (r) => <Bubble text={r.unidadesFaltantes.toFixed(2)} />
        },
        {
            header: "Porcentaje de faltante",
            accessorKey: "porcentajeFaltante",
            cell: (r) => (
                <Bubble
                    emphasized
                    text={`% ${r.porcentajeFaltante.toFixed(2)} %`}
                />
            )
        },

        {
            header: "Productos sustituidos",
            accessorKey: "productosSustituidos",
            cell: (r) => <Bubble text={String(r.productosSustituidos)} />
        },
        {
            header: "Unidades sustituidas",
            accessorKey: "unidadesSustituidas",
            cell: (r) => <Bubble text={r.unidadesSustituidas.toFixed(2)} />
        },
        {
            header: "Porcentaje de sustitución",
            accessorKey: "porcentajeSustitucion",
            cell: (r) => (
                <Bubble
                    emphasized
                    text={`% ${r.porcentajeSustitucion.toFixed(2)} %`}
                />
            )
        },
    ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
    dateFrom: string; // yyyy-MM-dd
    dateTo: string; // yyyy-MM-dd
    tipo: string; // select
}

const INITIAL_FILTERS: Filters = {
    dateFrom: "",
    dateTo: "",
    tipo: "Inventario"
};

const getFiltersConfig = (f: Filters) => [
    {
        id: "dateFrom",
        label: "Período desde",
        type: "datetime" as const,
        value: f.dateFrom
    },
    {
        id: "dateTo",
        label: "Período hasta",
        type: "datetime" as const,
        value: f.dateTo
    },
    {
        id: "tipo",
        label: "Inventario",
        type: "select" as const,
        value: f.tipo,
        options: [{ label: "Inventario", value: "Inventario" }]
    },
];

/* ---------- Paginación ---------- */
const PER_PAGE = 25;

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

/* ---------- Mock data ---------- */
const MOCK_ROWS: Row[] = [
    {
        tienda: "-",
        totalPedidos: 1,
        productosTotales: 1,
        unidadesTotales: 1.0,
        productosFaltantes: 0,
        unidadesFaltantes: 0.0,
        porcentajeFaltante: 0.0,
        productosSustituidos: 0,
        unidadesSustituidas: 0.0,
        porcentajeSustitucion: 0.0
    },
    {
        tienda: "Belgrano",
        totalPedidos: 119,
        productosTotales: 236,
        unidadesTotales: 369.0,
        productosFaltantes: 82,
        unidadesFaltantes: 124.5,
        porcentajeFaltante: 33.74,
        productosSustituidos: 14,
        unidadesSustituidas: 15.87,
        porcentajeSustitucion: 4.3
    },
    {
        tienda: "Palermo",
        totalPedidos: 179,
        productosTotales: 266,
        unidadesTotales: 449.0,
        productosFaltantes: 66,
        unidadesFaltantes: 99.11,
        porcentajeFaltante: 22.07,
        productosSustituidos: 33,
        unidadesSustituidas: 44.15,
        porcentajeSustitucion: 9.83
    },
    {
        tienda: "Pilar",
        totalPedidos: 1,
        productosTotales: 2,
        unidadesTotales: 2.0,
        productosFaltantes: 0,
        unidadesFaltantes: 0.0,
        porcentajeFaltante: 0.0,
        productosSustituidos: 0,
        unidadesSustituidas: 0.0,
        porcentajeSustitucion: 0.0
    },
];

/* ---------- Página ---------- */
export default function FaltantesYSustitutosPorTiendaView() {
    const columns = useMemo(() => getColumns(), []);

    // filtros
    const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

    // tabla (mock)
    const [rows, setRows] = useState<Row[]>(MOCK_ROWS);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Totales y ventana al cambiar data
    useEffect(() => {
        const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
        setTotalRecords(rows.length);
        setTotalPages(pages);
        setCurrentPage((p) => clamp(p, 1, pages));
    }, [rows]);

    // Slice de la página actual
    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        return rows.slice(start, end);
    }, [rows, currentPage]);

    /* ---------- Acciones header ---------- */
    const handleExport = useCallback(() => {
        const headers = [
            "Tienda",
            "Total de pedidos",
            "Productos totales",
            "Unidades totales",
            "Productos faltantes",
            "Unidades faltantes",
            "Porcentaje de faltante",
            "Productos sustituidos",
            "Unidades sustituidas",
            "Porcentaje de sustitución",
        ];

        const data = rows.map((r) => [
            r.tienda,
            r.totalPedidos,
            r.productosTotales,
            r.unidadesTotales.toFixed(2),
            r.productosFaltantes,
            r.unidadesFaltantes.toFixed(2),
            `${r.porcentajeFaltante.toFixed(2)}%`,
            r.productosSustituidos,
            r.unidadesSustituidas.toFixed(2),
            `${r.porcentajeSustitucion.toFixed(2)}%`,
        ]);

        exportToCsv("faltantes-sustitutos-por-tienda.csv", [headers, ...data]);
    }, [rows]);

    const handleRefresh = useCallback(() => {
        setRows(MOCK_ROWS);
        setCurrentPage(1);
    }, []);

    const handleClear = useCallback(() => {
        setFilters(INITIAL_FILTERS);
        setCurrentPage(1);
    }, []);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: handleRefresh,
                icon: <ArrowPathIcon className="h-5 w-5" />
            },
        ],
        [handleExport, handleRefresh]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Faltantes y sustitución por tienda"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setFilters((prev) => ({ ...prev, [id]: value }));
                    setCurrentPage(1);
                }}
                filterTitle
                filtersRight={<ClearFiltersButton onClick={handleClear} />}
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <DataTable
                        data={pagedRows}
                        columns={columns}
                        dataType="General2"
                        rowPaddingY={12}
                        showStatusBorder={false}
                        rowBgClass="bg-white"
                    />
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalRecords={totalRecords}
                    pageSize={PER_PAGE}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
