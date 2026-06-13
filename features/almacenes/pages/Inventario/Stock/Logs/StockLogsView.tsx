"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    UserIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

type LogStatus = "OK" | "Error";

type StockLogRow = {
    id: string;
    date: string;
    user: string;
    event: string;
    entity: string;
    detail: string;
    status: LogStatus;
};

const PER_PAGE = 20;

const MOCK_LOGS: StockLogRow[] = [
    {
        id: "log-1",
        date: "08/09/2025 14:05:22",
        user: "Ariel Mikowski",
        event: "Stock actualizado",
        entity: "Stock",
        detail: "Se actualizo stock disponible a 979 unidades.",
        status: "OK",
    },
    {
        id: "log-2",
        date: "01/09/2025 18:22:45",
        user: "Sistema",
        event: "Publicacion enviada",
        entity: "Plataformas",
        detail: "Se envio SKU 2016364 a Vtex.",
        status: "OK",
    },
    {
        id: "log-3",
        date: "01/09/2025 18:22:36",
        user: "Sistema",
        event: "Error de publicacion",
        entity: "Plataformas",
        detail: "Vtex respondio 400 - Bad Request.",
        status: "Error",
    },
    {
        id: "log-4",
        date: "28/03/2025 13:19:00",
        user: "Sistema",
        event: "Stored Good creado",
        entity: "Almacenamiento",
        detail: "Se creo stored good 6088a0469bb6e6c8...",
        status: "OK",
    },
    {
        id: "log-5",
        date: "14/11/2022 18:06:12",
        user: "Manuel Vilche",
        event: "Registro creado",
        entity: "Stock",
        detail: "Se creo el stock inicial para Viña Maipo T...",
        status: "OK",
    },
];

const statusClass: Record<LogStatus, string> = {
    OK: "bg-green-500 text-white",
    Error: "bg-rose-500 text-white",
};

const StatusPill = ({ status }: { status: LogStatus }) => (
    <span className={`inline-flex min-w-[88px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>
        {status}
    </span>
);

const formatDateWithoutSeconds = (value: string) => value.replace(/:\d{2}$/, "");

const getColumns = (): Column<StockLogRow>[] => [
    {
        header: "Fecha",
        accessorKey: "date",
        cell: (row) => <span className="text-sm font-medium text-slate-700">{formatDateWithoutSeconds(row.date)}</span>,
    },
    {
        header: "Usuario",
        accessorKey: "user",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-blue-700">{row.user}</span>
            </div>
        ),
    },
    {
        header: "Evento",
        accessorKey: "event",
        cell: (row) => <span className="text-sm font-semibold text-slate-800">{row.event}</span>,
    },
    {
        header: "Entidad",
        accessorKey: "entity",
        cell: (row) => <span className="text-sm font-medium text-slate-700">{row.entity}</span>,
    },
    {
        header: "Detalle",
        accessorKey: "detail",
        cell: (row) => <span className="block max-w-[360px] truncate text-sm font-medium text-slate-700">{row.detail}</span>,
    },
    {
        header: "Estado",
        accessorKey: "status",
        cell: (row) => <StatusPill status={row.status} />,
    },
];

export default function StockLogsView() {
    const router = useRouter();
    const { id } = useParams<{ id?: string | string[] }>();
    const stockId = Array.isArray(id) ? id[0] : id;
    const [currentPage, setCurrentPage] = useState(1);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/inventario/stock"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Stock</div>
                    <div className="text-2xl font-semibold text-gray-900">{stockId || "Logs"}</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions, stockId]
    );

    const columns = useMemo(() => getColumns(), []);
    const totalRecords = MOCK_LOGS.length;
    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return MOCK_LOGS.slice(start, start + PER_PAGE);
    }, [currentPage]);

    return (
        <div className="min-h-screen bg-[#e8eaf5] p-6">
            <div className="space-y-4">
                <DataTable
                    data={pagedRows}
                    columns={columns}
                    dataType="General2"
                    statusKey="status"
                    rowPaddingY={12}
                    rowBgClass="bg-white"
                    showStatusBorder
                />

                <Pagination
                    currentPage={currentPage}
                    totalRecords={totalRecords}
                    pageSize={PER_PAGE}
                    onPageChange={setCurrentPage}
                />

                <div className="text-xs text-slate-600">
                    {totalRecords} resultados &nbsp; {PER_PAGE} por pagina
                </div>
            </div>
        </div>
    );
}
