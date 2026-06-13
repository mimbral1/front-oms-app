// components/ui/empty-state/EmptyState.tsx
"use client";

import React from "react";

export interface EmptyStateProps {
    /** Icono opcional que se muestra sobre el título */
    icon?: React.ReactNode;
    /** Título principal (ej: "No hay resultados") */
    title: string;
    /** Descripción secundaria opcional */
    description?: string;
    /** Acción opcional (botón, link, etc.) */
    action?: React.ReactNode;
    /** Clase CSS extra */
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
        >
            {icon && (
                <div className="mb-4 text-gray-300">{icon}</div>
            )}

            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>

            {description && (
                <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>
            )}

            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
