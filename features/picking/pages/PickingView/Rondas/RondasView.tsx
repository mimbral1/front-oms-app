"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { PickingStatusBadge, DateTimeCell, CountBadgeCell } from "@/features/picking/components";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { ClearFiltersButton } from "@/components/ui/clear-filters";
import { SimpleModal } from "@/components/ui/modal";
import { PICKING_SESSIONS_API } from "@/lib/http/endpoints";

/* ──────────────────────────── Tipos API ──────────────────────────── */
const SESSIONS_ENDPOINT = PICKING_SESSIONS_API;

interface CommerceOrder {
    omsOrderHeaderId: string;
    omsOrderId: string;
    shipmentCode: string;
}

interface CommerceEntry {
    commerceId: string | null;
    orders: CommerceOrder[];
}

interface SessionData {
    session: {
        id: string;
        displayId?: string;
        pickingPointId: string;
        pickingPointReferenceId?: string;
        pickingPointName?: string;
        pickerId: string;
        pickerName?: string;
        pickerEmail?: string;
        waveId: string | null;
        carrierId?: string | null;
        status: string;
        statusName: string;
        createdAt: string;
        startedAt: string | null;
        finishedAt: string | null;
        itemsCount?: number;
        ordersCount?: number;
    };
    ordersCount?: number;
    itemsCount?: number;
    commerces?: CommerceEntry[];
}

/* ──────────────────────────── Tipos UI ──────────────────────────── */
type Complejidad = "Simple" | "Medio" | "Complejo";

const statusColorMap: Record<string, string> = {
    Pickeada: "bg-green-500",
    Finalizada: "bg-green-500",
    Iniciada: "bg-blue-500",
    Expirada: "bg-gray-500",
    Creada: "bg-gray-400",
    Pendiente: "bg-gray-400",
};

export type RondaRow = {
    id: string;
    displayId: string;
    pickingPoint: string;

    // ola
    olaFecha: string;
    olaHorario: string;

    // picker
    pickerNombre: string;
    pickerEmail: string;

    // pedidos
    pedidos: number;
    pedidosDetalle: Array<{
        commerceId: string;
        omsOrderId: string;
    }>;

    transportista: string;

    // entrega
    entregaFecha: string;
    entregaHorario: string;

    // productos
    productos: string;
    items: string;
    complejidad: Complejidad;

    estado: string;
};

type FiltersState = {
    search: string;
    pickingPoint: string;
    picker: string;
};

const getFiltersConfig = (
    filters: FiltersState,
    pickingPointOptions: { label: string; value: string }[],
    pickerOptions: { label: string; value: string }[]
) => [
        { id: "search", label: "ID", type: "text" as const, value: filters.search },
        {
            id: "pickingPoint",
            label: "Picking point",
            type: "select-search" as const,
            value: filters.pickingPoint,
            options: pickingPointOptions,
        },
        {
            id: "picker",
            label: "Picker",
            type: "select-search" as const,
            value: filters.picker,
            options: pickerOptions,
        },
    ];

const PER_PAGE = 20;

/* ──────────────────────────── Helpers ──────────────────────────── */
const fmtDate = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL", { year: "numeric", month: "2-digit", day: "2-digit" });
};
const fmtTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
};

const getComplejidad = (itemCount: number): Complejidad => {
    if (itemCount <= 2) return "Simple";
    if (itemCount <= 5) return "Medio";
    return "Complejo";
};

const mapSessionToRow = (entry: SessionData): RondaRow => {
    const { session } = entry;
    const ordersCount = Number(entry.ordersCount ?? session.ordersCount ?? 0);
    const itemsCount = Number(entry.itemsCount ?? session.itemsCount ?? 0);

    const pedidosDetalle = (entry.commerces ?? []).flatMap((commerce) =>
        (commerce.orders ?? []).map((order) => ({
            commerceId: commerce.commerceId ?? "-",
            omsOrderId: order.omsOrderId ?? "-",
        }))
    );

    return {
        id: session.id,
        displayId: session.displayId ?? session.id,
        pickingPoint: session.pickingPointName ?? session.pickingPointId,
        olaFecha: fmtDate(session.createdAt),
        olaHorario: session.startedAt
            ? `${fmtTime(session.startedAt)}${session.finishedAt ? " - " + fmtTime(session.finishedAt) : ""}`
            : fmtTime(session.createdAt),
        pickerNombre: session.pickerName ?? session.pickerId,
        pickerEmail: session.pickerEmail ?? "",
        pedidos: ordersCount,
        pedidosDetalle,
        transportista: session.carrierId ?? "-",
        entregaFecha: fmtDate(session.finishedAt),
        entregaHorario: fmtTime(session.finishedAt),
        productos: `${itemsCount}/${itemsCount} Productos`,
        items: `${itemsCount}/${itemsCount} items`,
        complejidad: getComplejidad(itemsCount),
        estado: session.statusName,
    };
};

