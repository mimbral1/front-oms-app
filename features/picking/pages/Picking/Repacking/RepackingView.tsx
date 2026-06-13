// views\Picking\Repacking\RepackingView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";

import {
    ArrowPathIcon,
    ArrowDownTrayIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";

/* -------------------------------------------------------------------------- */
/*                               Tipo de registro                             */
/* -------------------------------------------------------------------------- */

interface RepackItem {
    repackId: string;
    orderId: string;
    ean: string;
    tipo: string;
    unidades: number;
    skus: number;
    warehouse: string;
    ubicacion: string;
    estado: string;
    fechaCreacion: string;
    usuario: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Mock                                     */
/* -------------------------------------------------------------------------- */

const mockRepacking: RepackItem[] = [
    {
        repackId: "PKG-0001",
        orderId: "ORD-10001",
        ean: "7801234560001",
        tipo: "Caja mediana",
        unidades: 12,
        skus: 4,
        warehouse: "CD-TALCA",
        ubicacion: "RACK-A2-N3",
        estado: "En uso",
        fechaCreacion: "2025-11-25 11:32",
        usuario: "jmolina",
    },
    {
        repackId: "PKG-0002",
        orderId: "ORD-10002",
        ean: "7801234560002",
        tipo: "Caja grande",
        unidades: 20,
        skus: 5,
        warehouse: "CD-TALCA",
        ubicacion: "RACK-B1-N1",
        estado: "En uso",
        fechaCreacion: "2025-11-25 11:45",
        usuario: "cvalenzuela",
    },
    {
        repackId: "PKG-0003",
        orderId: "ORD-10003",
        ean: "7801234560003",
        tipo: "Pallet madera",
        unidades: 60,
        skus: 3,
        warehouse: "CD-TALCA",
        ubicacion: "SECTOR-PALLET-01",
        estado: "Libre",
        fechaCreacion: "2025-11-25 12:05",
        usuario: "fpino",
    },
    {
        repackId: "PKG-0004",
        orderId: "ORD-10004",
        ean: "7801234560004",
        tipo: "Caja pequeña",
        unidades: 4,
        skus: 2,
        warehouse: "TIENDA-CHORRILLOS",
        ubicacion: "BACKROOM-01",
        estado: "Descartado",
        fechaCreacion: "2025-11-25 09:20",
        usuario: "mmunoz",
    },
];

/* -------------------------------------------------------------------------- */
/*                            Helpers para badge estado                       */
/* -------------------------------------------------------------------------- */

const getEstadoColor = (estado: string) => {
    switch (estado) {
        case "En uso":
            return "#22c55e"; // verde
        case "Libre":
            return "#facc15"; // amarillo
        case "Descartado":
            return "#ef4444"; // rojo
        default:
            return "#d1d5db"; // gris
    }
};

/* -------------------------------------------------------------------------- */
/*                                   Columnas                                 */
/* -------------------------------------------------------------------------- */

function getColumns(router: ReturnType<typeof useRouter>): Column<RepackItem>[] {
    return [
        {
            header: "REPACK ID",
            accessorKey: "repackId",
            cell: (row) => (
                <span
                    className="text-blue-600 font-medium cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/picking/packing/repacking/${row.repackId}`);
                    }}
                >
                    {row.repackId}
                </span>
            ),
        },
        { header: "ORDER ID", accessorKey: "orderId" },
        { header: "EAN", accessorKey: "ean" },
        {
            header: "TIPO",
            accessorKey: "tipo",
            cell: (row) => (
                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm">
                    {row.tipo}
                </span>
            ),
        },
        { header: "UNID.", accessorKey: "unidades" },
        { header: "SKUS", accessorKey: "skus" },
        { header: "WAREHOUSE", accessorKey: "warehouse" },
        { header: "UBICACIÓN", accessorKey: "ubicacion" },
        {
            header: "ESTADO",
            accessorKey: "estado",
            cell: (row) => {
                const color = getEstadoColor(row.estado);
                return (
                    <span
                        className="inline-flex items-center justify-center rounded-full px-4 py-1 text-white text-sm"
                        style={{ backgroundColor: color }}
                    >
                        {row.estado}
                    </span>
                );
            },
        },
        { header: "FECHA CREACIÓN", accessorKey: "fechaCreacion" },
        { header: "USUARIO", accessorKey: "usuario" },
    ];
}

