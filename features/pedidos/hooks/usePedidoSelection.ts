// features/pedidos/hooks/usePedidoSelection.ts
"use client";

import { useMemo, useState, useCallback } from "react";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";

/**
 * Hook que encapsula toda la lógica de selección de pedidos por checkbox.
 * Recibe la página actual de pedidos para calcular "select all" sobre ella.
 */
export function usePedidoSelection(pedidos: Pedido[]) {
    const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

    const isSelected = useCallback(
        (p: Pedido) => !!selectedMap[String(p.id)],
        [selectedMap],
    );

    const toggleOne = useCallback((p: Pedido) => {
        const key = String(p.id);
        setSelectedMap((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const toggleAll = useCallback(() => {
        setSelectedMap((prev) => {
            const allSelected =
                pedidos.length > 0 && pedidos.every((p) => prev[String(p.id)]);
            const next: Record<string, boolean> = { ...prev };
            pedidos.forEach((p) => {
                next[String(p.id)] = !allSelected;
            });
            return next;
        });
    }, [pedidos]);

    const isAllSelected = useMemo(
        () => pedidos.length > 0 && pedidos.every((p) => isSelected(p)),
        [pedidos, isSelected],
    );

    const selectedList = useMemo(
        () => pedidos.filter((p) => isSelected(p)),
        [pedidos, isSelected],
    );

    const hasSelection = selectedList.length > 0;

    const clear = useCallback(() => setSelectedMap({}), []);

    return {
        isSelected,
        toggleOne,
        toggleAll,
        isAllSelected,
        selectedList,
        hasSelection,
        clear,
    };
}
