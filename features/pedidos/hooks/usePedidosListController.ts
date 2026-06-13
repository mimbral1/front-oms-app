// features/pedidos/hooks/usePedidosListController.ts
// Controller hook — orchestrates all state, effects, and callbacks
// for the orders list view (ListadoPedidosView).

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { usePedidosStore } from "@/features/pedidos/stores/lista-pedidos";
import { useFetchPedidosOms } from "@/features/pedidos/hooks/useFetchPedidos";
import { usePedidoColumns } from "@/features/pedidos/hooks/usePedidoColumns";
import { useWarehouseMap } from "@/features/pedidos/hooks/useWarehouseMap";
import { useStatusOptions } from "@/features/pedidos/hooks/useStatusOptions";
import { useSalesChannelOptions } from "@/features/pedidos/hooks/useSalesChannelOptions";
import { exportPedidosCsv } from "@/features/pedidos/services/exportPedidos";
import { usePedidoSelection } from "@/features/pedidos/hooks/usePedidoSelection";
import { usePedidoFilters } from "@/features/pedidos/hooks/usePedidoFilters";
import { usePedidoReschedule } from "@/features/pedidos/hooks/usePedidoReschedule";

const ITEMS_PER_PAGE = 50;

export function usePedidosListController() {
    const router = useRouter();
    const { pedidos, setPedidos } = usePedidosStore();

    const [currentPage, setCurrentPage] = useState(1);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ─── Option loaders ───
    const { getWarehouseName } = useWarehouseMap();
    const { statusOptions } = useStatusOptions();
    const { salesChannelOptions } = useSalesChannelOptions();

    // ─── Selection ───
    const selection = usePedidoSelection(pedidos);

    // ─── Filters ───
    const filters = usePedidoFilters({
        statusOptions,
        onPageReset: () => setCurrentPage(1),
    });

    // ─── Reschedule flow ───
    const reschedule = usePedidoReschedule();

    // ─── API fetch ───
    const { pedidos: pedidosApi, total, isLoading, error, refetch } = useFetchPedidosOms({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        filters: filters.apiFilters,
    });

    // Sync API results to the store
    useEffect(() => { setPedidos(pedidosApi); }, [pedidosApi, setPedidos]);

    // Map API errors to a user-facing message
    useEffect(() => {
        if (!error) return;
        const msg =
            typeof error === "string"
                ? error
                : (error as any)?.message ??
                "Error al cargar los pedidos. Intenta nuevamente.";
        setErrorMessage(msg);
    }, [error]);

    // ─── Table columns ───
    const columns = usePedidoColumns({
        onView: (p) => {
            router.push(`/pedidos/listado-pedidos/${encodeURIComponent(p.id)}`);
        },
        formatWhsName: getWarehouseName,
        selection: {
            isSelected: selection.isSelected,
            toggleOne: selection.toggleOne,
            toggleAll: selection.toggleAll,
            isAllSelected: selection.isAllSelected,
        },
    });

    // ─── Action callbacks ───
    const handleRefresh = useCallback(() => {
        setCurrentPage(1);
        refetch();
    }, [refetch]);

    const handleNewOrder = useCallback(() => {
        router.push("/pedidos/listado-pedidos/nuevo");
    }, [router]);

    const handleExport = useCallback(() => {
        exportPedidosCsv(
            selection.selectedList.length > 0 ? selection.selectedList : pedidos,
        );
    }, [selection.selectedList, pedidos]);

    const handleRowClick = useCallback(
        (p: any) => {
            router.push(`/pedidos/listado-pedidos/${encodeURIComponent(p.folionum)}`);
        },
        [router],
    );

    const handleRetry = useCallback(() => {
        setErrorMessage(null);
        refetch();
    }, [refetch]);

    return {
        // Data
        pedidos,
        columns,
        isLoading,
        errorMessage,
        total: total ?? 0,

        // Pagination
        currentPage,
        pageSize: ITEMS_PER_PAGE,
        onPageChange: setCurrentPage,

        // Filters (pass-through)
        filters,
        statusOptions,
        salesChannelOptions,

        // Selection
        selection,

        // Reschedule
        reschedule,

        // Actions
        handleRefresh,
        handleNewOrder,
        handleExport,
        handleRowClick,
        handleRetry,
    };
}