/* -------------------------------------------------------------------------- */
/*                              Filtros del Header                            */
/* -------------------------------------------------------------------------- */

interface RepackFilters {
    search: string;
    estado: string;
    warehouse: string;
}


function getFilters(f: RepackFilters) {
    return [
        {
            id: "search",
            label: "Buscar",
            type: "text",
            value: f.search,
        },
        {
            id: "estado",
            label: "Estado",
            type: "select",
            value: f.estado,
            options: [
                { label: "Todos", value: "" },
                { label: "En uso", value: "En uso" },
                { label: "Libre", value: "Libre" },
                { label: "Descartado", value: "Descartado" },
            ],
        },
        {
            id: "warehouse",
            label: "Warehouse",
            type: "select",
            value: f.warehouse,
            options: [
                { label: "Todos", value: "" },
                { label: "CD-TALCA", value: "CD-TALCA" },
                { label: "TIENDA-CHORRILLOS", value: "TIENDA-CHORRILLOS" },
            ],
        },
    ];
}

/* -------------------------------------------------------------------------- */
/*                                  Vista principal                            */
/* -------------------------------------------------------------------------- */

export default function RepackingView() {
    const router = useRouter();

    const [rows] = useState<RepackItem[]>(mockRepacking);

    const [filters, setFilters] = useState<RepackFilters>({
        search: "",
        estado: "",
        warehouse: "",
    });

    const handleFilterChange = (id: string, value: string) =>
        setFilters((prev) => ({ ...prev, [id]: value }));

    const filtered = rows.filter((r) => {
        const s = filters.search.toLowerCase();

        const matchesSearch =
            !s ||
            r.repackId.toLowerCase().includes(s) ||
            r.orderId.toLowerCase().includes(s) ||
            r.ean.toLowerCase().includes(s);

        const matchesEstado =
            !filters.estado || r.estado.toLowerCase() === filters.estado.toLowerCase();

        const matchesWarehouse =
            !filters.warehouse ||
            r.warehouse.toLowerCase() === filters.warehouse.toLowerCase();

        return matchesSearch && matchesEstado && matchesWarehouse;
    });


    /* ---------------------------------------------------------------------- */
    /*                           Acciones del Header                          */
    /* ---------------------------------------------------------------------- */

    const actions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                onClick: () => router.push("/picking/packing/repacking/nuevo"),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Exportar",
                variant: "primary",
                onClick: () => {
                    const headers = [
                        "Repack ID",
                        "Order ID",
                        "EAN",
                        "Tipo",
                        "Unidades",
                        "SKUs",
                        "Warehouse",
                        "Ubicación",
                        "Estado",
                        "Fecha creación",
                        "Usuario",
                    ];

                    const data = filtered.map((r) => [
                        r.repackId,
                        r.orderId,
                        r.ean,
                        r.tipo,
                        r.unidades,
                        r.skus,
                        r.warehouse,
                        r.ubicacion,
                        r.estado,
                        r.fechaCreacion,
                        r.usuario,
                    ]);

                    exportToCsv("repacking.csv", [headers, ...data]);
                },
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: () => console.log("Actualizar lista mock"),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [filtered, router]
    );

    /* ---------------------------------------------------------------------- */
    /*                                 Paginación                             */
    /* ---------------------------------------------------------------------- */

    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const currentData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const columns = getColumns(router);
    const hdrFilters = getFilters(filters) as any[];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                title="Repacking"
                description="Vista de repacking"
                filters={hdrFilters}
                onFilterChange={handleFilterChange}
                action={actions}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">

                    <div className="overflow-hidden rounded-xl shadow-sm">
                        <DataTable
                            data={currentData}
                            columns={columns}
                            dataType="General2"
                            statusKey="estado"
                            rowPaddingY={10}
                            rowBgClass="bg-white"
                            onRowClick={(row) => router.push(`/picking/packing/repacking/${row.repackId}`)}
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
        </div>
    );
}
