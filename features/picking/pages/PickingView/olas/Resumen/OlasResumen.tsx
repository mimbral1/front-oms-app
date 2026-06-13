"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    XCircleIcon,
    ClipboardDocumentListIcon,
    MapPinIcon,
    CalendarDaysIcon,
    CubeIcon,
    ShoppingCartIcon,
    LockClosedIcon,
    ArrowPathIcon,
    WindowIcon,
    CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { useFetchWithAuthQA } from "@/lib/http/client";
import Card from "@/components/ui/card/Card";

/* ─── helpers ─── */
const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-CL", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
};

const statusVariantMap: Record<string, "success" | "warning" | "info" | "default"> = {
    finished: "success",
    active: "info",
    pending: "warning",
};

const statusLabelMap: Record<string, string> = {
    finished: "Finalizada",
    active: "En curso",
    pending: "Pendiente",
};

const statusColorMap: Record<string, string> = {
    finished: "bg-green-100 text-green-700",
    active: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
};

/* ─── tipos ─── */
interface ApiWaveAssignment {
    id: string;
    assignedAt: string;
    releasedAt: string | null;
    releaseReason: string | null;
    statusCode: string;
}

interface ApiWaveOrderItem {
    id: string;
    omsOrderItemId: string;
    originalOrderItemId: string;
    skuId: string;
    ean: string;
    requestedQty: number;
    sessionItemId: string | null;
    itemAssignmentStatus: string;
    status: string;
    productName: string;
    imageUrl: string;
    shipmentItemId: string;
    zoneId: string | null;
    waveAssignment: ApiWaveAssignment | null;
}

interface ApiWaveOrder {
    id: string;
    omsOrderId: string;
    commerceId: string;
    shipmentCode: string;
    items: ApiWaveOrderItem[];
    assignmentStatus: string;
    totals: {
        items: number;
        assignedItems: number;
        pendingItems: number;
    };
}

interface ApiWaveResponse {
    main: {
        waveDetail: {
            id: string;
            pickingPoint: { id: string; name: string; label: string } | null;
            windowInstanceId: string | null;
            dateStart: string;
            dateEnd: string;
            isBlocked: boolean;
            status: string;
        };
        users: {
            createdBy: { name?: string; email?: string } | null;
            updatedBy: { name?: string; email?: string } | null;
        };
        capacity: {
            orders: { current: number; max: number; percentage: number };
            items: { current: number; max: number; percentage: number };
        };
    };
    orders: ApiWaveOrder[];
}

interface ApiWindowSchemaResponse {
    data?: {
        id: string;
        name: string;
        timeZone: string;
        status: string;
        dateCreated: string;
        dateModified: string;
        userCreated: number;
        userModified: number | null;
    };
}

interface OrderSummary {
    totalOrders: number;
    totalItems: number;
    assignedItems: number;
    pendingItems: number;
}

interface OlaResumenState {
    waveDetailId: string;
    pickingPointName: string;
    windowInstanceId: string;
    windowName: string;
    fechaInicio: string;
    fechaFin: string;
    pedidosMax: string;
    itemsMax: string;
    pedidos: string;
    items: string;
    pedidosPct: number;
    itemsPct: number;
    status: string;
    statusRaw: string;
    bloqueada: boolean;
    creador: { nombre: string; email: string } | null;
    modificador: { nombre: string; email: string } | null;
    createdAt: string;
    finishedAt: string;
    orderSummary: OrderSummary;
}

