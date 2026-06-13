// app/views/Inventario/Control/Detail/tabs/ControlInvItems.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import {
    CheckCircleIcon,
    XMarkIcon,
    MapPinIcon,
    ChevronRightIcon,
    ArrowDownIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { CopyableText } from "@/components/ui/copyable-text";
import { BarcodeIcon } from "lucide-react";
import Select from "@/components/ui/select";
import { ActionButton } from "@/components/ui/button/action-button";
import { toast } from "react-hot-toast";
import { BASE_WAREHOUSES, CATALOG_PRODUCTS_API } from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Tipos + mocks (segun referencia visual del tab "Items")
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type ItemRow = {
    id: string;
    image: string;
    title: string;
    sku: string;      // # 21198916
    barcode: string;  // 2119891600324
    position: string; // 1-001-2
    sysQty: number;   // systemQuantity
    countQty: number; // countedQuantity
    diffQty: number;  // differenceQuantity
    status: "Pendiente" | "Confirmado" | "Rechazado";
};

type ApiStockControlDetail = {
    id: string;
    warehouseId: string;
    displayId: string;
    assigneeId: string | null;
    reviewerId: string | null;
    items: Array<{
        skuReferenceId?: string | null;
        systemQuantity?: number | null;
        countedQuantity?: number | null;
        differenceQuantity?: number | null;
        positionKey?: string | null;
        ean?: string | null;
    }>;
    skuCount: number | null;
    itemCount: number | null;
    positionCount: number | null;
    status: string;
    dateCreated: string;
    dateModified: string;
    userCreated: string | null;
    userModified: string | null;
};

type ApiCatalogProduct = {
    Image: string | null;
    Name: string | null;
    SKU: string | null;
    Eans: string | null;
};

type ApiStockMovementMotive = {
    id: string;
    name: string;
    code: string;
    status: string;
};

const STOCK_CONTROL_URL = `${BASE_WAREHOUSES}/stock-control`;
const STOCK_MOVEMENT_MOTIVE_URL = `${BASE_WAREHOUSES}/stock-movement-motive`;
const STOCK_CONTROL_CONFIRM_URL = `${BASE_WAREHOUSES}/stock-control`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
});

const PLACEHOLDER_IMG = "https://tumayorferretero.net/22457-large_default/producto-generico.jpg";
type HeaderStatusVariant = NonNullable<PageHeaderProps["status"]>["variant"];

type ControlEstado = "Pendiente de confirmación" | "En progreso" | "Completado" | "Rechazado";

const mapControlEstado = (status?: string): ControlEstado => {
    const s = String(status || "").toLowerCase();
    if (s === "pendingconfirmation" || s === "pending_confirmation") return "Pendiente de confirmación";
    if (s === "inprogress" || s === "in_progress" || s === "started") return "En progreso";
    if (s === "confirmed" || s === "completed" || s === "done") return "Completado";
    if (s === "rejected") return "Rechazado";
    return "Pendiente de confirmación";
};

const mapItemEstado = (status?: string): ItemRow["status"] => {
    const s = String(status || "").toLowerCase();
    if (s === "confirmed" || s === "completed" || s === "done") return "Confirmado";
    if (s === "rejected") return "Rechazado";
    return "Pendiente";
};

