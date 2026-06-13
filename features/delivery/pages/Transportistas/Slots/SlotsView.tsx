"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, LockClosedIcon, LockOpenIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { SimpleModal } from "@/components/ui/modal";
import { exportToCsv } from "@/components/presets/export/export";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const formatDateTime = fmtDateTime;
const TIME_SLOT_URL = `${BASE_DELIVERY_SERVICE}/time-slot`;
const PER_PAGE = 20;

type Counter = { done: number; total: number };

type Slot = {
    id: string;
    carrier: string;
    closeBy: string;
    start: string;
    end: string;
    blocked: boolean;
    deliveries: Counter;
    products: Counter;
    packages: Counter;
    status: "Finalizada" | "En curso" | string;
    actions: boolean;
};

type TimeSlotApiItem = {
    id?: string;
    displayId?: string;
    carrierId?: string;
    carrierName?: string;
    dateStart?: string;
    dateEnd?: string;
    closingTime?: string | null;
    status?: string;
    capacityMaxShippingQtyEffective?: number | null;
    capacityMaxShippingQtyValue?: number | null;
    capacityMaxProductQtyEffective?: number | null;
    capacityMaxProductQtyValue?: number | null;
    capacityMaxPackageQtyEffective?: number | null;
    capacityMaxPackageQtyValue?: number | null;
    totalShippings?: number | null;
    totalProducts?: number | null;
    totalPackages?: number | null;
    isLocked?: boolean | null;
    dateModified?: string | null;
};

type TimeSlotApiResponse = {
    data?: TimeSlotApiItem[];
};

interface SlotFilters {
    dateRange: string;
    location: string;
    carrier: string;
    method: string;
}

const initialFilters: SlotFilters = {
    dateRange: "",
    location: "",
    carrier: "",
    method: "",
};

const parseDateRange = (raw: string): { start: string; end: string } | null => {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as { start?: string; end?: string };
        if (!parsed.start || !parsed.end) return null;
        return { start: parsed.start, end: parsed.end };
    } catch {
        return null;
    }
};

const pill = (done: number, total: number) => (
    <span className="inline-flex min-w-[72px] justify-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800">
        {done}/{total}
    </span>
);

function getColumns({
    onToggleLock,
    lockingIds,
}: {
    onToggleLock: (slot: Slot) => void;
    lockingIds: Set<string>;
}): Column<Slot>[] {
    return [
        { accessorKey: "carrier", header: "Transportista", cell: (slot) => <span className="text-sm">{slot.carrier}</span> },
        { accessorKey: "closeBy", header: "Cierre" },
        { accessorKey: "start", header: "Fecha inicio", cell: (slot) => <span className="text-sm">{formatDateTime(slot.start)}</span> },
        { accessorKey: "end", header: "Fecha fin", cell: (slot) => <span className="text-sm">{formatDateTime(slot.end)}</span> },
        {
            accessorKey: "blocked",
            header: "Bloqueado",
            cell: (slot) => (
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${slot.blocked ? "bg-gray-500 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                >
                    <LockClosedIcon className="h-3.5 w-3.5" />
                    {slot.blocked ? "Sí" : "No"}
                </span>
            ),
        },
        { accessorKey: "deliveries", header: "Entregas", cell: (slot) => pill(slot.deliveries.done, slot.deliveries.total) },
        { accessorKey: "products", header: "Productos", cell: (slot) => pill(slot.products.done, slot.products.total) },
        { accessorKey: "packages", header: "Paquetes", cell: (slot) => pill(slot.packages.done, slot.packages.total) },
        {
            accessorKey: "actions",
            header: "Acciones",
            cell: (slot) => {
                const isLocked = slot.blocked;
                const label = isLocked ? "Abrir" : "Cerrar";
                const Icon = isLocked ? LockOpenIcon : LockClosedIcon;
                const bg = isLocked ? "bg-emerald-500" : "bg-rose-500";
                const isLoading = lockingIds.has(slot.id);

                return (
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleLock(slot);
                        }}
                        disabled={isLoading}
                        className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${bg}`}
                    >
                        <Icon className="mr-1 h-3.5 w-3.5" />
                        {isLoading ? "Procesando" : label}
                    </button>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: (slot) => (
                <span
                    className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold text-white ${slot.status === "Finalizada" ? "bg-gray-500" : "bg-blue-500"
                        }`}
                >
                    {slot.status}
                </span>
            ),
        },
    ];
}

