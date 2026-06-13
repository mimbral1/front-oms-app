"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { type Estado, getEstadoColor } from "@/utils/status";

type UnidadSla = "Hours" | "Days";
type Prioridad = "Baja" | "Media" | "Alta";

interface TipoMotivoRow {
    id: number;
    nombre: string;
    claimMotive: string;
    parent: string;
    descripcion: string;
    logistica: boolean;
    defaultStockout: boolean;
    items: boolean;
    pedidos: boolean;
    area: string;
    sla: number;
    unidad: UnidadSla;
    prioridad: Prioridad;
    estado: Estado;
}

type TipoMotivoFilters = {
    search: string;
    estado: string;
    prioridad: string;
    unidad: string;
};

const PER_PAGE = 20;

const initialFilters: TipoMotivoFilters = {
    search: "",
    estado: "",
    prioridad: "",
    unidad: "",
};

const baseRows: TipoMotivoRow[] = [
    {
        id: 1,
        nombre: "Talle incorrecto",
        claimMotive: "Devolución",
        parent: "Devolución",
        descripcion: "Cliente compró talle incorrecto",
        logistica: false,
        defaultStockout: false,
        items: true,
        pedidos: true,
        area: "Operación",
        sla: 48,
        unidad: "Hours",
        prioridad: "Media",
        estado: "Activo",
    },
    {
        id: 2,
        nombre: "Producto dañado",
        claimMotive: "Devolución",
        parent: "Devolución",
        descripcion: "Producto viene con daño",
        logistica: true,
        defaultStockout: false,
        items: true,
        pedidos: false,
        area: "Calidad",
        sla: 24,
        unidad: "Hours",
        prioridad: "Alta",
        estado: "Activo",
    },
    {
        id: 3,
        nombre: "Falta de stock",
        claimMotive: "Stockout",
        parent: "Stockout",
        descripcion: "No hay stock disponible",
        logistica: false,
        defaultStockout: true,
        items: false,
        pedidos: true,
        area: "Operación",
        sla: 72,
        unidad: "Hours",
        prioridad: "Media",
        estado: "Inactivo",
    },
    {
        id: 4,
        nombre: "Cambio de color",
        claimMotive: "Cambio",
        parent: "Cambio",
        descripcion: "Cliente desea otro color",
        logistica: false,
        defaultStockout: false,
        items: true,
        pedidos: true,
        area: "Operación",
        sla: 2,
        unidad: "Days",
        prioridad: "Baja",
        estado: "Activo",
    },
    {
        id: 5,
        nombre: "Retracto de compra",
        claimMotive: "Devolución",
        parent: "Pedido del cliente",
        descripcion: "Cliente se arrepintió",
        logistica: false,
        defaultStockout: false,
        items: false,
        pedidos: true,
        area: "Atención al cliente",
        sla: 24,
        unidad: "Hours",
        prioridad: "Alta",
        estado: "Inactivo",
    },
];

const filterConfig: FilterConfig<TipoMotivoFilters, TipoMotivoRow>[] = [
    {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
            `${row.nombre} ${row.descripcion} ${row.claimMotive} ${row.parent}`
                .toLowerCase()
                .includes(String(value ?? "").trim().toLowerCase()),
    },
    {
        id: "estado",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
        rowValue: (row) => row.estado,
    },
    {
        id: "prioridad",
        label: "Prioridad",
        type: "select",
        options: [
            { label: "Baja", value: "Baja" },
            { label: "Media", value: "Media" },
            { label: "Alta", value: "Alta" },
        ],
        rowValue: (row) => row.prioridad,
    },
    {
        id: "unidad",
        label: "Unidad SLA",
        type: "select",
        options: [
            { label: "Hours", value: "Hours" },
            { label: "Days", value: "Days" },
        ],
        rowValue: (row) => row.unidad,
    },
];

const Pill = ({ on, text }: { on: boolean; text: string }) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
        {text}
    </span>
);

const getColumns = (): Column<TipoMotivoRow>[] => [
    { header: "Nombre", accessorKey: "nombre" },
    { header: "Claim motive", accessorKey: "claimMotive" },
    { header: "Parent", accessorKey: "parent" },
    { header: "SLA", accessorKey: "sla" },
    { header: "Unidad", accessorKey: "unidad" },
    { header: "Prioridad", accessorKey: "prioridad" },
    {
        header: "Logística",
        accessorKey: "logistica",
        cell: (row) => <Pill on={row.logistica} text={row.logistica ? "Sí" : "No"} />,
    },
    {
        header: "Default (stockout)",
        accessorKey: "defaultStockout",
        cell: (row) => <Pill on={row.defaultStockout} text={row.defaultStockout ? "Sí" : "No"} />,
    },
    {
        header: "Ítems",
        accessorKey: "items",
        cell: (row) => <Pill on={row.items} text={row.items ? "Sí" : "No"} />,
    },
    {
        header: "Pedidos",
        accessorKey: "pedidos",
        cell: (row) => <Pill on={row.pedidos} text={row.pedidos ? "Sí" : "No"} />,
    },
    { header: "Área", accessorKey: "area" },
    {
        header: "Estado",
        accessorKey: "estado",
        cell: (row) => (
            <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getEstadoColor(row.estado)}`}>
                {row.estado}
            </div>
        ),
    },
];

export default function TipoMotivoView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<TipoMotivoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<TipoMotivoFilters, TipoMotivoRow>({
            initialFilters,
            configs: filterConfig,
        });

    const loadRows = useCallback(async () => {
        setLoading(true);
        try {
            setRows(baseRows);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando tipos de motivo (mock):", error);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRows();
    }, [loadRows]);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleHeaderFilterChange = useCallback(
        (id: string, value: string) => {
            setCurrentPage(1);
            handleFilterChange(id, value);
        },
        [handleFilterChange]
    );

    const handleExport = useCallback(() => {
        const headers = ["Nombre", "Claim motive", "Parent", "SLA", "Unidad", "Prioridad", "Logística", "Default (stockout)", "Ítems", "Pedidos", "Área", "Estado"];
        const data = filteredRows.map((row) => [
            row.nombre,
            row.claimMotive,
            row.parent,
            row.sla,
            row.unidad,
            row.prioridad,
            row.logistica ? "Sí" : "No",
            row.defaultStockout ? "Sí" : "No",
            row.items ? "Sí" : "No",
            row.pedidos ? "Sí" : "No",
            row.area,
            row.estado,
        ]);

        exportToCsv("tipos-motivo.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/customers/csx/tipo-motivo/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Exportar",
                variant: "primary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: () => {
                    void loadRows();
                },
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [handleExport, loadRows, router]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Tipos de motivo"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={handleHeaderFilterChange}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <p>Cargando tipos de motivo...</p>
                    ) : (
                        <DataTable
                            data={paginatedRows}
                            columns={columns}
                            dataType="General2"
                            statusKey="estado"
                            rowPaddingY={24}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: TipoMotivoRow) => router.push(`/customers/csx/tipo-motivo/${row.id}`)}
                        />
                    )}

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
