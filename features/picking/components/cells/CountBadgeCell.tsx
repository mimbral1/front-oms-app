// features/picking/components/cells/CountBadgeCell.tsx
// Celda reutilizable que muestra un número dentro de un círculo/badge.

import React from "react";

export interface CountBadgeCellProps {
    value: number | string | undefined | null;
    /** Clase CSS del contenedor (default: círculo con borde) */
    className?: string;
}

/**
 * Muestra un valor numérico dentro de un badge circular.
 * Retorna null si el valor no es un número válido.
 */
export function CountBadgeCell({ value, className }: CountBadgeCellProps) {
    const num = typeof value === "string" ? Number(value) : value;
    if (num == null || Number.isNaN(num)) return null;

    return (
        <div className="flex justify-center">
            <span
                className={
                    className ??
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-medium"
                }
            >
                {num}
            </span>
        </div>
    );
}
