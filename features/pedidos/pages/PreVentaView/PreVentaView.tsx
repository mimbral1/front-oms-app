"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowPathIcon, BanknotesIcon, DocumentTextIcon, UserIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";
import { CopyableText } from "@/components/ui/copyable-text";
import { NewButton } from "@/components/presets/buttons/NewButton";
import { ExportButton } from "@/components/presets/buttons/ExportButton";
import { StatusBadge } from "@/components/ui/badge/status";
import { Pagination } from "@/components/ui/pagination";
import { resolveTableColor } from "@/components/ui/table/table-status-registry";
import { exportToCsv } from "@/components/presets/export/export";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { PRE_ORDER_LIST_API, PRE_ORDER_STATUS_API } from "@/lib/http/endpoints";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";

type PreOrderRow = {
    id: string;
    pedido: string;
    code: string;
    rut: string;
    customerName: string;
    sellerName: string;
    status: string;
    total: number;
    documentType: string;
    createdAt: string;
};

type PreOrderApiItem = {
    datosPedido?: {
        pedido?: string;
        preOrderCode?: string;
        preOrderID?: string | number;
        createdAt?: string;
        seller?: string;
    };
    datosCliente?: {
        nombre?: string;
        rut?: string;
    };
    totales?: {
        total?: number | string;
        tipoDocumento?: string;
    };
    estado?: {
        status?: string;
    };
    id?: string | number;
    Id?: string | number;
    code?: string;
    Code?: string;
    preOrderCode?: string;
    PreOrderCode?: string;
    customerName?: string;
    CustomerName?: string;
    cardName?: string;
    CardName?: string;
    sellerName?: string;
    SellerName?: string;
    status?: string;
    Status?: string;
    total?: number | string;
    Total?: number | string;
    totalAmount?: number | string;
    TotalAmount?: number | string;
    createdAt?: string;
    CreatedAt?: string;
    dateCreated?: string;
    DateCreated?: string;
};

type PreOrderApiResponse = {
    total?: number;
    page?: number;
    pageSize?: number;
    data?: PreOrderApiItem[];
};

type StatusOption = { label: string; value: string };
type PreOrderApiListLike = PreOrderApiResponse & {
    items?: PreOrderApiItem[];
    rows?: PreOrderApiItem[];
};
type PreOrderStatusApiItem = {
    statusID?: string | number;
    statusId?: string | number;
    id?: string | number;
    Id?: string | number;
    preOrderStatusID?: string | number;
    status?: string;
    statusCode?: string;
    name?: string;
    description?: string;
};
type PreOrderStatusApiResponse = {
    data?: PreOrderStatusApiItem[];
    items?: PreOrderStatusApiItem[];
};
const CLP = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});
const DEFAULT_PAGE_SIZE = 50;

const parseCreatedRange = (value: string): { from?: string; to?: string } => {
    if (!value.trim()) return {};

    try {
        const parsed = JSON.parse(value) as { start?: string; end?: string };
        const from = String(parsed?.start ?? "").trim();
        const to = String(parsed?.end ?? "").trim();
        return { from: from || undefined, to: to || undefined };
    } catch {
        return {};
    }
};

