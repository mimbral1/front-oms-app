// views\MonitoreoView\MonitoreoIntegraciones\MonitoreoIntegracionesView.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";
import { Pagination } from "@/components/ui/pagination";

/* ---------- Tipos API ---------- */

type ApiErrorRow = {
    orderID: number;
    u_ref1: number;
    salesChannelReferenceId: string;
    doctotalsy: number;
    customerCardCode: string;
    customerIntegrated: boolean;
    currentErrorId: number;
    errorCode: string | null;
    errorDescription: string | null;
    orderErrorLinkID: string | number;
    isActive: boolean;
    seq: number;
    source: string | null;
    stateCode: string | null;
    code: string | null;
    httpStatus: number | null;
    message: string | null;
    firstSeenAtUtc: string | null;
    lastSeenAtUtc: string | null;
};

type ApiErrorsResponse = {
    page: number;
    pageSize: number;
    total: number;
    rows: ApiErrorRow[];
};

/* ---------- Tipos UI ---------- */

type EstadoEvento = "failed" | "retrying" | "pending" | "success";

interface IntegrationRetryRow {
    orderErrorLinkID: string; // id del error
    orderId: number;
    u_ref1: number;
    errorCode: string;
    origin: string;
    destination: string;
    event: string;
    status: EstadoEvento;
    error: string;
    attempts: string; // ej: "0/6" (sin dato real por ahora)
    lastAttempt: string;
}

/* ---------- Helpers UI ---------- */

const PER_PAGE = 50;

