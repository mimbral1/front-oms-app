// components\table\AdaptiveDataTable.tsx
import React from "react";
import { cn } from "@/lib/utils";
import {
    adaptiveContainer,
    adaptiveHeaderGrid,
    adaptiveHeaderCols,
    adaptiveRowGrid,
    adaptiveRowCell,
} from "./table.styles";

export interface AdaptiveColumn<T> {
    key: string;
    header: React.ReactNode;
    render: (item: T) => React.ReactNode;
}

interface AdaptiveDataTableProps<T> {
    data: T[];
    columns: AdaptiveColumn<T>[];
    onRowClick?: (item: T) => void;
    className?: string;
}

/**
 * AdaptiveDataTable
 * -----------------
 * - NO usa <table>
 * - Usa grid (como Detalle de Pedido)
 * - Nunca genera overflow horizontal
 * - Se adapta proporcionalmente al ancho disponible
 */
export function AdaptiveDataTable<T>({
    data,
    columns,
    onRowClick,
    className,
}: AdaptiveDataTableProps<T>) {
    return (
        <div className={cn(adaptiveContainer, className)}>
            {/* Header */}
            <div
                className={cn(
                    adaptiveHeaderGrid,
                    adaptiveHeaderCols
                )}
            >
                {columns.map((col) => (
                    <div key={col.key} className="truncate">
                        {col.header}
                    </div>
                ))}
            </div>

            {/* Rows */}
            {data.map((item, idx) => (
                <div
                    key={idx}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                        adaptiveRowGrid,
                        adaptiveHeaderCols
                    )}
                >
                    {columns.map((col) => (
                        <div
                            key={col.key}
                            className={adaptiveRowCell}
                        >
                            {col.render(item)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
