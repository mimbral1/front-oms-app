"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { type Action } from "@/components/layout/page-header";
import { useFetchWithAuthQA } from "@/lib/http/client";
import {
    ArrowPathIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { RoundsExpandableList, type PedidoRound } from "@/features/pedidos/components/detalles-pedido/RoundsExpandableList";
import { OMS_ORDERS_API } from "@/lib/http/endpoints";

type SessionSummaryResponse = {
    data?: {
        orders?: Array<{
            omsOrderId?: number;
            shipmentCode?: string;
            customer?: {
                name?: string;
                email?: string;
                phone?: string;
            };
            delivery?: {
                type?: string;
                address?: string;
                company?: string;
            };
            totals?: {
                subtotal?: number;
                total?: number;
                items?: number;
            };
            picking?: {
                products?: number;
                items?: number;
            };
            status?: string;
            assigned?: {
                estado?: string;
                pickerNombre?: string | null;
            };
            dateCreated?: string | null;
        }>;
    };
};

type IssueSummaryResponse = {
    resumen?: {
        totales?: {
            items?: {
                original?: number | null;
                total?: number | null;
            };
            envios?: {
                original?: number | null;
                total?: number | null;
            };
            subtotal?: number | null;
            total?: number | null;
        };
    };
    items?: {
        originales?: {
            grupos?: Array<{
                items?: Array<{
                    producto?: string;
                    itemcode?: string;
                    cantidad?: number;
                    precioUnitario?: number;
                    totalItem?: number;
                    imagen?: string | null;
                    eans?: string | null;
                }>;
            }>;
        };
    };
};

type OrderSummaryInfo = {
    subtotal: number | null;
    total: number | null;
    pickingProducts: number | null;
    pickingItems: number | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    deliveryType: string | null;
    deliveryAddress: string | null;
    deliveryCompany: string | null;
    status: string | null;
};

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

const toStatusEs = (status?: string | null) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "picked") return "Pickeado";
    if (normalized === "finished") return "Finalizada";
    if (normalized === "started") return "Iniciada";
    if (normalized === "pending") return "Pendiente";
    if (normalized === "created") return "Creada";
    if (normalized === "assigned") return "Asignada";
    if (normalized === "canceled") return "Cancelada";
    if (normalized === "rejected") return "Rechazada";
    return normalized ? normalized : "-";
};

