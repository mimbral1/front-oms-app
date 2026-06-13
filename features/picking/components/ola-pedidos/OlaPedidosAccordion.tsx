"use client";

import React from "react";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    LockClosedIcon,
} from "@heroicons/react/24/outline";
import { GeneralStatusBadge } from "@/components/ui";
import type { OrderRow } from "../../types/ola-pedidos";

/** Human-readable labels for shipping-type codes */
const SHIPPING_TYPE_LABELS: Record<string, string> = {
    HOME_DELIVERY: "Envío a domicilio",
    PICKUP_POINT: "Retiro en tienda",
};

const getShippingTypeLabel = (code?: string) => {
    if (!code || code === "-") return "-";
    return SHIPPING_TYPE_LABELS[code] ?? code;
};

interface OlaPedidosAccordionProps {
    orders: OrderRow[];
    expandedOrders: Set<string>;
    selectedItemKeys: Set<string>;
    onToggleExpand: (orderId: string) => void;
    onToggleItem: (itemKey: string, checked: boolean) => void;
    onToggleAllInOrder: (order: OrderRow, checked: boolean) => void;
}

/**
 * Accordion list of orders with expandable item-detail tables.
 * Each order header shows a summary row; expanding reveals the items grid
 * with per-item selection checkboxes.
 */
export default function OlaPedidosAccordion({
    orders,
    expandedOrders,
    selectedItemKeys,
    onToggleExpand,
    onToggleItem,
    onToggleAllInOrder,
}: OlaPedidosAccordionProps) {
    if (orders.length === 0) {
        return (
            <div className="py-8 text-center text-gray-500">
                No hay pedidos asociados a esta ola.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                const isExpanded = expandedOrders.has(order.id);
                const selectableItems = order.detailItems.filter(
                    (item) => item.itemAssignmentStatus?.toLowerCase() === "pending"
                );
                const allItemsAssigned =
                    order.detailItems.length > 0 &&
                    order.detailItems.every(
                        (item) =>
                            item.itemAssignmentStatus?.toLowerCase() === "assigned" ||
                            Boolean(item.sessionItemId)
                    );
                const selectedInOrder = order.detailItems.filter((item) =>
                    selectedItemKeys.has(item.key)
                ).length;
                const allSelected =
                    selectableItems.length > 0 &&
                    selectableItems.every((item) => selectedItemKeys.has(item.key));

                return (
                    <div
                        key={order.id}
                        className="overflow-hidden rounded-xl border border-gray-200"
                    >
                        {/* Order header row */}
                        <button
                            type="button"
                            onClick={() => onToggleExpand(order.id)}
                            className="flex w-full items-center justify-between bg-white px-4 py-3 text-left hover:bg-gray-50"
                        >
                            <div className="grid flex-1 grid-cols-1 gap-2 text-sm sm:grid-cols-5">
                                <div>
                                    <div className="text-xs text-gray-500">Pedido OMS</div>
                                    <div className="font-semibold text-gray-800">
                                        {order.omsOrderId}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Commerce ID</div>
                                    <div className="font-medium text-gray-800">
                                        {order.commerceId}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Codigo envio</div>
                                    <div className="font-medium text-gray-800">
                                        {order.shipmentCode}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Items</div>
                                    <div className="font-medium text-gray-800">
                                        {order.totalItems}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Seleccionados</div>
                                    <div className="font-medium text-blue-700">
                                        {selectedInOrder}
                                    </div>
                                </div>
                            </div>
                            {allItemsAssigned && (
                                <div className="ml-3">
                                    <GeneralStatusBadge
                                        status="Asignado"
                                        variant="warning"
                                        customVariants={{
                                            warning: "bg-yellow-100 text-yellow-700",
                                        }}
                                        className="px-3 py-1 text-sm font-semibold"
                                    />
                                </div>
                            )}
                            <div className="ml-3 text-gray-500">
                                {isExpanded ? (
                                    <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                    <ChevronDownIcon className="h-5 w-5" />
                                )}
                            </div>
                        </button>

                        {/* Items table (expanded) */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                                {order.detailItems.length === 0 ? (
                                    <div className="text-sm text-gray-500">
                                        Este pedido no tiene items para mostrar.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 accent-blue-600"
                                                            checked={allSelected}
                                                            disabled={selectableItems.length === 0}
                                                            onChange={(e) =>
                                                                onToggleAllInOrder(order, e.target.checked)
                                                            }
                                                        />
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                        Producto
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                        SKU
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                        EAN
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                                        Tipo de envio
                                                    </th>
                                                    <th className="px-3 py-2 text-right font-semibold text-gray-700">
                                                        Cantidad
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {order.detailItems.map((item) => {
                                                    const isAssigned =
                                                        item.itemAssignmentStatus?.toUpperCase() ===
                                                        "ASSIGNED";
                                                    const isPending =
                                                        item.itemAssignmentStatus?.toLowerCase() ===
                                                        "pending";
                                                    return (
                                                        <tr key={item.key}>
                                                            <td className="px-3 py-2 align-top">
                                                                <div
                                                                    className="inline-flex items-center gap-1"
                                                                    title={
                                                                        !isPending
                                                                            ? "Este item ya fue asignado"
                                                                            : ""
                                                                    }
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className={`h-4 w-4 ${isPending
                                                                            ? "accent-blue-600 cursor-pointer"
                                                                            : "accent-gray-300 cursor-not-allowed opacity-40"
                                                                            }`}
                                                                        disabled={!isPending}
                                                                        checked={selectedItemKeys.has(item.key)}
                                                                        onChange={(e) =>
                                                                            onToggleItem(item.key, e.target.checked)
                                                                        }
                                                                    />
                                                                    {!isPending && (
                                                                        <LockClosedIcon className="h-3.5 w-3.5 text-red-500" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 align-top">
                                                                <div className="flex items-start gap-2">
                                                                    {item.imagen ? (
                                                                        <img
                                                                            src={item.imagen}
                                                                            alt={item.producto}
                                                                            className="h-10 w-10 rounded border border-gray-200 object-cover"
                                                                        />
                                                                    ) : null}
                                                                    <span className="font-medium text-gray-800">
                                                                        {item.producto}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 align-top text-gray-700">
                                                                {item.itemcode}
                                                            </td>
                                                            <td className="px-3 py-2 align-top text-gray-700">
                                                                {item.eans}
                                                            </td>
                                                            <td className="px-3 py-2 align-top text-gray-700">
                                                                {getShippingTypeLabel(item.shippingTypeCode)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right align-top text-gray-700">
                                                                {item.cantidad}
                                                            </td>
                                                            {isAssigned && (
                                                                <td className="px-3 py-2 align-top">
                                                                    <GeneralStatusBadge
                                                                        status="Asignado"
                                                                        variant="warning"
                                                                        customVariants={{
                                                                            warning:
                                                                                "bg-yellow-100 text-yellow-700",
                                                                        }}
                                                                        className="px-3 py-1 text-sm font-semibold"
                                                                    />
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
