// components/filters/Filtros.tsx
"use client";

import { AdvancedFilterPopover } from "@/components/ui/filters/advanced-filter-popover";

export default function AdvancedFilters({
    onClearAll,
    advancedFilters,
    onAdvancedChange,
    activeCount = 0,
    hasAnyActive = false,
}: {
    onClearAll: () => void;
    advancedFilters: {
        slot: string;
        tipo: string;          // "Order package" | "Order item" | ""
        esquema: string;
        tipoPosicion: string;
        sourceOrder: string;
        barcode: string;
    };
    onAdvancedChange: (id: string, value: string) => void;
    activeCount?: number;
    hasAnyActive?: boolean;
}) {
    return (
        <AdvancedFilterPopover
            activeCount={activeCount}
            hasAnyActive={hasAnyActive}
            onClearAll={onClearAll}
        >
            <div className="flex flex-col gap-3">
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Código de barras</label>
                    <input
                        type="text"
                        value={advancedFilters.barcode}
                        onChange={(e) => onAdvancedChange("barcode", e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Pedido</label>
                    <input
                        type="text"
                        value={advancedFilters.sourceOrder}
                        onChange={(e) => onAdvancedChange("sourceOrder", e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Slot</label>
                    <input
                        type="text"
                        value={advancedFilters.slot}
                        onChange={(e) => onAdvancedChange("slot", e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Tipo</label>
                    <select
                        value={advancedFilters.tipo}
                        onChange={(e) => onAdvancedChange("tipo", e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                        <option value="">Todos</option>
                        <option value="Order package">Order package</option>
                        <option value="Order item">Order item</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Tipo de esquema</label>
                    <input
                        type="text"
                        value={advancedFilters.esquema}
                        onChange={(e) => onAdvancedChange("esquema", e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Tipo de posición</label>
                    <input
                        type="text"
                        value={advancedFilters.tipoPosicion}
                        onChange={(e) => onAdvancedChange("tipoPosicion", e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                </div>
            </div>
        </AdvancedFilterPopover>
    );
}