/* ──────────────────────────── UI helpers ──────────────────────────── */
const ChipEstado = ({ s }: { s: string }) => (
    <PickingStatusBadge status={s} colorMap={statusColorMap} />
);

/* ──────────────────────────── Columnas ──────────────────────────── */
function getColumns(onOpenPedidos: (row: RondaRow) => void): Column<RondaRow>[] {
    return [
        { header: "ID", accessorKey: "displayId", cell: (r) => <CopyableText text={r.displayId}>{r.displayId}</CopyableText> },

        { header: "Picking point", accessorKey: "pickingPoint", cell: (r) => <CopyableText text={r.pickingPoint}>{r.pickingPoint}</CopyableText> },

        {
            header: "Ola",
            accessorKey: "olaFecha",
            cell: (r) => <DateTimeCell date={r.olaFecha} time={r.olaHorario} />,
        },

        {
            header: "Picker",
            accessorKey: "pickerNombre",
            cell: (r) => (
                <div className="flex flex-col">
                    <span className="font-medium">{r.pickerNombre}</span>
                    <span className="text-xs text-gray-500">{r.pickerEmail}</span>
                </div>
            ),
        },

        {
            header: "Pedidos",
            accessorKey: "pedidos",
            cell: (r) => (
                <button
                    type="button"
                    className="rounded-md hover:bg-gray-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenPedidos(r);
                    }}
                >
                    <CountBadgeCell value={r.pedidos} />
                </button>
            ),
            disableRowClick: true,
        },

        { header: "Transportista", accessorKey: "transportista" },

        {
            header: "Entrega",
            accessorKey: "entregaFecha",
            cell: (r) => <DateTimeCell date={r.entregaFecha} time={r.entregaHorario} />,
        },

        {
            header: "Productos",
            accessorKey: "productos",
            cell: (r) => (
                <div className="flex flex-col gap-1">
                    <span>{r.productos}</span>
                    <span className="text-xs text-gray-500">{r.items}</span>
                </div>
            ),
        },

        {
            header: "Estado",
            accessorKey: "estado",
            cell: (r) => <ChipEstado s={r.estado} />,
        },
    ];
}

