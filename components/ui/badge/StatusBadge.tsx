// components/ui/badge/StatusBadge.tsx
// Badge unificado que resuelve automáticamente variant + label desde el registry.
// Reemplaza a StatusBadge (manual), GeneralStatusBadge, y todos los getStatusColor inline.

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    resolveStatus,
    variantStyles,
    type StatusVariant,
    type StatusConfig,
} from "./status-registry";

export interface StatusBadgeProps {
    /** El string de estado tal como viene del backend */
    status: string;

    /**
     * Dominio para buscar en el registry (ej: "pedido", "ola", "ruta").
     * Si no se pasa, busca solo en "global".
     */
    domain?: string;

    /**
     * Override manual del variant (para casos donde el feature necesita
     * decidir el color por lógica, no por string lookup).
     */
    variant?: StatusVariant;

    /** Label override (muestra este texto en vez del status) */
    label?: string;

    /** Ancho fijo para alinear badges en tablas */
    fixed?: boolean;

    /** Clases CSS adicionales */
    className?: string;
}

const baseStyles = "rounded-full px-4 py-1.5 font-semibold text-center whitespace-nowrap";
const fixedStyles = "w-[220px] text-[13px] leading-tight";
const defaultSizeStyles = "text-sm";

export function StatusBadge({
    status,
    domain,
    variant: variantOverride,
    label: labelOverride,
    fixed = false,
    className,
}: StatusBadgeProps) {
    // 1) Resolver config desde registry
    const config: StatusConfig = resolveStatus(status, domain);

    // 2) Aplicar overrides
    const finalVariant = variantOverride ?? config.variant;
    const finalLabel = labelOverride ?? config.label ?? status;
    const colorClasses = variantStyles[finalVariant];

    return (
        <span
            className={cn(
                baseStyles,
                fixed ? fixedStyles : defaultSizeStyles,
                colorClasses,
                className
            )}
        >
            {finalLabel}
        </span>
    );
}
