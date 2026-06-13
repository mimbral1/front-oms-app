// views\Picking\Reportes\ProductividadDePickers\ProductividadDePickersView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos UI ---------- */
type Row = {
    nombre: string;
    tiempoActividad: string;
    ronda: number;
    promedioPorRonda: string;
    pedidos: number;
    promedioPorPedido: string;
    productos: number;
    productosPorMinuto: string;
    items: number;
    itemsPorMinuto: string;
    foundRate: number; // 0..100
    fillRate: number; // 0..100
};

const Bubble = ({ text, emphasized = false }: { text: string; emphasized?: boolean }) => (
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

/* ---------- Columnas ---------- */
function getColumns(): Column<Row>[] {
    return [
        { header: "Nombre", accessorKey: "nombre" },
        {
            header: "Tiempo de actividad",
            accessorKey: "tiempoActividad",
            cell: (r) => <Bubble text={r.tiempoActividad} />,
        },
        {
            header: "Ronda",
            accessorKey: "ronda",
            cell: (r) => r.ronda,
        },
        {
            header: "Promedio por ronda",
            accessorKey: "promedioPorRonda",
            cell: (r) => <Bubble text={r.promedioPorRonda} />,
        },
        {
            header: "Pedidos",
            accessorKey: "pedidos",
            cell: (r) => r.pedidos,
        },
        {
            header: "Promedio por pedido",
            accessorKey: "promedioPorPedido",
            cell: (r) => <Bubble text={r.promedioPorPedido} />,
        },
        {
            header: "Productos",
            accessorKey: "productos",
            cell: (r) => r.productos,
        },
        {
            header: "Productos por minuto",
            accessorKey: "productosPorMinuto",
            cell: (r) => r.productosPorMinuto,
        },
        {
            header: "Ítems",
            accessorKey: "items",
            cell: (r) => r.items,
        },
        {
            header: "Ítems por minuto",
            accessorKey: "itemsPorMinuto",
            cell: (r) => r.itemsPorMinuto,
        },
        {
            header: "Found rate",
            accessorKey: "foundRate",
            cell: (r) => <Bubble emphasized text={`% ${r.foundRate.toFixed(2)} %`} />,
        },
        {
            header: "Fill rate",
            accessorKey: "fillRate",
            cell: (r) => <Bubble emphasized text={`% ${r.fillRate.toFixed(2)} %`} />,
        },
    ];
}

/* ---------- Filtros ---------- */
interface Filters {
    dateFrom: string; // yyyy-MM-dd
    dateTo: string; // yyyy-MM-dd
    picker: string;
    inventario: string;
}

const getFiltersConfig = (f: Filters) => {
    return [
        {
            id: "dateFrom",
            label: "Periodo desde",
            type: "datetime" as const,
            value: f.dateFrom,
        },
        {
            id: "dateTo",
            label: "Periodo hasta",
            type: "datetime" as const,
            value: f.dateTo,
        },
        {
            id: "picker",
            label: "Picker",
            type: "select" as const,
            value: f.picker,
            options: [
                { label: "Todos", value: "" },
                { label: "Ariel Mikowski", value: "Ariel Mikowski" },
                { label: "Leonardo Gambino", value: "Leonardo Gambino" },
                { label: "Thiago Alipio", value: "Thiago Alipio" },
                { label: "Erwin Concha", value: "Erwin Concha" },
            ],
        },
        {
            id: "inventario",
            label: "Inventario",
            type: "select" as const,
            value: f.inventario,
            options: [{ label: "Palermo", value: "Palermo" }],
        },
    ];
};

/* ---------- Página ---------- */
export default function ProductividadDePickersView() {
    const columns = useMemo(() => getColumns(), []);

    // filtros
    const [filters, setFilters] = useState<Filters>({
        dateFrom: "2025-02-01",
        dateTo: "2025-02-25",
        picker: "",
        inventario: "Palermo",
    });

    // tabla (mock)
    const [rows, setRows] = useState<Row[]>([
        {
            nombre: "Ariel Mikowski",
            tiempoActividad: "00:15 Hs",
            ronda: 6,
            promedioPorRonda: "00:03 Hs",
            pedidos: 6,
            promedioPorPedido: "00:03 Hs",
            productos: 19,
            productosPorMinuto: "1.27 productos/minuto",
            items: 273,
            itemsPorMinuto: "18.20 ítems/minuto",
            foundRate: 81.67,
            fillRate: 100.0,
        },
        {
            nombre: "Leonardo Gambino",
            tiempoActividad: "05:05 Hs",
            ronda: 14,
            promedioPorRonda: "00:22 Hs",
            pedidos: 14,
            promedioPorPedido: "00:22 Hs",
            productos: 27,
            productosPorMinuto: "0.09 productos/minuto",
            items: 32,
            itemsPorMinuto: "0.10 ítems/minuto",
            foundRate: 42.86,
            fillRate: 98.21,
        },
        {
            nombre: "Thiago Alipio",
            tiempoActividad: "00:17 Hs",
            ronda: 4,
            promedioPorRonda: "00:04 Hs",
            pedidos: 4,
            promedioPorPedido: "00:04 Hs",
            productos: 4,
            productosPorMinuto: "0.24 productos/minuto",
            items: 4,
            itemsPorMinuto: "0.24 ítems/minuto",
            foundRate: 0.0,
            fillRate: 100.0,
        },
        {
            nombre: "Erwin Concha",
            tiempoActividad: "00:01 Hs",
            ronda: 3,
            promedioPorRonda: "00:00 Hs",
            pedidos: 3,
            promedioPorPedido: "00:00 Hs",
            productos: 9,
            productosPorMinuto: "9.00 productos/minuto",
            items: 207,
            itemsPorMinuto: "207.00 ítems/minuto",
            foundRate: 76.0,
            fillRate: 76.0,
        },
    ]);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // Tamaño de página 
    const PER_PAGE = 25;

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
            "Nombre",
            "Tiempo de actividad",
            "Ronda",
            "Promedio por ronda",
            "Pedidos",
            "Promedio por pedido",
            "Productos",
            "Productos por minuto",
            "Ítems",
            "Ítems por minuto",
            "Found rate",
            "Fill rate",
        ];

        const data = rows.map((r) => [
            r.nombre,
            r.tiempoActividad,
            r.ronda,
            r.promedioPorRonda,
            r.pedidos,
            r.promedioPorPedido,
            r.productos,
            r.productosPorMinuto,
            r.items,
            r.itemsPorMinuto,
            `${r.foundRate.toFixed(2)}%`,
            `${r.fillRate.toFixed(2)}%`,
        ]);
        exportToCsv("productividad-de-pickers.csv", [headers, ...data]);
    }, [rows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Exportar",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
        ],
        [handleExport]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Productividad de pickers"
                action={headerActions}
                filters={getFiltersConfig(filters)}
                onFilterChange={(id, value) => {
                    setFilters((prev) => ({ ...prev, [id]: value }));
                    setCurrentPage(1);
                }}
                filterTitle
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
