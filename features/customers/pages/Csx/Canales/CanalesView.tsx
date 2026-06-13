"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge/status";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { type Estado } from "@/utils/status";

interface CanalRow {
    id: string;
    nombre: string;
    descripcion: string;
    creator: { username: string; email: string };
    createdDate: string;
    modifiedDate: string;
    status: Estado;
}

type CanalFilters = {
    id: string;
    nombre: string;
    usuario: string;
    estado: string;
};

const PER_PAGE = 10;

const initialFilters: CanalFilters = {
    id: "",
    nombre: "",
    usuario: "",
    estado: "",
};

const mockRows: CanalRow[] = [
    {
        id: "CV-001",
        nombre: "Call Center",
        descripcion: "Llamadas recibidas en Call Center",
        creator: { username: "Leonardo Gambini", email: "leonardo.gambini@janis.com" },
        createdDate: "07/02/2024 12:24:37",
        modifiedDate: "07/02/2024 12:24:37",
        status: "Activo",
    },
    {
        id: "CV-002",
        nombre: "Ecommerce",
        descripcion: "Pedidos web",
        creator: { username: "Ariel Mikowski", email: "ariel.mikowski@janis.com" },
        createdDate: "10/04/2025 11:40",
        modifiedDate: "10/04/2025 15:19",
        status: "Inactivo",
    },
];

const filterConfig: FilterConfig<CanalFilters, CanalRow>[] = [
    {
        id: "id",
        label: "ID",
        type: "text",
        rowValue: (row) => row.id,
    },
    {
        id: "nombre",
        label: "Nombre",
        type: "text",
        rowValue: (row) => row.nombre,
    },
    {
        id: "usuario",
        label: "Usuario creador",
        type: "text",
        rowValue: (row) => row.creator.username,
    },
    {
        id: "estado",
        label: "Estado",
        type: "select",
        options: [
            { label: "Activo", value: "Activo" },
            { label: "Inactivo", value: "Inactivo" },
        ],
        rowValue: (row) => row.status,
    },
];

const statusVariant = (status: Estado) => (status === "Activo" ? "success" : "error");

const getColumns = (): Column<CanalRow>[] => [
    {
        header: "Nombre",
        accessorKey: "nombre",
        cell: (row) => <span>{row.nombre}</span>,
    },
    {
        header: "Descripción",
        accessorKey: "descripcion",
        cell: (row) => <span className="truncate text-sm text-gray-700">{row.descripcion}</span>,
    },
    {
        header: "Usuario creador",
        accessorKey: "creator",
        cell: (row) => (
            <div className="flex items-center gap-2 text-sm">
                <Avatar name={row.creator.username} />
                <span className="max-w-[140px] truncate">{row.creator.username}</span>
            </div>
        ),
    },
    { header: "Fecha de creación", accessorKey: "createdDate", cell: (row) => <span className="text-sm">{row.createdDate}</span> },
    { header: "Modificado", accessorKey: "modifiedDate", cell: (row) => <span className="text-sm">{row.modifiedDate}</span> },
    { header: "Estado", accessorKey: "status", cell: (row) => <StatusBadge status={row.status} variant={statusVariant(row.status)} /> },
];

export default function CanalesView() {
    const router = useRouter();
    const columns = useMemo(() => getColumns(), []);
    const [rows, setRows] = useState<CanalRow[]>([]);
    const [page, setPage] = useState(1);
    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<CanalFilters, CanalRow>({
            initialFilters,
            configs: filterConfig,
        });

    useEffect(() => {
        setRows(mockRows);
    }, []);

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const shownRows = useMemo(() => {
        const startIndex = (page - 1) * PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + PER_PAGE);
    }, [filteredRows, page]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [page, totalRecords]);

    const handleHeaderFilterChange = (id: string, value: string) => {
        setPage(1);
        handleFilterChange(id, value);
    };

    const handleExport = () => {
        const headers = ["ID", "Nombre", "Descripción", "Creador", "Email", "Fecha creación", "Modificado", "Estado"];
        const data = filteredRows.map((row) => [
            row.id,
            row.nombre,
            row.descripcion,
            row.creator.username,
            row.creator.email,
            row.createdDate,
            row.modifiedDate,
            row.status,
        ]);

        exportToCsv("canales.csv", [headers, ...data]);
    };

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => router.push("/customers/csx/canales/nuevo"),
            },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: handleExport,
            },
        ],
        [router, filteredRows]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Canales"
                filters={headerFilters}
                onFilterChange={handleHeaderFilterChange}
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    <DataTable
                        data={shownRows}
                        columns={columns}
                        dataType="General2"
                        statusKey="status"
                        rowPaddingY={20}
                        showStatusBorder
                        rowBgClass="bg-white"
                        onRowClick={(row: CanalRow) => router.push(`/customers/csx/canales/${row.id}`)}
                    />

                    <Pagination
                        currentPage={page}
                        totalRecords={totalRecords}
                        pageSize={PER_PAGE}
                        onPageChange={setPage}
                    />
                </div>
            </div>
        </div>
    );
}
