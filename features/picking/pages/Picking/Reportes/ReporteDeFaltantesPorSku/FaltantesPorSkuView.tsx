// views\Picking\Reportes\ReporteDeFaltantesPorSku\FaltantesPorSkuView.tsx
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
    totalDePedidos: number;
    almacenes: number;
    montoTotalComprado: number;
    cantidadTotalComprada: number;
    totalFaltante: number;
    porcentajeFaltante: number;
    totalFaltanteMonto: number;
    totalSustituido: number;
    porcentajeSustitucion: number;
    montoTotalSustituido: number;
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
            header: "Total de pedidos",
            accessorKey: "totalDePedidos",
            cell: (r) => r.totalDePedidos
        },
        {
            header: "Almacenes",
            accessorKey: "almacenes",
            cell: (r) => r.almacenes
        },
        {
            header: "Monto total comprado",
            accessorKey: "montoTotalComprado",
            cell: (r) => (
                <span className="font-semibold">
                    ${" "}
                    {r.montoTotalComprado.toFixed(2)}
                </span>
            )
        },
        {
            header: "Cantidad total comprada",
            accessorKey: "cantidadTotalComprada",
            cell: (r) => r.cantidadTotalComprada.toFixed(2)
        },
        {
            header: "Total faltante",
            accessorKey: "totalFaltante",
            cell: (r) => r.totalFaltante.toFixed(2)
        },
        {
            header: "Porcentaje de faltante",
            accessorKey: "porcentajeFaltante",
            cell: (r) => (
                <Bubble
                    emphasized
                    text={`% ${r.porcentajeFaltante.toFixed(0)} %`}
                />
            )
        },
        {
            header: "Total faltante $",
            accessorKey: "totalFaltanteMonto",
            cell: (r) => (
                <span className="font-semibold">
                    ${" "}
                    {r.totalFaltanteMonto.toFixed(2)}
                </span>
            )
        },
        {
            header: "Total sustituido",
            accessorKey: "totalSustituido",
            cell: (r) => r.totalSustituido.toFixed(2)
        },
        {
            header: "Porcentaje de sustitución",
            accessorKey: "porcentajeSustitucion",
            cell: (r) => (
                <Bubble
                    emphasized
                    text={`% ${r.porcentajeSustitucion.toFixed(0)} %`}
                />
            )
        },
        {
            header: "Monto total sustituido",
            accessorKey: "montoTotalSustituido",
            cell: (r) => (
                <span className="font-semibold">
                    ${" "}
                    {r.montoTotalSustituido.toFixed(2)}
                </span>
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
    dateFrom: "2024-03-15",
    dateTo: "2024-04-15",
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
        producto: "KIT Fernet y Coca",
        refId: "324324324323",
        totalDePedidos: 1,
        almacenes: 1,
        montoTotalComprado: 142.5,
        cantidadTotalComprada: 2.0,
        totalFaltante: 2.0,
        porcentajeFaltante: 100,
        totalFaltanteMonto: 285.0,
        totalSustituido: 0.0,
        porcentajeSustitucion: 0,
        montoTotalSustituido: 0.0
    },
    {
        producto: "Abita Amber",
        refId: "111882",
        totalDePedidos: 1,
        almacenes: 1,
        montoTotalComprado: 123.28,
        cantidadTotalComprada: 4.0,
        totalFaltante: 1.0,
        porcentajeFaltante: 25,
        totalFaltanteMonto: 123.28,
        totalSustituido: 0.0,
        porcentajeSustitucion: 0,
        montoTotalSustituido: 0.0
    },
    {
        producto: "Aceite Vegetal Capullo",
        refId: "113431",
        totalDePedidos: 1,
        almacenes: 1,
        montoTotalComprado: 91.4,
        cantidadTotalComprada: 1.0,
        totalFaltante: 1.0,
        porcentajeFaltante: 100,
        totalFaltanteMonto: 91.4,
        totalSustituido: 0.0,
        porcentajeSustitucion: 0,
        montoTotalSustituido: 0.0
    },
    {
        producto: "Arena Gato Tidy Cat",
        refId: "9846",
        totalDePedidos: 1,
        almacenes: 1,
        montoTotalComprado: 223.5,
        cantidadTotalComprada: 2.0,
        totalFaltante: 2.0,
        porcentajeFaltante: 100,
        totalFaltanteMonto: 447.0,
        totalSustituido: 2.0,
        porcentajeSustitucion: 100,
        montoTotalSustituido: 447.0
    },
    {
        producto: "Aromatizante Odisea Azul Glade Gel",
        refId: "119180",
        totalDePedidos: 2,
        almacenes: 2,
        montoTotalComprado: 992.7,
        cantidadTotalComprada: 2.0,
        totalFaltante: 2.0,
        porcentajeFaltante: 100,
        totalFaltanteMonto: 496.35,
        totalSustituido: 2.0,
        porcentajeSustitucion: 100,
        montoTotalSustituido: 496.35
    },
    {
        producto: "Arroz Blanco Tierra Noble",
        refId: "82754",
        totalDePedidos: 1,
        almacenes: 1,
        montoTotalComprado: 206.47,
        cantidadTotalComprada: 1.0,
        totalFaltante: 1.0,
        porcentajeFaltante: 100,
        totalFaltanteMonto: 206.47,
        totalSustituido: 1.0,
        porcentajeSustitucion: 100,
        montoTotalSustituido: 206.47
    },
    {
        producto: "Can Can Chocolate 12",
        refId: "2010820",
        totalDePedidos: 1,
        almacenes: 1,
        montoTotalComprado: 29.75,
        cantidadTotalComprada: 1.0,
        totalFaltante: 1.0,
        porcentajeFaltante: 100,
        totalFaltanteMonto: 29.75,
        totalSustituido: 0.0,
        porcentajeSustitucion: 0,
        montoTotalSustituido: 0.0
    },
];

/* ---------- Página ---------- */
export default function FaltantesPorSkuView() {
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
            "Total de pedidos",
            "Almacenes",
            "Monto total comprado",
            "Cantidad total comprada",
            "Total faltante",
            "Porcentaje de faltante",
            "Total faltante $",
            "Total sustituido",
            "Porcentaje de sustitución",
            "Monto total sustituido",
        ];

        const data = rows.map((r) => [
            r.producto,
            r.refId,
            r.totalDePedidos,
            r.almacenes,
            r.montoTotalComprado.toFixed(2),
            r.cantidadTotalComprada.toFixed(2),
            r.totalFaltante.toFixed(2),
            `${r.porcentajeFaltante.toFixed(0)}%`,
            r.totalFaltanteMonto.toFixed(2),
            r.totalSustituido.toFixed(2),
            `${r.porcentajeSustitucion.toFixed(0)}%`,
            r.montoTotalSustituido.toFixed(2),
        ]);

        exportToCsv("faltantes-por-sku.csv", [headers, ...data]);
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
                title="Faltantes por sku"
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
