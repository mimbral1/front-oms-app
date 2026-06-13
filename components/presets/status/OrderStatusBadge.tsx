// components/presets/status/OrderStatusBadge.tsx
// Preset: recibe el string crudo del backend y renderiza el badge correcto.
//
// Uso:
//   <OrderStatusBadge status={pedido.estado} />
//   <OrderStatusBadge status={pedido.estado} fixed />
//
// No necesitás pensar en variantes, colores ni normalización.
// Todo se resuelve internamente desde el registry (dominio "pedido").

"use client";

import React from "react";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/badge/StatusBadge";

// Asegura que los estados de pedido estén registrados
import "@/features/pedidos/utils/pedido-status";

/* ─── Normalización ─── */

/**
 * Normaliza el string de estado que viene del backend.
 * Corrige inconsistencias comunes: mayúsculas, trailing spaces, etc.
 */
function normalizeOrderStatus(raw: string): string {
    const trimmed = raw.trim();

    // Mapa de normalizaciones conocidas (backend inconsistente)
    const NORMALIZATIONS: Record<string, string> = {
        "pedido recibido": "Pedido Recibido",
        "pedido nuevo": "Pedido Nuevo",
        "ov creada": "OV Creada",
        "pedido pagado": "Pedido Pagado",
        "pedido facturado": "Pedido Facturado",
        "listo para picking": "Listo para Picking",
        "pendiente entrega": "Pendiente Entrega",
        "pedido entregado": "Pedido Entregado",
        "asignando pickers": "Asignando Pickers",
        "en picking": "En picking",
        "picking completado parcialmente": "Picking Completado Parcialmente",
        "picking completado": "Picking Completado",
        "asignado a packer": "Asignado a Packer",
        "recibido en packing": "Recibido en Packing",
        "en packing": "En packing",
        "pendiente de auditar": "Pendiente de auditar",
        "en reparto": "En reparto",
        "entregado": "Entregado",
        "pendiente": "Pendiente",
        "en proceso": "En Proceso",
        "completado": "Completado",
        "cancelado": "Cancelado",
        "auditoría completada": "Auditoría Completada",
        "pendiente validación cliente": "Pendiente Validación Cliente",
        "pendiente de ola": "Pendiente de Ola",
        "enviado a picking": "Enviado a Picking",
        "fulfillment en proceso": "Fulfillment en Proceso",
        "listo para fulfillment": "Listo Para Fulfillment",
        "n.c creada": "N.C Creada",
        "nota crédito pendiente": "Nota Crédito Pendiente",
    };

    return NORMALIZATIONS[trimmed.toLowerCase()] ?? trimmed;
}

/* ─── Componente ─── */

export interface OrderStatusBadgeProps
    extends Omit<StatusBadgeProps, "domain"> {
    /** El string de estado tal como viene del backend */
    status: string;
}

export function OrderStatusBadge({ status, ...rest }: OrderStatusBadgeProps) {
    const normalized = normalizeOrderStatus(status);

    return <StatusBadge status={normalized} domain="pedido" {...rest} />;
}

/* ─── Variante para items de pedido ─── */

export interface OrderItemStatusBadgeProps
    extends Omit<StatusBadgeProps, "domain"> {
    status: string;
}

export function OrderItemStatusBadge({ status, ...rest }: OrderItemStatusBadgeProps) {
    return <StatusBadge status={status.trim()} domain="pedido-item" {...rest} />;
}