export default function SlotsView() {
    const router = useRouter();
    const [rows, setRows] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [lockingIds, setLockingIds] = useState<string[]>([]);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [commentValue, setCommentValue] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const mapStatus = useCallback((status?: string) => {
        const normalized = String(status || "").trim().toLowerCase();
        if (normalized === "finished") return "Finalizada";
        if (normalized === "inprogress") return "En curso";
        if (normalized === "pending") return "Pendiente";
        return status || "Pendiente";
    }, []);

    const carrierOptions = useMemo(
        () =>
            Array.from(new Set(rows.map((row) => row.carrier).filter(Boolean)))
                .sort((left, right) => left.localeCompare(right))
                .map((value) => ({ label: value, value })),
        [rows]
    );

    const filterConfig = useMemo<FilterConfig<SlotFilters, Slot>[]>(
        () => [
            {
                id: "dateRange",
                label: "Rango de fecha",
                type: "date-range",
                match: (row, value) => {
                    const dateRange = parseDateRange(String(value ?? ""));
                    if (!dateRange) return true;

                    const rowDate = row.start.slice(0, 10);
                    return rowDate >= dateRange.start && rowDate <= dateRange.end;
                },
            },
            {
                id: "location",
                label: "Location ID",
                type: "select",
                options: [
                    { label: "Palermo", value: "Palermo" },
                    { label: "Villa Crespo", value: "Villa Crespo" },
                ],
            },
            {
                id: "carrier",
                label: "Transportista",
                type: "select",
                options: carrierOptions,
                rowValue: (row) => row.carrier,
            },
            {
                id: "method",
                label: "Método de entrega",
                type: "select",
                options: [
                    { label: "Delivery", value: "Delivery" },
                    { label: "Pick-up", value: "Pickup" },
                ],
            },
        ],
        [carrierOptions]
    );

    const { headerFilters, handleFilterChange, applyFilters } =
        useStandardFilters<SlotFilters, Slot>({
            initialFilters,
            configs: filterConfig,
        });

    const fetchSlots = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const response = await fetch(`${TIME_SLOT_URL}?page=1&limit=500`, {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} al listar slots`);
            }

            const payload = (await response.json()) as TimeSlotApiResponse;
            const mapped: Slot[] = (Array.isArray(payload?.data) ? payload.data : []).map((item) => {
                const shippingTotal = Number(item.capacityMaxShippingQtyEffective ?? item.capacityMaxShippingQtyValue ?? 0);
                const productTotal = Number(item.capacityMaxProductQtyEffective ?? item.capacityMaxProductQtyValue ?? 0);
                const packageTotal = Number(item.capacityMaxPackageQtyEffective ?? item.capacityMaxPackageQtyValue ?? 0);

                return {
                    id: String(item.id || item.displayId || ""),
                    carrier: String(item.carrierName || item.carrierId || "-"),
                    closeBy: item.closingTime ? formatDateTime(item.closingTime) : "-",
                    start: String(item.dateStart || ""),
                    end: String(item.dateEnd || ""),
                    blocked: Boolean(item.isLocked),
                    deliveries: {
                        done: Number(item.totalShippings ?? 0),
                        total: Number.isFinite(shippingTotal) && shippingTotal >= 0 ? shippingTotal : 0,
                    },
                    products: {
                        done: Number(item.totalProducts ?? 0),
                        total: Number.isFinite(productTotal) && productTotal >= 0 ? productTotal : 0,
                    },
                    packages: {
                        done: Number(item.totalPackages ?? 0),
                        total: Number.isFinite(packageTotal) && packageTotal >= 0 ? packageTotal : 0,
                    },
                    status: mapStatus(item.status),
                    actions: true,
                };
            });

            setRows(mapped);
            setCurrentPage(1);
        } catch (error) {
            console.error("Error listando slots:", error);
            setRows([]);
            setLoadError(error instanceof Error ? error.message : "Error al cargar slots");
        } finally {
            setLoading(false);
        }
    }, [mapStatus]);

    useEffect(() => {
        void fetchSlots();
    }, [fetchSlots]);

    const performToggleLock = useCallback(
        async (slot: Slot, comment: string) => {
            const operation = slot.blocked ? "unlock" : "lock";

            setLockingIds((previousIds) => (previousIds.includes(slot.id) ? previousIds : [...previousIds, slot.id]));

            try {
                const response = await fetch(`${TIME_SLOT_URL}/${slot.id}/${operation}`, {
                    method: "PATCH",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({ comment }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status} al ${operation} slot: ${errorText}`);
                }

                await fetchSlots();
            } catch (error) {
                console.error(`Error al ${operation} slot:`, error);
            } finally {
                setLockingIds((previousIds) => previousIds.filter((id) => id !== slot.id));
            }
        },
        [fetchSlots]
    );

    const handleToggleLock = useCallback((slot: Slot) => {
        setSelectedSlot(slot);
        setCommentValue("");
        setCommentModalOpen(true);
    }, []);

    const handleConfirmToggleLock = useCallback(async () => {
        if (!selectedSlot) return;

        const trimmedComment = commentValue.trim();
        if (!trimmedComment) return;

        await performToggleLock(selectedSlot, trimmedComment);
        setCommentModalOpen(false);
        setSelectedSlot(null);
        setCommentValue("");
    }, [commentValue, performToggleLock, selectedSlot]);

    const handleCloseCommentModal = useCallback(() => {
        setCommentModalOpen(false);
        setSelectedSlot(null);
        setCommentValue("");
    }, []);

    const lockingIdsSet = useMemo(() => new Set(lockingIds), [lockingIds]);
    const columns = useMemo(
        () =>
            getColumns({
                onToggleLock: handleToggleLock,
                lockingIds: lockingIdsSet,
            }),
        [handleToggleLock, lockingIdsSet]
    );

    const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
    const totalRecords = filteredRows.length;
    const pageSlice = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filteredRows.slice(start, start + PER_PAGE);
    }, [currentPage, filteredRows]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
    }, [currentPage, totalRecords]);

    const handleExport = useCallback(() => {
        const headers = [
            "Transportista",
            "Cierre",
            "Inicio",
            "Fin",
            "Bloqueado",
            "Entregas",
            "Productos",
            "Paquetes",
            "Estado",
        ];

        const data = filteredRows.map((slot) => [
            slot.carrier,
            slot.closeBy,
            formatDateTime(slot.start),
            formatDateTime(slot.end),
            slot.blocked ? "Sí" : "No",
            `${slot.deliveries.done}/${slot.deliveries.total}`,
            `${slot.products.done}/${slot.products.total}`,
            `${slot.packages.done}/${slot.packages.total}`,
            slot.status,
        ]);

        exportToCsv("slots.csv", [headers, ...data]);
    }, [filteredRows]);

    const headerActions: Action[] = [
        {
            label: "Crear slots +1d",
            variant: "success",
            onClick: () => { },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
        {
            label: "Nuevo",
            variant: "success",
            onClick: () => router.push("/delivery/transportistas/slots/nuevo"),
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
                void fetchSlots();
            },
            icon: <ArrowPathIcon className="h-5 w-5" />,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title="Slots de entrega"
                description=""
                filters={headerFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    handleFilterChange(id, value);
                }}
                action={headerActions}
                filterTitle
            />

            <div className="flex-1 p-6">
                {loadError ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                        {loadError}
                    </div>
                ) : null}

                {loading ? (
                    <div className="mb-4 rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                        Cargando slots...
                    </div>
                ) : null}

                {!loading && rows.length === 0 ? (
                    <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                        Aún no hay slots registrados.
                    </div>
                ) : null}

                {!loading && rows.length > 0 && filteredRows.length === 0 ? (
                    <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
                        No hay slots que coincidan con los filtros seleccionados.
                    </div>
                ) : null}

                {!loading && filteredRows.length > 0 ? (
                    <>
                        <div className="overflow-hidden rounded-xl shadow-sm">
                            <DataTable
                                data={pageSlice}
                                columns={columns}
                                statusKey="status"
                                dataType="DeliverySlot"
                                rowBgClass="bg-white"
                                rowGap={8}
                                rowPaddingY={20}
                                onRowClick={(row: Slot) => router.push(`/delivery/transportistas/slots/${row.id}`)}
                            />
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalRecords={totalRecords}
                            pageSize={PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </>
                ) : null}
            </div>

            <SimpleModal
                open={commentModalOpen}
                onClose={handleCloseCommentModal}
                title={selectedSlot?.blocked ? "Abrir slot" : "Cerrar slot"}
                maxWidth="sm:max-w-lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700">
                        Ingresa un comentario para {selectedSlot?.blocked ? "abrir" : "cerrar"} el slot.
                    </p>
                    <textarea
                        value={commentValue}
                        onChange={(event) => setCommentValue(event.target.value)}
                        rows={4}
                        placeholder="Escribe un comentario"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseCommentModal}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmToggleLock}
                            disabled={!commentValue.trim() || (selectedSlot ? lockingIdsSet.has(selectedSlot.id) : false)}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </SimpleModal>
        </div>
    );
}
