// views\Picking\Reportes\Faltantes\ReporteDeFaltantesView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { ClearFiltersButton } from "@/components/ui/clear-filters";

/* ---------- Tipos UI ---------- */
type Row = {
    fechaPicking: string;
    horaPicking: string;
    commerceId: string;
    inventario: string;
    producto: string;
    refId: string;
    precio: number;
    cantComprada: number;
    cantSustituida: number;
    cantFaltante: number;
};

/* ---------- Helpers UI  ---------- */
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
        {
            header: "Fecha de picking",
            accessorKey: "fechaPicking"
        },
        {
            header: "Hora de picking",
            accessorKey: "horaPicking"
        },
        {
            header: "Commerce ID",
            accessorKey: "commerceId"
        },
        {
            header: "Inventario",
            accessorKey: "inventario"
        },
        {
            header: "Producto",
            accessorKey: "producto"
        },
        {
            header: "Ref ID",
            accessorKey: "refId"
        },
        {
            header: "Precio",
            accessorKey: "precio",
            cell: (r) => <span className="font-semibold">{r.precio.toFixed(2)}</span>
        },
        {
            header: "Cant. comprada",
            accessorKey: "cantComprada",
            cell: (r) => <Bubble text={r.cantComprada.toFixed(2)} />
        },
        {
            header: "Cant. sustituida",
            accessorKey: "cantSustituida",
            cell: (r) => <Bubble text={r.cantSustituida.toFixed(2)} />
        },
        {
            header: "Cant. faltante",
            accessorKey: "cantFaltante",
            cell: (r) => <Bubble text={r.cantFaltante.toFixed(2)} />
        },
    ];
}

/* ---------- Filtros Header  ---------- */
interface Filters {
    dateFrom: string; // yyyy-MM-dd
    dateTo: string;   // yyyy-MM-dd
    inventario: string;
    pedido: string;
}

const getFiltersConfig = (f: Filters) => {
    return [
        {
            id: "dateFrom",
            label: "Fecha de picking desde",
            type: "datetime" as const,
            value: f.dateFrom
        },
        {
            id: "dateTo",
            label: "Fecha de picking hasta",
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
            options: [
                { label: "Todos", value: "" },
            ]
        },
    ];
};

/* ---------- Página ---------- */
export default function ReporteDeFaltantesView() {
    const columns = useMemo(() => getColumns(), []);

    // filtros
    const [filters, setFilters] = useState<Filters>({
        dateFrom: "2023-02-01",
        dateTo: "2023-09-30",
        inventario: "Inventario",
        pedido: ""
    });

    // tabla (mock)
    const [rows, setRows] = useState<Row[]>([
        {
            fechaPicking: "2023/08/14",
            horaPicking: "15:20",
            commerceId: "13541810000863-01",
            inventario: "Palermo",
            producto:
                "Llana de yeso con dientes (mango de plástico) 280x130mm. Dientes 10x10 mm Tirador TPR y ABS. - Pesables x Qty",
            refId: "7C07A51FB3354740",
            precio: 0.39,
            cantComprada: 1.0,
            cantSustituida: 1.0,
            cantFaltante: 0.0
        },
        {
            fechaPicking: "2023/08/14",
            horaPicking: "15:04",
            commerceId: "13541810000859-01",
            inventario: "Palermo",
            producto:
                "Llana Helicoptero para concreto, motor HondaGX160 4.0Kw(5.5HP)78Kgs.- Num. de cuchillas(8meses)",
            refId: "B2F434A94FE648AB",
            precio: 890.01,
            cantComprada: 1.0,
            cantSustituida: 1.0,
            cantFaltante: 0.0
        },
        {
            fechaPicking: "2023/08/14",
            horaPicking: "15:04",
            commerceId: "13541810000859-01",
            inventario: "Palermo",
            producto:
                "Llana de yeso con dientes (mango de plástico) 280x130mm. Dientes 10x10 mm Tirador TPR y ABS. - Pesables x Qty",
            refId: "7C07A51FB3354740",
            precio: 0.39,
            cantComprada: 1.0,
            cantSustituida: 0.0,
            cantFaltante: 1.0
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
            "Fecha de picking",
            "Hora de picking",
            "Commerce ID",
            "Inventario",
            "Producto",
            "Ref ID",
            "Precio",
            "Cant. comprada",
            "Cant. sustituida",
            "Cant. faltante",
        ];
        const data = rows.map((r) => [
            r.fechaPicking,
            r.horaPicking,
            r.commerceId,
            r.inventario,
            r.producto,
            r.refId,
            r.precio.toFixed(2),
            r.cantComprada.toFixed(2),
            r.cantSustituida.toFixed(2),
            r.cantFaltante.toFixed(2),
        ]);
        exportToCsv("reporte-de-faltantes.csv", [headers, ...data]);
    }, [rows]);

    const handleRefresh = useCallback(() => {
        setRows((prev) => [...prev]);
    }, []);

    const handleClear = useCallback(() => {
        setFilters({
            dateFrom: "2023-02-01",
            dateTo: "2023-09-30",
            inventario: "Inventario",
            pedido: ""
        });
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
                title="Reporte de faltantes"
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