export default function OlasResumenView() {
    const router = useRouter();
    const params = useParams();
    const olaId = params?.id as string;
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [data, setData] = useState<OlaResumenState | null>(null);
    const [loading, setLoading] = useState(true);

    /* ─── carga ─── */
    const load = useCallback(async () => {
        if (!olaId) return;
        setLoading(true);
        try {
            const json: ApiWaveResponse = await fetchWithAuthQA(
                `picking-service/waves/${olaId}`
            );

            const { waveDetail, users, capacity } = json.main;
            const orders = json.orders ?? [];

            let windowName = "—";
            if (waveDetail.windowInstanceId) {
                try {
                    const windowJson: ApiWindowSchemaResponse = await fetchWithAuthQA(
                        `picking-service/windows/schemas/${waveDetail.windowInstanceId}`
                    );
                    windowName = windowJson?.data?.name ?? "—";
                } catch (windowErr) {
                    console.error("Error al cargar nombre de ventana:", windowErr);
                }
            }

            const orderSummary: OrderSummary = orders.reduce(
                (acc, o) => ({
                    totalOrders: acc.totalOrders + 1,
                    totalItems: acc.totalItems + (o.totals?.items ?? 0),
                    assignedItems: acc.assignedItems + (o.totals?.assignedItems ?? 0),
                    pendingItems: acc.pendingItems + (o.totals?.pendingItems ?? 0),
                }),
                { totalOrders: 0, totalItems: 0, assignedItems: 0, pendingItems: 0 }
            );

            setData({
                waveDetailId: waveDetail.id,
                pickingPointName: waveDetail.pickingPoint?.name ?? "—",
                windowInstanceId: waveDetail.windowInstanceId ?? "—",
                windowName,
                fechaInicio: waveDetail.dateStart,
                fechaFin: waveDetail.dateEnd,
                pedidosMax: String(capacity.orders.max),
                itemsMax: String(capacity.items.max),
                pedidos: String(capacity.orders.current),
                items: String(capacity.items.current),
                pedidosPct: capacity.orders.percentage,
                itemsPct: capacity.items.percentage,
                status: statusLabelMap[waveDetail.status] ?? waveDetail.status,
                statusRaw: waveDetail.status,
                bloqueada: waveDetail.isBlocked,
                creador: users.createdBy
                    ? { nombre: users.createdBy.name ?? "—", email: users.createdBy.email ?? "—" }
                    : null,
                modificador: users.updatedBy
                    ? { nombre: users.updatedBy.name ?? "—", email: users.updatedBy.email ?? "—" }
                    : null,
                createdAt: waveDetail.dateStart,
                finishedAt: waveDetail.dateEnd,
                orderSummary,
            });
        } catch (err) {
            console.error("Error al cargar ola:", err);
        } finally {
            setLoading(false);
        }
    }, [olaId, fetchWithAuthQA]);

    useEffect(() => { load(); }, [load]);

    /* ─── header ─── */
    const actions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/olas/listar-olas"),
            },
        ],
        [router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Olas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        {data?.waveDetailId || olaId}
                    </div>
                </div>
            ),
            action: actions,
            status: data
                ? {
                    text: data.status,
                    variant: statusVariantMap[data.statusRaw] ?? "default",
                }
                : undefined,
        } as PageHeaderProps),
        [actions, data]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 text-gray-500">
                <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                Cargando ola...
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300" />
                <p className="text-lg text-gray-500">Ola no encontrada.</p>
            </div>
        );
    }

    const pedidosPct = data.pedidosPct;
    const itemsPct = data.itemsPct;

    return (
        <div className="min-h-screen flex flex-col bg-page-bg pb-6">
            <div className="flex-1 grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* ─── IZQUIERDA (4 cols) ─── */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Detalle principal */}
                    <Card
                        title="DETALLE DE LA OLA"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col"
                    >
                        <div className="space-y-3 text-gray-700">
                            {[
                                {
                                    label: "Picking Point",
                                    icon: <MapPinIcon className="h-4 w-4 text-blue-500" />,
                                    value: data.pickingPointName,
                                },
                                {
                                    label: "Ventana",
                                    icon: <WindowIcon className="h-4 w-4 text-purple-500" />,
                                    value: data.windowName,
                                },
                                {
                                    label: "Fecha inicio",
                                    icon: <CalendarDaysIcon className="h-4 w-4 text-green-500" />,
                                    value: fmt(data.fechaInicio),
                                },
                                {
                                    label: "Fecha fin",
                                    icon: <CalendarDaysIcon className="h-4 w-4 text-red-400" />,
                                    value: fmt(data.fechaFin),
                                },
                                {
                                    label: "Bloqueada",
                                    icon: <LockClosedIcon className="h-4 w-4 text-gray-500" />,
                                    value: data.bloqueada ? "Sí" : "No",
                                    badge: true,
                                    badgeClass: data.bloqueada
                                        ? "bg-red-100 text-red-700"
                                        : "bg-green-100 text-green-700",
                                },
                                {
                                    label: "Estado",
                                    icon: null,
                                    value: data.status,
                                    badge: true,
                                    badgeClass: statusColorMap[data.statusRaw] ?? "bg-gray-100 text-gray-700",
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="text-gray-900 font-medium text-sm flex-shrink-0 w-full sm:w-1/3 flex items-center gap-1.5">
                                        {item.icon}
                                        {item.label}:
                                    </span>
                                    <span className="text-gray-600 font-medium flex-1 break-words w-full sm:w-2/3">
                                        {"badge" in item && item.badge ? (
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.badgeClass}`}>
                                                {item.value}
                                            </span>
                                        ) : (
                                            item.value
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Capacidad: Pedidos e Items con barras de progreso */}
                    <Card
                        title="CAPACIDAD"
                        icon={CubeIcon}
                        hasTitleDivider
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Pedidos */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <ShoppingCartIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="text-sm font-semibold text-gray-800">Pedidos</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-gray-900">{data.pedidos}</span>
                                    <span className="text-sm text-gray-500 mb-1">/ {data.pedidosMax} máx.</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-indigo-500 h-2 rounded-full transition-all"
                                        style={{ width: `${pedidosPct}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400">{pedidosPct}% utilizado</span>
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <CubeIcon className="h-5 w-5 text-teal-500" />
                                    <span className="text-sm font-semibold text-gray-800">Items</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-gray-900">{data.items}</span>
                                    <span className="text-sm text-gray-500 mb-1">/ {data.itemsMax} máx.</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-teal-500 h-2 rounded-full transition-all"
                                        style={{ width: `${itemsPct}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400">{itemsPct}% utilizado</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ─── DERECHA (3 cols) ─── */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Resumen rápido */}
                    <Card
                        title="RESUMEN"
                        icon={ClipboardDocumentListIcon}
                        hasTitleDivider
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <StatTile label="Pedidos" value={data.pedidos} color="indigo" />
                            <StatTile label="Items" value={data.items} color="teal" />
                            <StatTile label="Ped. máx" value={data.pedidosMax} color="gray" />
                            <StatTile label="Items máx" value={data.itemsMax} color="gray" />
                        </div>
                    </Card>

                    {/* Resumen de asignacion de ordenes */}
                    <Card
                        title="ASIGNACIÓN DE PEDIDOS"
                        icon={CheckBadgeIcon}
                        hasTitleDivider
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <StatTile
                                label="Pedidos en ola"
                                value={String(data.orderSummary.totalOrders)}
                                color="indigo"
                            />
                            <StatTile
                                label="Total items"
                                value={String(data.orderSummary.totalItems)}
                                color="teal"
                            />
                            <StatTile
                                label="Items asignados"
                                value={String(data.orderSummary.assignedItems)}
                                color="green"
                            />
                            <StatTile
                                label="Items pendientes"
                                value={String(data.orderSummary.pendingItems)}
                                color="amber"
                            />
                        </div>

                        {data.orderSummary.totalItems > 0 && (
                            <div className="mt-4 space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progreso de asignación</span>
                                    <span>
                                        {data.orderSummary.totalItems > 0
                                            ? Math.round((data.orderSummary.assignedItems / data.orderSummary.totalItems) * 100)
                                            : 0
                                        }%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{
                                            width: `${data.orderSummary.totalItems > 0
                                                ? Math.round((data.orderSummary.assignedItems / data.orderSummary.totalItems) * 100)
                                                : 0
                                                }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* ─── Stat tile helper ─── */
function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
    const bgMap: Record<string, string> = {
        indigo: "bg-indigo-50",
        teal: "bg-teal-50",
        gray: "bg-gray-50",
        green: "bg-green-50",
        amber: "bg-amber-50",
    };
    const textMap: Record<string, string> = {
        indigo: "text-indigo-600",
        teal: "text-teal-600",
        gray: "text-gray-600",
        green: "text-green-600",
        amber: "text-amber-600",
    };
    return (
        <div className={`${bgMap[color] ?? "bg-gray-50"} rounded-lg p-3 text-center`}>
            <div className={`text-2xl font-bold ${textMap[color] ?? "text-gray-600"}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        </div>
    );
}