const toDisplayDate = (value: string): string => {
    if (!value) return "-";

    const custom = String(value).match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (custom) {
        const day = Number(custom[1]);
        const month = Number(custom[2]);
        const year = Number(custom[3]);
        const hour = Number(custom[4]);
        const minute = Number(custom[5]);
        const second = Number(custom[6]);
        const d = new Date(year, month - 1, day, hour, minute, second);
        if (!Number.isNaN(d.getTime())) {
            return d.toLocaleString("es-CL", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleString("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
};

function normalizePayload(payload: unknown): { rows: PreOrderRow[]; total: number; page: number; pageSize: number } {
    const p: PreOrderApiListLike = typeof payload === "object" && payload !== null ? payload as PreOrderApiListLike : {};
    const source: PreOrderApiItem[] = Array.isArray(p)
        ? (p as unknown as PreOrderApiItem[])
        : Array.isArray(p?.data)
            ? p.data
            : Array.isArray(p?.items)
                ? p.items
                : Array.isArray(p?.rows)
                    ? p.rows
                    : [];

    const rows = source
        .map((item, index) => {
            const datosPedido = item.datosPedido ?? {};
            const datosCliente = item.datosCliente ?? {};
            const totales = item.totales ?? {};
            const estado = item.estado ?? {};

            const idRaw = datosPedido.preOrderID ?? item.id ?? item.Id ?? index;
            const pedido = String(datosPedido.pedido ?? "").trim();
            const code = String(
                datosPedido.preOrderCode ?? item.code ?? item.Code ?? item.preOrderCode ?? item.PreOrderCode ?? idRaw ?? ""
            ).trim();
            const customerName = String(
                datosCliente.nombre ?? item.customerName ?? item.CustomerName ?? item.cardName ?? item.CardName ?? "-"
            ).trim();
            const rut = String(datosCliente.rut ?? "").trim();
            const sellerName = String(datosPedido.seller ?? item.sellerName ?? item.SellerName ?? "-").trim();
            const status = String(estado.status ?? item.status ?? item.Status ?? "Pendiente").trim();
            const documentType = String(totales.tipoDocumento ?? "-").trim();
            const totalRaw = totales.total ?? item.total ?? item.Total ?? item.totalAmount ?? item.TotalAmount ?? 0;
            const totalParsed = Number(totalRaw);
            const total = Number.isFinite(totalParsed) ? totalParsed : 0;
            const createdAt = String(
                datosPedido.createdAt ?? item.createdAt ?? item.CreatedAt ?? item.dateCreated ?? item.DateCreated ?? ""
            ).trim();

            return {
                id: String(idRaw),
                pedido: pedido || "-",
                code: code || String(idRaw),
                rut: rut || "-",
                customerName: customerName || "-",
                sellerName: sellerName || "-",
                status: status || "Pendiente",
                total,
                documentType: documentType || "-",
                createdAt: toDisplayDate(createdAt),
            };
        })
        .filter((row) => Boolean(row.code));

    const total = Number.isFinite(Number(p?.total)) ? Number(p.total) : rows.length;
    const page = Number.isFinite(Number(p?.page)) ? Number(p.page) : 1;
    const pageSize = Number.isFinite(Number(p?.pageSize)) ? Number(p.pageSize) : rows.length;

    return { rows, total, page, pageSize };
}

function normalizeStatusOptions(payload: unknown): StatusOption[] {
    const source = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as PreOrderStatusApiResponse | undefined)?.data)
            ? (payload as PreOrderStatusApiResponse).data!
            : Array.isArray((payload as PreOrderStatusApiResponse | undefined)?.items)
                ? (payload as PreOrderStatusApiResponse).items!
                : [];

    const byValue = new Map<string, StatusOption>();

    source.forEach((item: PreOrderStatusApiItem) => {
        const valueRaw = item?.statusID ?? item?.statusId ?? item?.id ?? item?.Id ?? item?.preOrderStatusID;
        const labelRaw = item?.status ?? item?.statusCode ?? item?.name ?? item?.description;

        const value = String(valueRaw ?? "").trim();
        const label = String(labelRaw ?? "").trim();

        if (!value || !label) return;
        if (!byValue.has(value)) {
            byValue.set(value, { value, label });
        }
    });

    return Array.from(byValue.values());
}

export function PreVentaView() {
    const router = useRouter();
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [rows, setRows] = useState<PreOrderRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchPedido, setSearchPedido] = useState("");
    const [searchCliente, setSearchCliente] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
    const [createdDateFilter, setCreatedDateFilter] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const fetchRows = useCallback(async (targetPage: number = page) => {
        try {
            setLoading(true);
            setError(null);

            const url = new URL(PRE_ORDER_LIST_API);
            const pedidoFilter = searchPedido.trim();
            const { from: createdAtFrom, to: createdAtTo } = parseCreatedRange(createdDateFilter);

            url.searchParams.set("typeID", "2");
            url.searchParams.set("page", String(targetPage));
            url.searchParams.set("pageSize", String(pageSize));

            if (pedidoFilter) {
                if (/^\d+$/.test(pedidoFilter)) {
                    url.searchParams.set("preOrderID", pedidoFilter);
                } else {
                    url.searchParams.set("preOrderCode", pedidoFilter);
                }
            }

            if (statusFilter.trim()) {
                url.searchParams.set("statusID", statusFilter.trim());
            }

            if (createdAtFrom) {
                url.searchParams.set("createdAtFrom", createdAtFrom);
            }

            if (createdAtTo) {
                url.searchParams.set("createdAtTo", createdAtTo);
            }

            const payload = await fetchWithAuthQA<PreOrderApiListLike | PreOrderApiItem[]>(url.toString(), { method: "GET" });
            const normalized = normalizePayload(payload);
            setRows(normalized.rows);
            setTotal(normalized.total);
            setPage(normalized.page);
            setPageSize(normalized.pageSize || pageSize);
        } catch (error: unknown) {
            setRows([]);
            setTotal(0);
            setError(getErrorMessage(error, "No se pudo cargar el listado de pre-ventas."));
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthQA, page, pageSize, searchPedido, statusFilter, createdDateFilter]);

    useEffect(() => {
        fetchRows(page);
    }, [fetchRows]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const payload = await fetchWithAuthQA<PreOrderStatusApiResponse | PreOrderStatusApiItem[]>(PRE_ORDER_STATUS_API, { method: "GET" });

                const normalized = normalizeStatusOptions(payload);
                if (mounted) setStatusOptions(normalized);
            } catch {
                if (mounted) setStatusOptions([]);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuthQA]);

    const filteredRows = useMemo(() => {
        const qPedido = searchPedido.trim().toLowerCase();
        const qCliente = searchCliente.trim().toLowerCase();

        return rows.filter((row) =>
            (!qPedido || `${row.pedido} ${row.code}`.toLowerCase().includes(qPedido)) &&
            (!qCliente || `${row.customerName} ${row.rut}`.toLowerCase().includes(qCliente))
        );
    }, [rows, searchPedido, searchCliente]);

    const handleExport = useCallback(() => {
        const headers = ["Pedido", "Codigo", "RUT", "Cliente", "Vendedor", "Estado", "Documento", "Total", "Creada"];
        const data = filteredRows.map((r) => [
            r.pedido,
            r.code,
            r.rut,
            r.customerName,
            r.sellerName,
            r.status,
            r.documentType,
            String(r.total),
            r.createdAt,
        ]);
        exportToCsv("pre-venta.csv", [headers, ...data]);
    }, [filteredRows]);

    const resetFilters = () => {
        setSearchPedido("");
        setSearchCliente("");
        setStatusFilter("");
        setCreatedDateFilter("");
    };

    const headerFilters = useMemo(
        () => [
            { id: "pedido", label: "ID Pedido", type: "text" as const, value: searchPedido, placeholder: "ID Pedido" },
            { id: "cliente", label: "Cliente", type: "text" as const, value: searchCliente, placeholder: "Cliente" },
            {
                id: "estado",
                label: "Estado",
                type: "select" as const,
                value: statusFilter,
                options: [
                    { label: "Todos los estados", value: "" },
                    ...statusOptions,
                ],
            },
            {
                id: "fecha",
                label: "Fecha creación",
                type: "date-range" as const,
                value: createdDateFilter,
            },
        ],
        [searchPedido, searchCliente, statusFilter, createdDateFilter, statusOptions]
    );

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={1}
                title="Lista de Pre-ventas"
                description="Gestiona y monitorea las pre-ventas activas"
                filters={headerFilters}
                filterTitle
                onFilterChange={(id, value) => {
                    if (id === "pedido") setSearchPedido(value);
                    if (id === "cliente") setSearchCliente(value);
                    if (id === "estado") setStatusFilter(value);
                    if (id === "fecha") setCreatedDateFilter(value);
                }}
                action={
                    <div className="flex items-center gap-2">
                        <ActionButton variant="secondary" onClick={() => fetchRows(page)} disabled={loading}>
                            <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                            Actualizar
                        </ActionButton>
                        <NewButton
                            label="Nueva Pre-venta"
                            onClick={() => router.push("/pedidos/listado-pedidos/nueva-pre-venta")}
                        />
                        <ExportButton onClick={handleExport} disabled={filteredRows.length === 0} />
                        <ActionButton variant="text" onClick={resetFilters}>Limpiar</ActionButton>
                    </div>
                }
                className="flex-wrap"
            />

            <div className="flex-1 p-3 px-6 pb-20">
                {error ? (
                    <div className="mb-4 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full table-auto border-collapse">
                        <thead className="bg-[#E8EAF7]">
                            <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pre-venta</th>
                                <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                                <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vendedor</th>
                                <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Totales</th>
                                <th className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha creación</th>
                                <th className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Cargando pre-ventas...</td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay pre-ventas para mostrar.</td>
                                </tr>
                            ) : (
                                filteredRows.map((row) => {
                                    const rowStatus = row.status || "Pendiente";
                                    const borderColor = resolveTableColor(rowStatus, "Pedidos");
                                    return (
                                        <Fragment key={row.id}>
                                            <tr
                                                className="cursor-pointer transition hover:shadow bg-white shadow-sm"
                                                style={{ boxShadow: `inset 4px 0 0 0 ${borderColor}` }}
                                                onClick={() => router.push(`/pedidos/pre-venta/${row.id}`)}
                                            >
                                                <td className="px-2 py-4 text-sm text-gray-700">
                                                    <div className="font-semibold text-gray-800">
                                                        <CopyableText text={row.pedido}>{row.pedido}</CopyableText>
                                                    </div>
                                                    <div className="text-gray-600">
                                                        <CopyableText text={row.code}>{row.code}</CopyableText>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-4 text-sm text-gray-700">
                                                    <div className="flex items-start gap-2">
                                                        <UserIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                                        <div>
                                                            <div className="font-medium text-gray-800">{row.customerName}</div>
                                                            <div className="text-gray-600">
                                                                <CopyableText text={row.rut}>{row.rut}</CopyableText>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-4 text-sm text-gray-700">{row.sellerName}</td>
                                                <td className="px-2 py-4 text-sm text-gray-700">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <BanknotesIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                            <div className="font-semibold text-gray-800">{CLP.format(row.total)}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                            <div className="text-gray-600">{row.documentType}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-4 text-sm text-gray-700">{row.createdAt}</td>
                                                <td className="px-2 py-4 text-sm text-gray-700 text-center">
                                                    <div className="flex justify-center">
                                                        <StatusBadge
                                                            status={rowStatus}
                                                            variant={getStatusVariant(rowStatus as any)}
                                                            fixed
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={6} style={{ height: 4 }} />
                                            </tr>
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalRecords={total}
                    pageSize={pageSize || DEFAULT_PAGE_SIZE}
                    onPageChange={(nextPage) => {
                        setPage(nextPage);
                        fetchRows(nextPage);
                    }}
                />
            </div>
        </div>
    );
}