const getControlStatusVariant = (status: ControlEstado): HeaderStatusVariant => {
    if (status === "Completado") return "success";
    if (status === "Rechazado") return "error";
    if (status === "En progreso") return "processing";
    return "warning";
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Helpers UI
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const qtyPill = (text: string | number) => (
    <span className="inline-flex h-8 min-w-[42px] items-center justify-center rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">
        {text}
    </span>
);

const itemStatusColor: Record<ItemRow["status"], string> = {
    Pendiente: "bg-amber-500",
    Confirmado: "bg-green-600",
    Rechazado: "bg-rose-600",
};

const statusPill = (s: ItemRow["status"]) => (
    <span className={`inline-flex min-w-[104px] items-center justify-center rounded-full px-4 py-1 text-xs font-semibold text-white ${itemStatusColor[s]}`}>
        {s}
    </span>
);

const discPill = (delta: number) => (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
        <ArrowDownIcon className="h-4 w-4 text-rose-500" />
        {delta}
    </span>
);

/* Paginacion ventana de 3 (misma que otros tabs) */
const PER_PAGE = 10;

export default function ControlInvItems() {
    const { id } = useParams(); // id del control
    const router = useRouter();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [loading, setLoading] = useState(true);
    const [estado, setEstado] = useState<ControlEstado>("Pendiente de confirmación" as ControlEstado);
    const [allItems, setAllItems] = useState<ItemRow[]>([]);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [motives, setMotives] = useState<ApiStockMovementMotive[]>([]);
    const [motivesLoading, setMotivesLoading] = useState(false);
    const [selectedMotiveId, setSelectedMotiveId] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);
    const [rejectSubmitting, setRejectSubmitting] = useState(false);
    const [confirmSubmitting, setConfirmSubmitting] = useState(false);

    const loadItems = useCallback(async () => {
        setLoading(true);
        try {
            if (!recordId) {
                setAllItems([]);
                return;
            }

            const detailRes = await fetch(`${STOCK_CONTROL_URL}/${encodeURIComponent(recordId)}`, {
                method: "GET",
                headers: JANIS_HEADERS,
            });

            let detail: ApiStockControlDetail | null = null;
            if (detailRes.ok) {
                detail = (await detailRes.json()) as ApiStockControlDetail;
            } else {
                const listRes = await fetch(STOCK_CONTROL_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                });
                if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
                const list = (await listRes.json()) as ApiStockControlDetail[];
                detail = list.find((entry) => entry.id === recordId || entry.displayId === recordId) ?? null;
            }

            if (!detail) throw new Error("Control de inventario no encontrado");
            const detailData = detail;

            const skuList = Array.from(
                new Set((detailData.items ?? []).map((item) => item.skuReferenceId).filter(Boolean) as string[])
            );

            const productBySku = new Map<string, ApiCatalogProduct>();
            await Promise.all(
                skuList.map(async (sku) => {
                    try {
                        const product = await fetchWithAuthQA<ApiCatalogProduct>(
                            `${CATALOG_PRODUCTS_API}/${encodeURIComponent(sku)}`
                        );
                        productBySku.set(sku, product);
                    } catch {
                        // Si falla un SKU, mantenemos fallback visual.
                    }
                })
            );

            const mapped: ItemRow[] = (detailData.items ?? []).map((item, index) => {
                const sku = item.skuReferenceId ?? "-";
                const product = productBySku.get(sku);

                return {
                    id: `${detailData.id}-${index}`,
                    image: product?.Image || PLACEHOLDER_IMG,
                    title: product?.Name || `SKU ${sku}`,
                    sku,
                    barcode: item.ean ?? product?.Eans ?? "-",
                    position: item.positionKey ?? "-",
                    sysQty: item.systemQuantity ?? 0,
                    countQty: item.countedQuantity ?? 0,
                    diffQty: item.differenceQuantity ?? 0,
                    status: mapItemEstado(detailData.status),
                };
            });

            setAllItems(mapped);
            setEstado(mapControlEstado(detailData.status));
        } catch (error) {
            console.error("Error al cargar items de control:", error);
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    }, [recordId, fetchWithAuthQA]);

    useEffect(() => {
        void loadItems();
    }, [loadItems]);

    const rejectMotiveOptions = useMemo(
        () => motives.map((motive) => ({ value: motive.id, label: motive.name })),
        [motives]
    );

    const openRejectModal = async () => {
        if (!recordId) {
            toast.error("No se encontró el id del control.");
            return;
        }

        setIsRejectModalOpen(true);
        setActionError(null);

        if (motives.length > 0) return;

        setMotivesLoading(true);
        try {
            const response = await fetch(STOCK_MOVEMENT_MOTIVE_URL, {
                method: "GET",
                headers: JANIS_HEADERS,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const payload = (await response.json()) as ApiStockMovementMotive[];
            const activeMotives = (payload || []).filter((motive) => String(motive.status).toLowerCase() === "active");
            const finalMotives = activeMotives.length > 0 ? activeMotives : payload || [];

            setMotives(finalMotives);
            if (finalMotives.length > 0) {
                setSelectedMotiveId(finalMotives[0].id);
            }
        } catch (error: any) {
            setActionError(error?.message || "No se pudieron cargar los motivos.");
        } finally {
            setMotivesLoading(false);
        }
    };

    const closeRejectModal = () => {
        setIsRejectModalOpen(false);
        setActionError(null);
    };

    const handleRejectMotiveChange = (value: string) => {
        setSelectedMotiveId(value);
    };

    const handleRejectControl = async () => {
        if (!recordId) {
            setActionError("No se encontró el id del control.");
            return;
        }
        if (!selectedMotiveId) {
            setActionError("Debes seleccionar un motivo.");
            return;
        }

        setRejectSubmitting(true);
        setActionError(null);

        try {
            const selected = motives.find((motive) => motive.id === selectedMotiveId);
            const response = await fetch(`${STOCK_CONTROL_URL}/${encodeURIComponent(recordId)}/reject`, {
                method: "POST",
                headers: {
                    ...JANIS_HEADERS,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    motiveId: selectedMotiveId,
                    comment: selected?.name || "",
                }),
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const errorPayload = await response.json();
                    message = String(errorPayload?.message || errorPayload?.error || errorPayload?.detail || "").trim() || message;
                } catch {
                    // keep status-based message
                }
                throw new Error(message);
            }

            await loadItems();
            closeRejectModal();
            toast.success("Control de stock rechazado correctamente.");
        } catch (error: any) {
            const message = error?.message || "No se pudo rechazar el control de stock.";
            setActionError(message);
            toast.error(message);
        } finally {
            setRejectSubmitting(false);
        }
    };

    const handleConfirmControl = async () => {
        if (!recordId) {
            toast.error("No se encontró el id del control.");
            return;
        }

        setConfirmSubmitting(true);
        setActionError(null);

        try {
            const response = await fetch(`${STOCK_CONTROL_CONFIRM_URL}/${encodeURIComponent(recordId)}/confirm`, {
                method: "POST",
                headers: JANIS_HEADERS,
            });

            if (!response.ok) {
                let message = `HTTP ${response.status}`;
                try {
                    const errorPayload = await response.json();
                    message = String(errorPayload?.message || errorPayload?.error || errorPayload?.detail || "").trim() || message;
                } catch {
                    // keep status-based message
                }
                throw new Error(message);
            }

            await loadItems();
            toast.success("Control de stock confirmado correctamente.");
        } catch (error: any) {
            const message = error?.message || "No se pudo confirmar el control de stock.";
            toast.error(message);
        } finally {
            setConfirmSubmitting(false);
        }
    };

    // PageHeader
    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/almacen/inventario/control-de-inventario"),
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Control de inventario</div>
                    <div className="text-2xl font-semibold text-gray-900">{id}</div>
                </div>
            ),
            action: headerActions,
            status: { text: estado, variant: getControlStatusVariant(estado) },
        } as PageHeaderProps),
        [id, headerActions, estado]
    );


    /* ---------- Paginación ---------- */
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
    const [page, setPage] = useState(1);
    const total = allItems.length;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const safePage = clamp(page, 1, totalPages);
    const startIdx = (safePage - 1) * PER_PAGE;
    const endIdx = Math.min(startIdx + PER_PAGE, total);
    const shown = allItems.slice(startIdx, endIdx);

    /* â”€â”€ Render â”€â”€ */
    return (
        <div className="flex-1 bg-[#e8eaf5]">
            {/* Encabezado: acciones a la derecha + headers debajo */}
            {/* Acciones (arriba a la derecha) */}
            <div className="flex items-center justify-end gap-2 mb-3">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={openRejectModal}
                    disabled={confirmSubmitting || rejectSubmitting || !recordId}
                >
                    <XMarkIcon className="h-5 w-5" />
                    Rechazar control de stock
                </button>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleConfirmControl}
                    disabled={confirmSubmitting || rejectSubmitting || !recordId}
                >
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                    {confirmSubmitting ? "Confirmando..." : "Confirmar control de stock"}
                </button>
            </div>

            <div className="rounded-xl bg-[#e8eaf5] px-4 pt-2 pb-3">
                {/* Headers de columnas */}
                <div className="grid w-full grid-cols-[120px_1fr_140px_220px_160px_120px_120px] items-center gap-4 text-xs font-semibold text-gray-500">
                    <span>Imagen</span>
                    <span>Item</span>
                    <span>Posición</span>
                    <span>Cantidad</span>
                    <span>Discrepancia</span>
                    <span>Review</span>
                    <span>Estado</span>
                </div>
            </div>


            {/* Lista de ítems */}
            <div className="mt-3 space-y-3">
                {loading && (
                    <div className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
                        Cargando ítems...
                    </div>
                )}

                {!loading && shown.length === 0 && (
                    <div className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
                        No hay ítems para este control.
                    </div>
                )}

                {shown.map((row) => {
                    const delta = row.diffQty;
                    return (
                        <div key={row.id} className="rounded-xl bg-[#f6f7fb] shadow-sm ring-1 ring-[#d7dbe7]">
                            <div className="flex">
                                {/* línea lateral */}
                                <div className="w-1.5 rounded-l-xl bg-[#8b8f97]" />
                                <div className="w-full px-4 py-4">
                                    <div className="grid grid-cols-[120px_1fr_140px_220px_160px_120px_120px] items-center gap-4">
                                        {/* Imagen */}
                                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                            <img src={row.image} alt={row.title} className="h-full w-full object-contain" />
                                        </div>

                                        {/* Ítem (nombre + sku + barcode) */}
                                        <div className="min-w-0">
                                            <div className="max-w-[360px] text-sm font-medium leading-5 text-gray-700">{row.title}</div>
                                            <div className="mt-2 flex flex-col gap-1 text-xs">
                                                <span className="text-gray-500">
                                                    <span className="text-gray-400">#</span>{" "}
                                                    <CopyableText text={row.sku}>{row.sku}</CopyableText>
                                                </span>
                                                <span className="inline-flex items-center gap-2 text-gray-500">
                                                    <BarcodeIcon className="h-4 w-4 text-gray-700" />
                                                    <CopyableText text={row.barcode}>{row.barcode}</CopyableText>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Posición */}
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                            <MapPinIcon className="h-5 w-5 text-gray-500" />
                                            {row.position}
                                        </div>

                                        {/* Cantidad: sys > count */}
                                        <div className="flex items-center gap-2">
                                            {qtyPill(row.sysQty)}
                                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                            {qtyPill(row.countQty)}
                                        </div>

                                        {/* Discrepancia */}
                                        <div>{discPill(delta)}</div>

                                        {/* Review (placeholder) */}
                                        <div className="text-sm text-gray-300">—</div>

                                        {/* Estado */}
                                        <div className="flex justify-end">{statusPill(row.status)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Pagination
                currentPage={page}
                totalRecords={total}
                pageSize={PER_PAGE}
                onPageChange={setPage}
            />

            <Transition appear show={isRejectModalOpen} as={React.Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeRejectModal}>
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/35" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={React.Fragment}
                                enter="ease-out duration-200"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-150"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                                    <div className="mb-4 flex items-start justify-between">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                                            Rechazar control de stock
                                        </Dialog.Title>
                                        <button
                                            type="button"
                                            className="text-gray-400 hover:text-gray-600"
                                            onClick={closeRejectModal}
                                            disabled={rejectSubmitting}
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {motivesLoading ? (
                                        <p className="text-sm text-gray-600">Cargando motivos...</p>
                                    ) : (
                                        <div className="space-y-4">
                                            <Select
                                                id="reject-motive"
                                                label="Motivo"
                                                placeholder="Selecciona un motivo"
                                                options={rejectMotiveOptions}
                                                value={selectedMotiveId}
                                                onValueChange={handleRejectMotiveChange}
                                            />
                                        </div>
                                    )}

                                    {actionError && (
                                        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                            {actionError}
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end gap-2">
                                        <ActionButton
                                            variant="secondary"
                                            onClick={closeRejectModal}
                                            disabled={rejectSubmitting}
                                        >
                                            Cancelar
                                        </ActionButton>
                                        <ActionButton
                                            variant="danger"
                                            onClick={handleRejectControl}
                                            disabled={motivesLoading || !selectedMotiveId}
                                            loading={rejectSubmitting}
                                        >
                                            Rechazar control
                                        </ActionButton>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
