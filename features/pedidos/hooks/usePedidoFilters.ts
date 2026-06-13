"use client";

import { useMemo, useCallback, startTransition } from "react";
import { usePedidosStore } from "@/features/pedidos/stores/lista-pedidos";
import type { PedidosAdv } from "@/features/pedidos/components/FiltrosPedidos";
import { toApiFilters, countActiveFilters } from "@/features/pedidos/services/filters";
import { buildHeaderFilters, type FilterConfig } from "@/lib/filters";

interface UsePedidoFiltersOptions {
    statusOptions: { label: string; value: string }[];
    onPageReset: () => void;
}

type PedidoHeaderFilterState = {
    id: string;
    cliente: string;
    estado: string;
    fechaRango: string;
};

export function usePedidoFilters({
    statusOptions,
    onPageReset,
}: UsePedidoFiltersOptions) {
    const { filters, setFilters } = usePedidosStore();

    const apiFilters = useMemo(() => toApiFilters(filters ?? {}), [filters]);

    const headerFilterState = useMemo<PedidoHeaderFilterState>(() => {
        const currentFilters: any = filters ?? {};

        return {
            id: currentFilters.id ?? "",
            cliente: currentFilters.cliente ?? "",
            estado: currentFilters.estado ?? "",
            fechaRango:
                currentFilters.fechaEntregaDesde && currentFilters.fechaEntregaHasta
                    ? JSON.stringify({
                        start: currentFilters.fechaEntregaDesde,
                        end: currentFilters.fechaEntregaHasta,
                    })
                    : "",
        };
    }, [filters]);

    const headerFilterConfig = useMemo<FilterConfig<PedidoHeaderFilterState>[]>(
        () => [
            {
                id: "id",
                label: "Pedido",
                type: "text",
            },
            {
                id: "cliente",
                label: "Cliente",
                type: "text",
            },
            {
                id: "estado",
                label: "Estado",
                type: "select",
                options: statusOptions,
                emptyOptionLabel: "Todos los estados",
            },
            {
                id: "fechaRango",
                label: "Fecha de entrega",
                type: "date-range",
            },
        ],
        [statusOptions],
    );

    const headerFilters = useMemo(
        () =>
            buildHeaderFilters({
                configs: headerFilterConfig,
                filters: headerFilterState,
            }),
        [headerFilterConfig, headerFilterState],
    );

    const handleFilterChange = useCallback(
        (id: string, value: string) => {
            if (id === "id") setFilters({ id: value } as any);
            else if (id === "cliente") setFilters({ cliente: value } as any);
            else if (id === "fechaRango") {
                if (value) {
                    try {
                        const range = JSON.parse(value);
                        setFilters({
                            fechaEntregaDesde: range.start ?? "",
                            fechaEntregaHasta: range.end ?? "",
                        } as any);
                    } catch {
                    }
                } else {
                    setFilters({ fechaEntregaDesde: "", fechaEntregaHasta: "" } as any);
                }
            }
            else if (id === "estado") setFilters({ estado: value, orderStatusId: value } as any);
            else setFilters({ [id]: value } as any);
            onPageReset();
        },
        [setFilters, onPageReset],
    );

    const handleAdvancedFieldChange = useCallback(
        (id: string, value: string) => {
            if (id === "dateFrom") {
                setFilters({ fechaDesde: value, dateFrom: value } as any);
            } else if (id === "dateTo") {
                setFilters({ fechaHasta: value, dateTo: value } as any);
            } else {
                setFilters({ [id]: value } as any);
            }
        },
        [setFilters],
    );

    const clearAll = useCallback(() => {
        startTransition(() => {
            setFilters({
                id: "",
                q: "",
                fechaDesde: "",
                fechaHasta: "",
                dateFrom: "",
                dateTo: "",
                sortBy: "orderID",
                sortDir: "DESC",
                orderId: "",
                u_ref1: "",
                folioNum: "",
                cliente: "",
                orderStatusId: "",
                estado: "",
                tipoEntrega: "",
                direccion: "",
                empresaDelivery: "",
                fechaEntregaDesde: "",
                fechaEntregaHasta: "",
                almacen: "",
                salesChannel: "",
            } as any);
        });
        onPageReset();
    }, [setFilters, onPageReset]);

    const activeCount = useMemo(() => countActiveFilters(filters ?? {}), [filters]);
    const hasAnyActive = activeCount > 0;

    const advancedFiltersState = useMemo<PedidosAdv>(() => {
        const currentFilters: any = filters ?? {};
        return {
            u_ref1: currentFilters.u_ref1 ?? "",
            orderId: currentFilters.orderId ?? "",
            cliente: currentFilters.cliente ?? "",
            folioNum: currentFilters.folioNum ?? "",
            q: currentFilters.q ?? "",
            sortBy: currentFilters.sortBy ?? "orderID",
            sortDir: currentFilters.sortDir ?? "DESC",
            dateFrom: currentFilters.dateFrom ?? currentFilters.fechaDesde ?? "",
            dateTo: currentFilters.dateTo ?? currentFilters.fechaHasta ?? "",
            orderStatusId: currentFilters.orderStatusId ?? "",
            tipoEntrega: currentFilters.tipoEntrega ?? "",
            direccion: currentFilters.direccion ?? "",
            empresaDelivery: currentFilters.empresaDelivery ?? "",
            fechaEntregaDesde: currentFilters.fechaEntregaDesde ?? "",
            fechaEntregaHasta: currentFilters.fechaEntregaHasta ?? "",
            almacen: currentFilters.almacen ?? "",
            salesChannel: currentFilters.salesChannel ?? "",
        };
    }, [filters]);

    return {
        filters,
        apiFilters,
        headerFilters,
        handleFilterChange,
        handleAdvancedFieldChange,
        clearAll,
        activeCount,
        hasAnyActive,
        advancedFiltersState,
    };
}
