// views\Picking\Reportes\ReporteSustitucion\ReporteDeSustitucionView.tsx
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
    producto: string;
    refId: string;
    cantSustituida: number;
    totalPedidos: number;
    productoSustituto: string;
    refIdSustituto: string;
    cantidadSustituida: number;
    porcentajeGenericidad: number; // 0..100
};

/* ---------- Helpers UI ---------- */
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
        {
            header: "Producto",
            accessorKey: "producto"
        },
        {
            header: "Ref ID",
            accessorKey: "refId"
        },
        {
            header: "Cant. sustituida",
            accessorKey: "cantSustituida",
            cell: (r) => <Bubble text={r.cantSustituida.toFixed(2)} />
        },
        {
            header: "Total de pedidos",
            accessorKey: "totalPedidos",
            cell: (r) => <Bubble text={String(r.totalPedidos)} />
        },
        {
            header: "Producto sustituto",
            accessorKey: "productoSustituto"
        },
        {
            header: "Ref ID",
            accessorKey: "refIdSustituto"
        },
        {
            header: "Cantidad sustituida",
            accessorKey: "cantidadSustituida",
            cell: (r) => <Bubble text={r.cantidadSustituida.toFixed(2)} />
        },
        {
            header: "Porcentaje de genericidad",
            accessorKey: "porcentajeGenericidad",
            cell: (r) => (
                <Bubble
                    emphasized
                    text={`% ${r.porcentajeGenericidad.toFixed(2)} %`}
                />
            )
        },
    ];
}

/* ---------- Filtros Header ---------- */
interface Filters {
    dateFrom: string; // yyyy-MM-dd
    dateTo: string; // yyyy-MM-dd
    inventario: string;
    pedido: string;
    nombre: string;
}

const INITIAL_FILTERS: Filters = {
    dateFrom: "2024-03-10",
    dateTo: "2024-04-10",
    inventario: "Inventario",
    pedido: "",
    nombre: ""
};

const getFiltersConfig = (f: Filters) => [
    {
        id: "dateFrom",
        label: "Periodo desde",
        type: "datetime" as const,
        value: f.dateFrom
    },
    {
        id: "dateTo",
        label: "Periodo hasta",
        type: "datetime" as const,
        value: f.dateTo
    },
    {
        id: "inventario",
        label: "Inventario",
        type: "select" as const,
        value: f.inventario,
        options: [
            { label: "Inventario", value: "Inventario" },
            { label: "Palermo", value: "Palermo" },
        ]
    },
    {
        id: "pedido",
        label: "Pedido",
        type: "select" as const,
        value: f.pedido,
        options: [{ label: "Todos", value: "" }]
    },
    {
        id: "nombre",
        label: "Nombre",
        type: "select" as const,
        value: f.nombre,
        options: [{ label: "Todos", value: "" }]
    },
];

/* ---------- Paginación ---------- */
const PER_PAGE = 25;

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

/* ---------- Mock data ---------- */
const MOCK_ROWS: Row[] = [
    {
        producto: "Shampoo Perro Fido",
        refId: "21491",
        cantSustituida: 2.0,
        totalPedidos: 1,
        productoSustituto: "Arena Gato Natures Miracle",
        refIdSustituto: "2026967",
        cantidadSustituida: 1.0,
        porcentajeGenericidad: 0.0
    },
    {
        producto: "Carne Molida Estandar",
        refId: "25131",
        cantSustituida: 2.0,
        totalPedidos: 1,
        productoSustituto: "Pañal Desechable Etapa 3 Baby Dry",
        refIdSustituto: "100035",
        cantidadSustituida: 1.0,
        porcentajeGenericidad: 1017.91
    },
    {
        producto: "Sprite Lata",
        refId: "436",
        cantSustituida: 1.0,
        totalPedidos: 1,
        productoSustituto: "Tempranillo Viñapeña",
        refIdSustituto: "110990",
        cantidadSustituida: 1.0,
        porcentajeGenericidad: 0.0
    },
    {
        producto: "Queso Crema Parma",
        refId: "58613",
        cantSustituida: 1.0,
        totalPedidos: 1,
        productoSustituto: "Crema Antiarrugas Rejuveness Ponds",
        refIdSustituto: "1643",
        cantidadSustituida: 1.0,
        porcentajeGenericidad: 0.0
    },
    {
        producto: "San Pellegrino Naranjada con Soda",
        refId: "68364",
        cantSustituida: 1.0,
        totalPedidos: 1,
        productoSustituto: "Tempranillo Viñapeña",
        refIdSustituto: "110990",
        cantidadSustituida: 1.0,
        porcentajeGenericidad: 0.0
    },
];

/* ---------- Página ---------- */
export default function ReporteDeSustitucionView() {
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
            "Producto",
            "Ref ID",
            "Cant. sustituida",
            "Total de pedidos",
            "Producto sustituto",
            "Ref ID sustituto",
            "Cantidad sustituida",
            "Porcentaje de genericidad",
        ];

        const data = rows.map((r) => [
            r.producto,
            r.refId,
            r.cantSustituida.toFixed(2),
            r.totalPedidos,
            r.productoSustituto,
            r.refIdSustituto,
            r.cantidadSustituida.toFixed(2),
            `${r.porcentajeGenericidad.toFixed(2)}%`,
        ]);

        exportToCsv("reporte-de-sustitucion.csv", [headers, ...data]);
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
                title="Sustituciones por ítem"
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