const STATUS_CONFIG: Record<EstadoEvento, { classes: string; dot: string; label: string }> = {
    failed: { classes: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Fallido" },
    retrying: { classes: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Reintentando" },
    pending: { classes: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500", label: "Pendiente" },
    success: { classes: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Exitoso" },
};

const StatusPill = ({ status }: { status: EstadoEvento }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.failed;
    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold ${cfg.classes}`}
        >
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// mapeo simple de stateCode -> estado visual del monitor
const mapStateToStatus = (stateCode: string | null | undefined): EstadoEvento => {
    const code = (stateCode || "").toLowerCase();
    if (code === "retrying") return "retrying";
    if (code === "pending") return "pending";
    if (code === "success") return "success";
    // cualquier otro (payment_error, invoice_error, ERROR, etc.) lo consideramos failed
    return "failed";
};

/* ---------- Columnas ---------- */

function getColumns(
    isSelected: (id: string) => boolean,
    allSelected: boolean,
    onToggleAll: (checked: boolean) => void,
    onToggleRow: (id: string, checked: boolean) => void,
    onRetryRow: (row: IntegrationRetryRow) => void
): Column<IntegrationRetryRow>[] {
    return [
        {
            header: (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => onToggleAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                    />
                </div>
            ),
            accessorKey: "status",
            cell: (r) => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={isSelected(r.orderErrorLinkID)}
                        onChange={(e) => onToggleRow(r.orderErrorLinkID, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ),
        },
        {
            header: "ID",
            accessorKey: "orderErrorLinkID",
            cell: (r) => (
                <div className="flex flex-col w-[70px]">
                    <CopyableText text={String(r.orderErrorLinkID)} className="font-medium text-gray-900">{r.orderErrorLinkID}</CopyableText>
                </div>
            ),
        },
        {
            header: "Order ID",
            accessorKey: "orderId",
            cell: (r) => (
                <div className="flex flex-col w-[70px]">
                    <CopyableText text={String(r.orderId)} className="font-medium text-gray-900">{r.orderId}</CopyableText>
                </div>
            ),
        },
        {
            header: "URef",
            accessorKey: "u_ref1",
            cell: (r) => (
                <div className="flex flex-col min-w-[160px]">
                    <CopyableText text={String(r.u_ref1)} className="font-medium text-gray-900">{r.u_ref1}</CopyableText>
                </div>
            ),
        },
        {
            header: "Origen",
            accessorKey: "origin",
            cell: (r) => (
                <div className="flex flex-col w-[120px]">
                    <span className="font-medium text-gray-900">{r.origin}</span>
                </div>
            ),
        },
        {
            header: "Destino",
            accessorKey: "destination",
            cell: (r) => (
                <div className="flex flex-col w-[120px]">
                    <span className="font-medium text-gray-900">{r.destination}</span>
                </div>
            ),
        },
        {
            header: "Evento",
            accessorKey: "event",
            cell: (r) => (
                <div className="flex flex-col w-[120px]">
                    <span className="font-medium text-gray-900">{r.event}</span>
                </div>
            ),
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: (r) => <StatusPill status={r.status} />,
        },
        {
            header: "Error",
            accessorKey: "error",
            cell: (r) => (
                <div className="flex flex-col w-[210px]">
                    <span className="font-medium text-gray-900">{r.error}</span>
                </div>
            ),
        },
        {
            header: "Intentos",
            accessorKey: "attempts",
            cell: (r) => (
                <div className="flex flex-col w-[45px]">
                    <span className="font-medium text-gray-900">{r.attempts}</span>
                </div>
            ),
        },
        {
            header: "Último intento",
            accessorKey: "lastAttempt",
            cell: (r) => {
                if (!r.lastAttempt) return "—";

                const d = new Date(r.lastAttempt);
                const fecha = d.toLocaleDateString("es-CL");
                const hora = d.toLocaleTimeString("es-CL");

                return (
                    <div className="flex flex-col text-xs w-[120px]">
                        <span>{fecha}</span>
                        <span>{hora}</span>
                    </div>
                );
            },
        },
        {
            header: "Acciones",
            accessorKey: "status",
            cell: (r) => (
                <div className="flex flex-col w-[120px]">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-full bg-white border px-4 py-1 text-xs font-medium text-black hover:text-blue-600"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRetryRow(r);
                        }}
                    >
                        <ArrowPathIcon className="mr-1 h-4 w-4" />
                        Reintentar
                    </button>
                </div>
            ),
        },
    ];
}

/* ---------- Filtros Header ---------- */

interface Filters {
    search: string;        // buscador general
    source: string;        // selector
    stateCode: string;     // selector (error catalog)
    salesChannel: string;  // selector
}

/* ---------- Página ---------- */

export default function MonitoreoIntegracionesView() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();
    const { token } = useAuth();

    // tabla
    const [rows, setRows] = useState<IntegrationRetryRow[]>([]);
    const [loading, setLoading] = useState(true);

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // mensaje de reintentos (header) + estado de reintento en curso
    const [retrying, setRetrying] = useState(false);
    const [retryMessage, setRetryMessage] = useState<{
        type: "success" | "error" | "info";
        text: string;
    } | null>(null);

    // estados para filtros select 
    const [salesChannelOptions, setSalesChannelOptions] = useState<
        { label: string; value: string }[]
    >([]);

    const [sourceOptions, setSourceOptions] = useState<
        { label: string; value: string }[]
    >([]);

    const [stateCodeOptions, setStateCodeOptions] = useState<
        { label: string; value: string }[]
    >([]);


    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // filtros
    const [filters, setFilters] = useState<Filters>({
        search: "",
        source: "",
        stateCode: "",
        salesChannel: "",
    });

    // selección
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isSelected = useCallback(
        (id: string) => selectedIds.has(id),
        [selectedIds]
    );

    const toggleRow = useCallback((id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(
        (checked: boolean, pageRows: IntegrationRetryRow[]) => {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                const idsOnPage = pageRows.map((r) => r.orderErrorLinkID);
                if (checked) {
                    idsOnPage.forEach((id) => next.add(id));
                } else {
                    idsOnPage.forEach((id) => next.delete(id));
                }
                return next;
            });
        },
        []
    );

    useEffect(() => {
        let mounted = true;

        const loadSalesChannels = async () => {
            try {
                const res = await fetchWithAuth<any>(
                    "comerce-service/sales-channel/Listar?pageSize=500"
                );

                if (!mounted) return;

                const options = (res?.data || []).map((c: any) => ({
                    label: `${c.ReferenceId} · ${c.Name}`,
                    value: String(c.ReferenceId),
                }));

                setSalesChannelOptions(options);
            } catch (err) {
                console.error("Error cargando canales de venta:", err);
                setSalesChannelOptions([]);
            }
        };

        loadSalesChannels();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // cargar listado principal (API oms-service/orders/errors)
    const fetchList = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(currentPage));
            params.set("pageSize", String(PER_PAGE));

            // filtros soportados por API
            if (filters.search) {
                params.set("search", filters.search);
            }

            if (filters.source) {
                params.set("source", filters.source);
            }

            if (filters.stateCode) {
                params.set("errorCode", filters.stateCode);
            }

            if (filters.salesChannel) {
                params.set("salesChannel", filters.salesChannel);
            }

            const res = await fetchWithAuth<ApiErrorsResponse>(
                `oms-service/orders/errors?${params.toString()}`,
                { method: "GET" }
            );

            const data = Array.isArray(res?.rows) ? res.rows : [];

            // mapeo API -> UI
            let mapped: IntegrationRetryRow[] = data.map((it) => ({
                orderErrorLinkID: String(it.orderErrorLinkID ?? it.orderID ?? ""),
                orderId: it.orderID,
                u_ref1: it.u_ref1,
                errorCode: String(it.errorCode || ""),
                origin: String(it.source || "—"),
                destination: String(it.salesChannelReferenceId || "—"),
                event: String(it.errorCode || it.stateCode || "—"),
                status: mapStateToStatus(it.stateCode),
                error: String(it.errorDescription || it.message || "—"),
                // No tenemos intentos reales aún, lo dejamos en blanco legible
                attempts: "—",
                lastAttempt: it.lastSeenAtUtc || "",
            }));

            setRows(mapped);

            const total = Number(res?.total ?? 0);
            const pageSize = Number(res?.pageSize ?? PER_PAGE);
            setTotalRecords(total);
            setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
        } catch (err: any) {
            console.error("Error cargando monitoreo de integraciones:", err?.payload ?? err);
            toast.error("Error al cargar el monitoreo de integraciones");
            setRows([]);
            setTotalRecords(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [
        token,
        fetchWithAuth,
        currentPage,
        filters.search,
        filters.source,
        filters.stateCode,
        filters.salesChannel,
    ]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // recalcular "todos seleccionados" en la página actual
    const allSelectedOnPage = rows.length > 0 && rows.every((r) => selectedIds.has(r.orderErrorLinkID));

    // llamada al endpoint de retry para UNA fila
    const postRetry = useCallback(
        async (row: IntegrationRetryRow) => {
            if (!row.orderId || !row.errorCode) {
                throw new Error("Faltan datos de orderId o errorCode para reintentar.");
            }

            return fetchWithAuth<{
                ok: boolean;
                published?: { ok: boolean; published: string };
            }>(
                `oms-service/orders/errors/${row.orderId}/${row.errorCode}/retry`,
                { method: "POST" }
            );
        },
        [fetchWithAuth]
    );

    // filtros sources 
    useEffect(() => {
        const fetchSources = async () => {
            try {
                const data = await fetchWithAuth<{
                    rows: string[];
                }>("oms-service/orders/sources", {
                    method: "GET",
                });

                const options = (data.rows || []).map((source) => ({
                    label: source,
                    value: source,
                }));

                setSourceOptions(options);
            } catch (error) {
                console.error("Error cargando sources", error);
            }
        };

        fetchSources();
    }, [fetchWithAuth]);

    // filtros error catalog 
    useEffect(() => {
        const fetchStateCodes = async () => {
            try {
                const data = await fetchWithAuth<{
                    rows: {
                        errorId: number;
                        errorCode: string;
                        description: string;
                    }[];
                }>("oms-service/orders/error-catalog", {
                    method: "GET",
                });

                const options = (data.rows || []).map((item) => ({
                    label: `${item.errorCode} · ${item.description}`,
                    value: item.errorCode,
                }));

                setStateCodeOptions(options);
            } catch (error) {
                console.error("Error cargando error catalog", error);
            }
        };

        fetchStateCodes();
    }, [fetchWithAuth]);

    // acciones de fila (reintento individual)
    const handleRetryRow = useCallback(
        async (row: IntegrationRetryRow) => {
            try {
                setRetrying(true);
                toast.success(`Reintento enviado para la orden ${row.orderId}`);

                const res = await postRetry(row);

                if (res?.ok) {
                    setRetryMessage({
                        type: "success",
                        text: `Se reintentó correctamente el error ${row.orderErrorLinkID}.`,
                    });
                } else {
                    setRetryMessage({
                        type: "error",
                        text: `No se pudo reintentar el error ${row.orderErrorLinkID}.`,
                    });
                }

                // después de reintentar, refrescamos el listado
                fetchList();
            } catch (err: any) {
                toast.error(`Error al reintentar la orden ${row.orderId}`);
                console.error("Error al reintentar evento:", err);
            } finally {
                setRetrying(false);
            }
        },
        [fetchList, postRetry]
    );

    // filtro canales de venta
    useEffect(() => {
        const fetchSalesChannels = async () => {
            try {
                const data = await fetchWithAuth<{
                    ok: boolean;
                    data: {
                        ReferenceId: string;
                        Name: string;
                    }[];
                }>("comerce-service/sales-channel/Listar?pageSize=500", {
                    method: "GET",
                });

                const options = (data.data || []).map((sc) => ({
                    label: sc.Name,
                    value: sc.ReferenceId,
                }));

                setSalesChannelOptions(options);
            } catch (error) {
                console.error("Error cargando sales channels", error);
            }
        };

        fetchSalesChannels();
    }, [fetchWithAuth]);

    // columnas
    const columns = useMemo(
        () =>
            getColumns(
                isSelected,
                allSelectedOnPage,
                (checked: boolean) => toggleAll(checked, rows),
                toggleRow,
                handleRetryRow
            ),
        [isSelected, allSelectedOnPage, toggleAll, rows, toggleRow, handleRetryRow]
    );

    const handleBulkRetry = useCallback(async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) {
            toast.error("No hay registros seleccionados para reintentar");
            return;
        }

        const selectedRows = rows.filter((r) => selectedIds.has(r.orderErrorLinkID));
        const idsTexto = selectedRows.map((r) => r.orderErrorLinkID).join(", ");

        try {
            setRetrying(true);

            // mensaje inicial descriptivo
            const toastId = toast.loading("Reintentando errores seleccionados...");

            const results = await Promise.all(
                selectedRows.map(async (row) => {
                    try {
                        const res = await postRetry(row);
                        return { row, ok: !!res?.ok };
                    } catch (err) {
                        console.error("Error al reintentar seleccionado:", err);
                        return { row, ok: false };
                    }
                })
            );

            const okRows = results.filter((r) => r.ok).map((r) => r.row);
            const failRows = results.filter((r) => !r.ok).map((r) => r.row);

            const okIds = okRows.map((r) => r.orderErrorLinkID).join(", ");
            const failIds = failRows.map((r) => r.orderErrorLinkID).join(", ");

            if (failRows.length === 0) {
                toast.success(`Reintento exitoso (${okRows.length})`, { id: toastId });
            } else if (okRows.length === 0) {
                toast.error("No se pudo reintentar ningún registro", { id: toastId });
            } else {
                toast.error(
                    `Reintentos parciales: OK ${okRows.length}, Fallidos ${failRows.length}`,
                    { id: toastId }
                );
            }

            // refrescamos listado
            fetchList();

            // limpiar selección después del reintento
            setSelectedIds(new Set());

        } finally {
            setRetrying(false);
        }
    }, [selectedIds, rows, postRetry, fetchList]);

    const handleDiscard = useCallback(() => {
        const ids = Array.from(selectedIds);
        if (!ids.length) {
            toast.error("No hay registros seleccionados para descartar");
            return;
        }
        console.log("Descartar seleccionados:", ids);
    }, [selectedIds]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: retrying ? "Reintentando..." : "Reintentar seleccionados",
                variant: "primary",
                onClick: handleBulkRetry,
                disabled: retrying,
                icon: <ArrowPathIcon className={`h-5 w-5 ${retrying ? "animate-spin" : ""}`} />,
            },
            {
                label: "Descartar",
                variant: "error",
                onClick: handleDiscard,
                icon: <TrashIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: () => fetchList(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [handleBulkRetry, handleDiscard, fetchList, retrying]
    );

    const headerFilters = useMemo(() => [
        {
            id: "search" as const,
            label: "Buscar (ID, URef, Error)",
            type: "text" as const,
            value: filters.search,
        },
        {
            id: "salesChannel" as const,
            label: "Canal de venta",
            type: "select-search" as const,
            value: filters.salesChannel,
            options: salesChannelOptions,
        },
        {
            id: "source" as const,
            label: "Origen",
            type: "select-search" as const,
            value: filters.source,
            options: sourceOptions,
        },
        {
            id: "stateCode" as const,
            label: "Estado",
            type: "select-search" as const,
            value: filters.stateCode,
            options: stateCodeOptions,
        },
    ], [
        filters.search,
        filters.salesChannel,
        filters.source,
        filters.stateCode,
        salesChannelOptions,
        sourceOptions,
        stateCodeOptions,
    ]);

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Monitor de Integraciones · Reintentos"
                description="OMS · Finance · SAP · VTEX · Multivende"
                action={headerActions}
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        // mismo estilo de "cargando" 
                        <div className="bg-white p-6 space-y-6">
                            <div className="overflow-x-auto border rounded-md">
                                <table className="min-w-full text-sm">
                                    <tbody>
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-4 py-6 text-center text-gray-500"
                                            >
                                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                                Cargando monitoreo de integraciones…
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            data={rows}
                            columns={columns}
                            dataType="General2"
                            statusKey="status"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: IntegrationRetryRow) =>
                                router.push(`/monitoreo/monitoreo-integraciones/${row.orderErrorLinkID}`)
                            }
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
