"use client";

import { useMemo, useState } from "react";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { AdvancedFilterPopover } from "@/components/ui/filters/advanced-filter-popover";
import { DateRangeFilter } from "@/components/ui/date-range-picker";

export type PedidosAdv = {
    u_ref1: string;
    folioNum: string;
    orderId: string;
    cliente: string;
    q: string;
    dateFrom: string;
    dateTo: string;
    sortBy: string;
    sortDir: "ASC" | "DESC";
    orderStatusId: string;
    tipoEntrega: string;
    direccion: string;
    empresaDelivery: string;
    fechaEntregaDesde: string;
    fechaEntregaHasta: string;
    almacen: string;
    salesChannel: string;
};

const SORT_BY_OPTIONS = [
    { label: "orderID", value: "orderID" },
    { label: "createdAt", value: "createdAt" },
    { label: "folioNum", value: "folioNum" },
    { label: "u_ref1", value: "u_ref1" },
    { label: "cliente", value: "cliente" },
];

export default function AdvancedFiltersPedidos({
    advancedFilters,
    onAdvancedChange,
    onClearAll,
    activeCount = 0,
    hasAnyActive = false,
    statusOptions = [],
    salesChannelOptions = [],
}: {
    advancedFilters: PedidosAdv;
    onAdvancedChange: (id: keyof PedidosAdv, value: string) => void;
    onClearAll: () => void;
    activeCount?: number;
    hasAnyActive?: boolean;
    statusOptions?: { label: string; value: string }[];
    salesChannelOptions?: { label: string; value: string }[];
}) {
    // === Multi select para Sales Channel ===
    const [salesChSearch, setSalesChSearch] = useState("");
    const scLookup = useMemo(() => {
        const m = new Map<string, string>();
        (salesChannelOptions || []).forEach(o => m.set(String(o.value), String(o.label)));
        return m;
    }, [salesChannelOptions]);

    const selectedSalesCh = useMemo(() => {
        return (advancedFilters.salesChannel || "")
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
    }, [advancedFilters.salesChannel]);

    const visibleSalesChOpts = useMemo(() => {
        const q = salesChSearch.trim().toLowerCase();
        if (!q) return salesChannelOptions || [];
        return (salesChannelOptions || []).filter(o =>
            (o.label + " " + o.value).toLowerCase().includes(q)
        );
    }, [salesChannelOptions, salesChSearch]);

    const addSalesCh = (value: string) => {
        if (!value) return;
        if (selectedSalesCh.includes(value)) return;
        const next = [...selectedSalesCh, value];
        onAdvancedChange("salesChannel", next.join(","));
    };

    const removeSalesCh = (value: string) => {
        const next = selectedSalesCh.filter(v => v !== value);
        onAdvancedChange("salesChannel", next.join(","));
    };

    return (
        <AdvancedFilterPopover
            activeCount={activeCount}
            hasAnyActive={hasAnyActive}
            onClearAll={onClearAll}
            width="w-[560px]"
        >
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Pedido (u_ref1)</label>
                        <input
                            value={advancedFilters.u_ref1}
                            onChange={(e) => onAdvancedChange("u_ref1", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="1567160557813-01"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Order ID</label>
                        <input
                            value={advancedFilters.orderId}
                            onChange={(e) => onAdvancedChange("orderId", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="1128"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Cliente</label>
                        <input
                            value={advancedFilters.cliente}
                            onChange={(e) => onAdvancedChange("cliente", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Nombre cliente"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                            <label className="mb-1 block text-sm text-gray-600">Fecha creación</label>
                            <DateRangeFilter
                                label="Fecha creación"
                                value={advancedFilters.dateFrom && advancedFilters.dateTo ? { start: advancedFilters.dateFrom, end: advancedFilters.dateTo } : null}
                                onChange={(range) => {
                                    onAdvancedChange("dateFrom", range?.start ?? "");
                                    onAdvancedChange("dateTo", range?.end ?? "");
                                }}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                            <label className="mb-1 block text-sm text-gray-600">Fecha entrega</label>
                            <DateRangeFilter
                                label="Fecha entrega"
                                value={advancedFilters.fechaEntregaDesde && advancedFilters.fechaEntregaHasta ? { start: advancedFilters.fechaEntregaDesde, end: advancedFilters.fechaEntregaHasta } : null}
                                onChange={(range) => {
                                    onAdvancedChange("fechaEntregaDesde", range?.start ?? "");
                                    onAdvancedChange("fechaEntregaHasta", range?.end ?? "");
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Empresa delivery</label>
                        <input
                            value={advancedFilters.empresaDelivery}
                            onChange={(e) => onAdvancedChange("empresaDelivery", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="BlueExpress, Chilexpress, Flota…"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Almacén (whscode)</label>
                        <input
                            value={advancedFilters.almacen}
                            onChange={(e) => onAdvancedChange("almacen", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="01 / 02 / 03 / ..."
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Folio</label>
                        <input
                            value={advancedFilters.folioNum}
                            onChange={(e) => onAdvancedChange("folioNum", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Folio"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Búsqueda (q)</label>
                        <input
                            value={advancedFilters.q}
                            onChange={(e) => onAdvancedChange("q", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Texto libre"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="mb-1 block text-sm text-gray-600">Ordenar por</label>
                            <select
                                value={advancedFilters.sortBy}
                                onChange={(e) => onAdvancedChange("sortBy", e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            >
                                {SORT_BY_OPTIONS.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-gray-600">Ordenar manera</label>
                            <select
                                value={advancedFilters.sortDir}
                                onChange={(e) => onAdvancedChange("sortDir", e.target.value as "ASC" | "DESC")}
                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            >
                                <option value="DESC">DESC</option>
                                <option value="ASC">ASC</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Canales de venta</label>

                        {/* Input con búsqueda + selección (multi) */}
                        <SelectSearchInline
                            id="salesChannel"
                            label="Canal de venta"
                            value={"" /* siempre vacío para permitir agregar múltiples */}
                            options={visibleSalesChOpts}
                            searchQuery={salesChSearch}
                            onSearch={setSalesChSearch}
                            onChange={(val) => addSalesCh(val)}
                        />

                        {/* Chips de seleccionados */}
                        <div className="mt-2 flex flex-wrap gap-2">
                            {selectedSalesCh.map((refId) => (
                                <span key={refId} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                                    {scLookup.get(refId) ?? refId}
                                    <button
                                        type="button"
                                        className="ml-2 text-gray-500 hover:text-gray-800"
                                        onClick={() => removeSalesCh(refId)}
                                        aria-label={`Quitar ${refId}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Estado (orderStatusId)</label>
                        <select
                            value={advancedFilters.orderStatusId}
                            onChange={(e) => onAdvancedChange("orderStatusId", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        >
                            <option value="">Todos los estados</option>
                            {statusOptions.map((op) => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Tipo entrega</label>
                        <input
                            value={advancedFilters.tipoEntrega}
                            onChange={(e) => onAdvancedChange("tipoEntrega", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Envio a Domicilio / Retiro en tienda"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Dirección</label>
                        <input
                            value={advancedFilters.direccion}
                            onChange={(e) => onAdvancedChange("direccion", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Calle, número, barrio, ciudad, país…"
                        />
                    </div>
                </div>
            </div>
        </AdvancedFilterPopover>
    );
}
