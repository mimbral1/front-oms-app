"use client";

import { useMemo, type ReactNode } from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover/popover";
import { ClearFiltersButton } from "@/components/ui/clear-filters";

interface AdvancedFilterPopoverProps {
    /** Cantidad de filtros activos (se muestra como badge) */
    activeCount?: number;
    /** ¿Hay al menos un filtro activo? Controla estado del botón Limpiar */
    hasAnyActive?: boolean;
    /** Callback al presionar "Limpiar" */
    onClearAll: () => void;
    /** Ancho del popover (ej. "w-[560px]", "w-[340px]") */
    width?: string;
    /** Contenido interno del popover — los campos específicos de cada page */
    children: ReactNode;
}

export function AdvancedFilterPopover({
    activeCount = 0,
    hasAnyActive = false,
    onClearAll,
    width = "w-[340px]",
    children,
}: AdvancedFilterPopoverProps) {
    const badge = useMemo(() => Math.max(0, activeCount), [activeCount]);

    return (
        <div className="ml-auto flex items-center gap-3">
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                        aria-label="Filtros avanzados"
                    >
                        <FunnelIcon className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-700">Filtros</span>
                        {badge > 0 && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                {badge}
                            </span>
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className={`${width} p-4 space-y-3`}
                    align="end"
                    onPointerDownOutside={(e) => {
                        // Prevent closing when interacting with nested Radix popovers (e.g. DateRangeFilter)
                        const target = e.target as HTMLElement;
                        if (target.closest("[data-radix-popper-content-wrapper]")) {
                            e.preventDefault();
                        }
                    }}
                >
                    {children}
                </PopoverContent>
            </Popover>

            <ClearFiltersButton onClick={onClearAll} disabled={!hasAnyActive} />
        </div>
    );
}
