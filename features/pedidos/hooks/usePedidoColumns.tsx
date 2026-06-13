// features/pedidos/hooks/usePedidoColumns.tsx
// Hook que construye las columnas de la tabla de pedidos.

"use client";

import { useMemo } from "react";

import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import {
    SelectCell,
    OrderIdCell,
    CustomerCell,
    DeliveryCell,
    PickingCell,
    TotalsCell,
    StatusCell,
} from "@/features/pedidos/components/cells";

/* ────────────────────────────────────────────────────────────
 * Tipos
 * ──────────────────────────────────────────────────────────── */
export type SelectionHandlers = {
    isSelected: (p: Pedido) => boolean;
    toggleOne: (p: Pedido) => void;
    toggleAll: () => void;
    isAllSelected: boolean;
};

type UsePedidoColumnsArgs = {
    onView: (p: Pedido) => void;
    formatWhsName: (code?: string | null) => string;
    selection?: SelectionHandlers;
};

/* ────────────────────────────────────────────────────────────
 * Hook
 * ──────────────────────────────────────────────────────────── */
export function usePedidoColumns({ onView, formatWhsName, selection }: UsePedidoColumnsArgs) {
    return useMemo(() => buildColumns(onView, formatWhsName, selection), [onView, formatWhsName, selection]);
}

/* ────────────────────────────────────────────────────────────
 * Builder (puro, testeable)
 * ──────────────────────────────────────────────────────────── */
function buildColumns(
    onView: (p: Pedido) => void,
    formatWhsName: (code?: string | null) => string,
    selection?: SelectionHandlers,
) {
    return [
        {
            id: "select",
            accessorKey: "id" as keyof Pedido,
            disableRowClick: true,
            header: (
                <div data-row-click="ignore" className="flex justify-center">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-blue-500"
                        checked={selection?.isAllSelected ?? false}
                        onChange={(e) => {
                            e.stopPropagation();
                            selection?.toggleAll();
                        }}
                    />
                </div>
            ),
            cell: (p: Pedido) => <SelectCell pedido={p} selection={selection} />,
        },
        {
            header: "Pedido",
            accessorKey: "id" as keyof Pedido,
            cell: (p: Pedido) => <OrderIdCell pedido={p} />,
        },
        {
            header: "Cliente",
            accessorKey: "cliente" as keyof Pedido,
            cell: (p: Pedido) => <CustomerCell pedido={p} />,
        },
        {
            header: "Entrega",
            accessorKey: "entrega" as keyof Pedido,
            cell: (p: Pedido) => <DeliveryCell pedido={p} formatWhsName={formatWhsName} />,
        },
        {
            header: "Picking",
            accessorKey: "picking" as keyof Pedido,
            disableRowClick: true,
            cell: (p: Pedido) => <PickingCell pedido={p} />,
        },
        {
            header: "Totales",
            accessorKey: "totales" as keyof Pedido,
            cell: (p: Pedido) => <TotalsCell pedido={p} />,
        },
        {
            header: "Estado",
            accessorKey: "estado" as keyof Pedido,
            cell: (p: Pedido) => <StatusCell pedido={p} />,
        },
    ];
}