/* ──────────────────────────── Página ──────────────────────────── */
export default function RondasView() {
    const router = useRouter();
    const { fetchWithAuthQA } = useFetchWithAuthQA();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPedidos, setSelectedPedidos] = useState<Array<{ commerceId: string; omsOrderId: string }>>([]);
    const [selectedRondaId, setSelectedRondaId] = useState("");

    const handleOpenPedidos = useCallback((row: RondaRow) => {
        setSelectedRondaId(row.id);
        setSelectedPedidos(row.pedidosDetalle ?? []);
        setModalOpen(true);
    }, []);

    const columns = useMemo(() => getColumns(handleOpenPedidos), [handleOpenPedidos]);

    // tabla
    const [allRows, setAllRows] = useState<RondaRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FiltersState>({
        search: "",
        pickingPoint: "",
        picker: "",
    });

    // paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const hasActiveFilters = useMemo(
        () => Object.values(filters).some((value) => value.trim() !== ""),
        [filters]
    );

    const handleClearFilters = useCallback(() => {
        setFilters({
            search: "",
            pickingPoint: "",
            picker: "",
        });
        setCurrentPage(1);
    }, []);

    const filteredRows = useMemo(() => {
        const qId = filters.search.trim().toLowerCase();
        const qPickingPoint = filters.pickingPoint.trim().toLowerCase();
        const qPicker = filters.picker.trim().toLowerCase();

        return allRows.filter((row) => {
            const matchesId = qId ? row.displayId.toLowerCase().includes(qId) : true;
            const matchesPickingPoint = qPickingPoint
                ? row.pickingPoint.toLowerCase() === qPickingPoint
                : true;
            const matchesPicker = qPicker
                ? row.pickerNombre.toLowerCase() === qPicker
                : true;

            return matchesId && matchesPickingPoint && matchesPicker;
        });
    }, [allRows, filters]);

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [filteredRows, currentPage]);

    const pickingPointOptions = useMemo(() => {
        const unique = Array.from(
            new Set(
                allRows
                    .map((r) => r.pickingPoint.trim())
                    .filter((value) => value.length > 0)
            )
        ).sort((a, b) => a.localeCompare(b, "es"));
        return [
            { label: "Todos", value: "" },
            ...unique.map((value) => ({ label: value, value })),
        ];
    }, [allRows]);

    const pickerOptions = useMemo(() => {
        const unique = Array.from(
            new Set(
                allRows
                    .map((r) => r.pickerNombre.trim())
                    .filter((value) => value.length > 0)
            )
        ).sort((a, b) => a.localeCompare(b, "es"));
        return [
            { label: "Todos", value: "" },
            ...unique.map((value) => ({ label: value, value })),
        ];
    }, [allRows]);

    useEffect(() => {
        const total = filteredRows.length;
        setTotalRecords(total);

        const maxPage = Math.max(1, Math.ceil(total / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [filteredRows, currentPage]);

    /* ──────────────────────────── Fetch sessions ──────────────────────────── */
    const loadSessions = useCallback(async () => {
        setLoading(true);
        try {
            let sessionsJson: any;

            try {
                sessionsJson = await fetchWithAuthQA(SESSIONS_ENDPOINT, {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                });
            } catch (absoluteError: any) {
                const message = String(absoluteError?.message || "").toLowerCase();
                const isHtmlResponse =
                    message.includes("unexpected token '<'") ||
                    message.includes("doctype") ||
                    message.includes("not valid json");

                if (!isHtmlResponse) {
                    throw absoluteError;
                }

                // Fallback al endpoint QA relativo cuando el túnel devuelve HTML.
                sessionsJson = await fetchWithAuthQA("picking-service/sessions", {
                    method: "GET",
                });
            }

            const entries: SessionData[] = sessionsJson?.data ?? [];
            const mapped = entries.map(mapSessionToRow);

            setAllRows(mapped);
        } catch (err) {
            console.error("Error al cargar sesiones:", err);
            setAllRows([]);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthQA]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    /* ──────────────────────────── Acciones header ──────────────────────────── */
    const actions: Action[] = useMemo(
        () => [
            // Botón "Nuevo" oculto temporalmente.
            // {
            //     label: "Nuevo",
            //     variant: "success",
            //     onClick: () => router.push("/picking/rondas/nuevo"),
            //     icon: <PlusIcon className="h-5 w-5" />,
            // },
            {
                label: "Exportar",
                variant: "primary",
                onClick: () => {
                    const headers = ["ID", "Picking point", "Estado"];
                    const data = filteredRows.map((r) => [r.displayId, r.pickingPoint, r.estado]);
                    exportToCsv("rondas.csv", [headers, ...data]);
                },
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: () => loadSessions(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [filteredRows, loadSessions]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Rondas de picking"
                action={actions}
                filters={getFiltersConfig(filters, pickingPointOptions, pickerOptions)}
                filtersRight={
                    <ClearFiltersButton
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                    />
                }
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => ({ ...prev, [id]: value }));
                }}
                filterTitle
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">
                    {loading ? (
                        <div className="overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando rondas...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <DataTable
                            data={paginatedRows}
                            columns={columns}
                            dataType="Rondas"
                            statusKey="estado"
                            rowPaddingY={12}
                            showStatusBorder
                            rowBgClass="bg-white"
                            onRowClick={(row: RondaRow) =>
                                router.push(`/picking/rondas/${row.id}`)
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

            <SimpleModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={`Pedidos de la ronda ${selectedRondaId}`}
                maxWidth="sm:max-w-2xl"
            >
                {selectedPedidos.length === 0 ? (
                    <div className="text-sm text-gray-500">No hay pedidos para esta ronda.</div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">Commerce ID</th>
                                    <th className="px-4 py-2">OMS Order ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPedidos.map((pedido, idx) => (
                                    <tr key={`${pedido.commerceId}-${pedido.omsOrderId}-${idx}`} className="border-t border-gray-100">
                                        <td className="px-4 py-2 font-medium text-gray-700">
                                            <CopyableText text={pedido.commerceId}>{pedido.commerceId}</CopyableText>
                                        </td>
                                        <td className="px-4 py-2 text-gray-700">
                                            <CopyableText text={pedido.omsOrderId}>{pedido.omsOrderId}</CopyableText>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SimpleModal>
        </div>
    );
}
