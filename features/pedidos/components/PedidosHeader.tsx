// features/pedidos/components/PedidosHeader.tsx
"use client";

import { ArrowPathIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/ui/button/action-button";
import { NewButton } from "@/components/presets/buttons/NewButton";
import { ExportButton } from "@/components/presets/buttons/ExportButton";
import AdvancedFiltersPedidos, { type PedidosAdv } from "./FiltrosPedidos";

interface PedidosListadoHeaderProps {
    /** Filtros del header (id, cliente, estado, fechas) */
    headerFilters: any[];
    onFilterChange: (id: string, value: string) => void;

    /** Filtros avanzados */
    advancedFiltersState: PedidosAdv;
    onAdvancedFieldChange: (id: string, value: string) => void;
    onClearAll: () => void;
    activeCount: number;
    hasAnyActive: boolean;
    statusOptions: { label: string; value: string }[];
    salesChannelOptions: { label: string; value: string }[];

    /** Callbacks de acciones */
    onRefresh: () => void;
    onNewPedido: () => void;
    onExport: () => void;
    onOpenActions: () => void;
}

export default function PedidosListadoHeader({
    headerFilters,
    onFilterChange,
    advancedFiltersState,
    onAdvancedFieldChange,
    onClearAll,
    activeCount,
    hasAnyActive,
    statusOptions,
    salesChannelOptions,
    onRefresh,
    onNewPedido,
    onExport,
    onOpenActions,
}: PedidosListadoHeaderProps) {
    return (
        <PageHeader
            sticky
            stickyTop={1}
            title="Lista de Pedidos"
            description="Gestiona y monitorea los pedidos activos"
            action={
                <div className="flex items-center gap-2">
                    <ActionButton variant="secondary" onClick={onRefresh}>
                        <ArrowPathIcon className="h-5 w-5" />
                        Actualizar
                    </ActionButton>
                    <NewButton label="Nuevo Pedido" onClick={onNewPedido} />
                    <ExportButton onClick={onExport} />
                    <ActionButton variant="secondary" onClick={onOpenActions}>
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                    </ActionButton>
                </div>
            }
            filters={headerFilters}
            filterTitle={false}
            filtersAppearance="minimal"
            onFilterChange={onFilterChange}
            className="flex-wrap"
            filtersRight={
                <AdvancedFiltersPedidos
                    advancedFilters={advancedFiltersState}
                    onAdvancedChange={onAdvancedFieldChange}
                    onClearAll={onClearAll}
                    activeCount={activeCount}
                    hasAnyActive={hasAnyActive}
                    statusOptions={statusOptions}
                    salesChannelOptions={salesChannelOptions}
                />
            }
        />
    );
}
