// views\Customers\CentroMensajes\Tickets\TicketsView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";

import { useApiTickets } from "@/app/fetchWithAuth/api-clientes/api-tickets/api-tickets";
import { Pagination } from "@/components/ui/pagination";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { ActionButton } from "@/components/ui/button/action-button";

/* ──────────────────────────────
   Tipos UI
────────────────────────────── */

interface TicketRow {
    id: number;
    clienteId: string;
    ordenId: number | null;
    titulo: string;
    fechaCreado: string;
    estado: string;
    urgencia: string;
    canal: string;
    nItems: number;
}

interface Filters {
    idCustomer: string;
    idOrder: string;
    idTicket: string;
}

/* ──────────────────────────────
   Helpers
────────────────────────────── */

const PER_PAGE = 10;

const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-400";
    if (status.toLowerCase().includes("asignado")) return "bg-blue-500";
    if (status.toLowerCase().includes("cerrado")) return "bg-gray-500";
    if (status.toLowerCase().includes("abierto")) return "bg-green-500";
    return "bg-indigo-500";
};

const getColumns = (router: ReturnType<typeof useRouter>): Column<TicketRow>[] => [
    {
        header: "ID",
        accessorKey: "id",
        cell: (r) => (
            <span
                onClick={() => router.push(`/customers/csx/tickets/${r.id}`)}
                className="cursor-pointer hover:underline font-medium"
            >
                {r.id}
            </span>
        ),
    },
    {
        header: "Cliente",
        accessorKey: "clienteId",
        cell: (r) => (
            <span
                className="font-medium text-gray-900 hover:underline hover:text-black cursor-copy focus:outline-none truncate"
                title="Copiar cliente"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigator.clipboard?.writeText(String(r.clienteId ?? ""));
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard?.writeText(String(r.clienteId ?? ""));
                    }
                }}
            >
                {r.clienteId || "—"}
            </span>
        ),
    },
    {
        header: "Orden",
        accessorKey: "ordenId",
        cell: (r) =>
            r.ordenId ? (
                <span
                    className="font-medium text-gray-900 hover:underline hover:text-black cursor-copy focus:outline-none truncate"
                    title="Copiar orden"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard?.writeText(String(r.ordenId));
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            navigator.clipboard?.writeText(String(r.ordenId));
                        }
                    }}
                >
                    {r.ordenId}
                </span>
            ) : (
                "—"
            ),
    },
    { header: "Título", accessorKey: "titulo" },
    { header: "Fecha creación", accessorKey: "fechaCreado" },
    {
        header: "Estado",
        accessorKey: "estado",
        cell: (r) => (
            <div
                className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
                    r.estado
                )}`}
            >
                {r.estado || "—"}
            </div>
        ),
    },
    { header: "Urgencia", accessorKey: "urgencia" },
    { header: "Canal", accessorKey: "canal" },
    { header: "N° Items", accessorKey: "nItems" },
];

/* ──────────────────────────────
   Vista
────────────────────────────── */

export default function TicketsView() {
    const router = useRouter();
    const { getTickets } = useApiTickets();

    const [data, setData] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [filters, setFilters] = useState<Filters>({
        idCustomer: "",
        idOrder: "",
        idTicket: "",
    });

    const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(n, max));


    /* ─────────── Estados filtros ─────────── */

    const [draftFilters, setDraftFilters] = useState({
        idTicket: "",
        idCustomer: "",
        idOrder: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        idTicket: "",
        idCustomer: "",
        idOrder: "",
    });

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* ─────────────────────────────────────── */


    const load = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await getTickets({
                page,
                pageSize: PER_PAGE,
                isDetails: true,
                isItemlist: true,
                ...(appliedFilters.idTicket && { idTicket: appliedFilters.idTicket }),
                ...(appliedFilters.idCustomer && { idCustomer: appliedFilters.idCustomer }),
                ...(appliedFilters.idOrder && { idOrder: appliedFilters.idOrder }),
            });

            // Si backend responde success: false
            if (!res?.success) {
                const backendMessage =
                    res?.data?.message ||
                    "Ha ocurrido un error al cargar los tickets.";

                setErrorMessage(backendMessage);
                setData([]);
                setTotalPages(1);
                setTotalRecords(0);
                return;
            }

            const payload = res.data;

            const mapped: TicketRow[] = (payload.tickets ?? []).map((t: any) => ({
                id: t.ticket?.id,
                clienteId: t.cliente?.id,
                ordenId: t.ticket?.ordenId ?? null,
                titulo: t.ticket?.titulo ?? "",
                fechaCreado: t.ticket?.fechaCreado
                    ? new Date(t.ticket.fechaCreado).toLocaleString("es-CL")
                    : "—",
                estado: t.ticket?.estadoActual?.nombre ?? "",
                urgencia: t.ticket?.nivelUrgencia?.nombre ?? "—",
                canal: t.ticket?.canal?.nombre ?? "—",
                nItems: Array.isArray(t.ticket?.items)
                    ? t.ticket.items.length
                    : 0,
            }));

            setData(mapped);
            setTotalPages(payload.totalPages ?? 1);
            setTotalRecords(payload.totalRecords ?? 0);
        } catch (error: any) {
            console.log("ERROR COMPLETO:", error);

            const backendMessage =
                error?.response?.data?.data?.message ||  // ↍ TU CASO (Axios típico)
                error?.response?.data?.message ||       // otro caso común
                error?.data?.message ||                 // si tu cliente retorna data directo
                error?.message;                         // fallback del Error

            setErrorMessage(
                backendMessage ||
                "Error al cargar los tickets. Intenta nuevamente."
            );

            setData([]);
            setTotalPages(1);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [page, appliedFilters]);


    useEffect(() => {
        load();
    }, [load]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () =>
                    router.push("/customers/csx/tickets/nuevo"),
            },
            {
                label: "Exportar",
                variant: "primary",
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
                onClick: () => {
                    const headers = [
                        "ID",
                        "Cliente",
                        "Orden",
                        "Título",
                        "Fecha creación",
                        "Estado",
                        "Urgencia",
                        "Canal",
                        "N° Items",
                    ];

                    const rows = data.map((r) => [
                        r.id,
                        r.clienteId,
                        r.ordenId ?? "",
                        r.titulo,
                        r.fechaCreado,
                        r.estado,
                        r.urgencia,
                        r.canal,
                        r.nItems,
                    ]);

                    exportToCsv("tickets.csv", [headers, ...rows]);
                },
            },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => load(),
            },
        ],
        [router, data, load]
    );

    // filtros
    const headerFilters = [
        {
            id: "idTicket",
            label: "ID Ticket",
            type: "text" as const,
            value: draftFilters.idTicket,
        },
        {
            id: "idCustomer",
            label: "Cliente",
            type: "text" as const,
            value: draftFilters.idCustomer,
        },
        {
            id: "idOrder",
            label: "Orden",
            type: "text" as const,
            value: draftFilters.idOrder,
        },
    ];

    const handleFilterChange = (id: string, value: string) => {
        setDraftFilters((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSearch = () => {
        setAppliedFilters({ ...draftFilters });
        setPage(1);
    };

    const handleClear = () => {
        const empty = {
            idTicket: "",
            idCustomer: "",
            idOrder: "",
        };
        setDraftFilters(empty);
        setAppliedFilters(empty);
        setPage(1);
    };


    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Tickets"
                action={headerActions}
                filters={headerFilters}
                filterTitle
                onFilterChange={handleFilterChange}
                filtersRight={
                    <div className="flex gap-2">
                        <ActionButton
                            variant="primary"
                            onClick={handleSearch}
                        >
                            Buscar
                        </ActionButton>
                        <ClearFiltersButton onClick={handleClear} />
                    </div>
                }
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                                            Cargando tickets…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : errorMessage ? (
                        <div
                            className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon
                                        className="h-5 w-5 text-red-400"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium">
                                        Error al cargar tickets
                                    </h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
                                    <div className="mt-4">
                                        <div className="-mx-2 -my-1.5 flex">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setErrorMessage(null);
                                                    handleSearch();
                                                }}
                                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-sm py-10">
                            <p className="text-lg font-medium text-gray-700">
                                No hay tickets para mostrar
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Ajusta los filtros o intenta nuevamente.
                            </p>
                        </div>
                    ) : (
                        <DataTable
                            data={data}
                            columns={getColumns(router)}
                            dataType="General"
                            statusKey="estado"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: TicketRow) =>
                                router.push(`/customers/csx/tickets/${row.id}`)
                            }
                        />
                    )}

                    {/* Paginación */}
                    {!errorMessage && (
                        <Pagination
                            currentPage={page}
                            totalRecords={totalRecords}
                            pageSize={PER_PAGE}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>
        </div>
    );

}