export default function PedidosRondas() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const rondaId = params?.id;
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const [rounds, setRounds] = useState<PedidoRound[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        if (!rondaId) {
            setRounds([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetchWithAuthQA<SessionSummaryResponse>(
                `picking-service/sessions/${encodeURIComponent(rondaId)}/summary`,
                { method: "GET" }
            );

            const summaryByShipmentCode = new Map<string, OrderSummaryInfo>();
            (response?.data?.orders || []).forEach((order) => {
                const shipmentCode = String(order.shipmentCode || "").trim();
                if (!shipmentCode) return;

                const subtotalNum = Number(order.totals?.subtotal ?? 0);
                const totalNum = Number(order.totals?.total ?? order.totals?.items ?? 0);
                const productsNum = Number(order.picking?.products ?? 0);
                const itemsNum = Number(order.picking?.items ?? 0);

                summaryByShipmentCode.set(shipmentCode, {
                    subtotal: Number.isFinite(subtotalNum) ? subtotalNum : null,
                    total: Number.isFinite(totalNum) ? totalNum : null,
                    pickingProducts: Number.isFinite(productsNum) ? productsNum : null,
                    pickingItems: Number.isFinite(itemsNum) ? itemsNum : null,
                    customerName: order.customer?.name || null,
                    customerEmail: order.customer?.email || null,
                    customerPhone: order.customer?.phone || null,
                    deliveryType: order.delivery?.type || null,
                    deliveryAddress: order.delivery?.address || null,
                    deliveryCompany: order.delivery?.company || null,
                    status: order.status || null,
                });
            });

            const orderIds: string[] = Array.from(
                new Set(
                    (response?.data?.orders || [])
                        .map((order) => String(order.omsOrderId || "").trim())
                        .filter((id) => id.length > 0)
                )
            );

            const issueSummaryByOrderId = new Map<
                string,
                {
                    subtotal: number | null;
                    shippingTotal: number | null;
                    total: number | null;
                    resultados: PedidoRound["resultados"];
                }
            >();

            await Promise.all(
                orderIds.map(async (orderId) => {
                    try {
                        const issueSummary = await fetchWithAuthQA<IssueSummaryResponse>(
                            `${OMS_ORDERS_API}/${encodeURIComponent(orderId)}/issue-summary`,
                            {
                                method: "GET",
                                headers: {
                                    Accept: "application/json",
                                    "ngrok-skip-browser-warning": "true",
                                },
                            }
                        );

                        const groupedItems = issueSummary?.items?.originales?.grupos || [];
                        const flatItems = groupedItems.flatMap((group) => group.items || []);

                        const resultados: PedidoRound["resultados"] = flatItems.map((item, idx) => {
                            const qty = Number(item.cantidad ?? 0);
                            const precioUnitario = Number(item.precioUnitario ?? 0);
                            const totalItem = Number(item.totalItem ?? (precioUnitario * qty));
                            return {
                                sessionItemId: `${orderId}-${idx}`,
                                nombreProducto: item.producto || "-",
                                imagen: item.imagen || undefined,
                                sku: item.itemcode || undefined,
                                ean: item.eans || undefined,
                                cantidad: qty,
                                precioUnitario,
                                totalItem,
                                cantidadSolicitada: qty,
                                cantidadPickeada: 0,
                                faltante: qty,
                                estado: "Pendiente",
                            };
                        });

                        const subtotalNum = Number(
                            issueSummary?.resumen?.totales?.items?.total
                            ?? issueSummary?.resumen?.totales?.items?.original
                            ?? 0
                        );
                        const shippingTotalNum = Number(
                            issueSummary?.resumen?.totales?.envios?.total
                            ?? issueSummary?.resumen?.totales?.envios?.original
                            ?? 0
                        );
                        const totalNum = Number(issueSummary?.resumen?.totales?.total ?? 0);

                        issueSummaryByOrderId.set(orderId, {
                            subtotal: Number.isFinite(subtotalNum) ? subtotalNum : null,
                            shippingTotal: Number.isFinite(shippingTotalNum) ? shippingTotalNum : null,
                            total: Number.isFinite(totalNum) ? totalNum : null,
                            resultados,
                        });
                    } catch {
                        issueSummaryByOrderId.set(orderId, {
                            subtotal: null,
                            shippingTotal: null,
                            total: null,
                            resultados: [],
                        });
                    }
                })
            );

            const mapped: PedidoRound[] = (response?.data?.orders || []).map((order) => {
                const shipmentCode = String(order.shipmentCode || "").trim();
                const orderSummary = summaryByShipmentCode.get(shipmentCode);
                const orderId = String(order.omsOrderId || "").trim();
                const issueSummary = issueSummaryByOrderId.get(orderId);
                const picker =
                    order.assigned?.estado === "ASIGNADO"
                        ? order.assigned?.pickerNombre || null
                        : null;
                const fecha = order.dateCreated || null;

                return {
                    id: shipmentCode || orderId || String(rondaId),
                    sessionId: String(rondaId),
                    shipmentCode,
                    subtotal: issueSummary?.subtotal ?? orderSummary?.subtotal ?? null,
                    shippingTotal:
                        issueSummary?.shippingTotal
                        ?? (typeof orderSummary?.total === "number" && typeof orderSummary?.subtotal === "number"
                            ? orderSummary.total - orderSummary.subtotal
                            : null),
                    total: issueSummary?.total ?? orderSummary?.total ?? null,
                    pickingProducts: orderSummary?.pickingProducts ?? null,
                    pickingItems: orderSummary?.pickingItems ?? null,
                    customerName: orderSummary?.customerName ?? null,
                    customerEmail: orderSummary?.customerEmail ?? null,
                    customerPhone: orderSummary?.customerPhone ?? null,
                    deliveryType: orderSummary?.deliveryType ?? null,
                    deliveryAddress: orderSummary?.deliveryAddress ?? null,
                    deliveryCompany: orderSummary?.deliveryCompany ?? null,
                    date: fecha ? `${fmtDate(fecha)} ${fmtTime(fecha)}`.trim() : "-",
                    assigned: picker,
                    status: orderSummary?.status ? toStatusEs(orderSummary.status) : "Pendiente",
                    warehouseName: null,
                    resultados: issueSummary?.resultados ?? [],
                };
            });

            const uniqueBySession = new Map<string, PedidoRound>();
            mapped.forEach((round) => {
                const uniqueKey = `${round.sessionId}::${round.shipmentCode || ""}`;
                uniqueBySession.set(uniqueKey, round);
            });

            setRounds(Array.from(uniqueBySession.values()));
        } catch {
            setErrorMessage("No se pudieron cargar las rondas de los pedidos.");
            setRounds([]);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuthQA, rondaId]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/rondas"),
            },
        ],
        [router]
    );

    usePageHeader(
        () => ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Rondas
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                        #{rondaId}
                    </div>
                </div>
            ),
            action: headerActions,
        }),
        [headerActions, rondaId]
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="flex-1">
                {loading ? (
                    <div className="overflow-x-auto border rounded-md bg-white">
                        <table className="min-w-full text-sm">
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-6 text-center text-gray-500"
                                    >
                                        <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                        Cargando rondas...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : errorMessage ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                        <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium">Error al cargar rondas</h3>
                                <p className="mt-2 text-sm">{errorMessage}</p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={loadOrders}
                                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <RoundsExpandableList
                        rounds={rounds}
                        mode="session-summary"
                        emptyText="No hay rondas asociadas a los pedidos de esta sesión."
                    />
                )}
            </div>
        </div>
    );
}
