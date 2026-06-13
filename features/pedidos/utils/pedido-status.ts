// features/pedidos/utils/pedido-status.ts
// Helpers puros de estado / tiempo para pedidos.
//
// Los estados se definen ACÁ (el feature es dueño de su dominio)
// y se registran en el registry para que <StatusBadge domain="pedido" /> funcione.
//
// Uso en vistas:
//   <StatusBadge status={pedido.estado} domain="pedido" />

import type { Pedido, PedidoStatus } from "@/features/pedidos/types/lista-pedidos";
import type { ItemStatus } from "@/features/pedidos/types/detalle-pedido";
import type { StatusVariant } from "@/components/ui/badge/status";
import { registerStatusMap, resolveStatus } from "@/components/ui/badge/status-registry";

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * ESTADOS DE PEDIDO
 * Fuente única de verdad para todos los estados del dominio.
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */

const PEDIDO_STATUSES = {
    // Estados nuevos del endpoint
    "Pedido Nuevo": { variant: "info" as const },
    "OV Creada": { variant: "partial" as const },
    "Pedido Pagado": { variant: "success" as const },
    "Pedido Facturado": { variant: "review" as const },
    "Listo para Picking": { variant: "processing" as const },
    "Pendiente Entrega": { variant: "dispatch" as const },
    "Pedido Entregado": { variant: "delivered" as const },

    // Estados legacy
    "Pedido Recibido": { variant: "info" as const },
    "Pedido recibido": { variant: "info" as const },
    "Asignando Pickers": { variant: "processing" as const },
    "En picking": { variant: "processing" as const },
    "Picking Completado Parcialmente": { variant: "partial" as const },
    "Picking Completado": { variant: "success" as const },
    "Asignado a Packer": { variant: "processing" as const },
    "Recibido en Packing": { variant: "review" as const },
    "En packing": { variant: "review" as const },
    "Pendiente de auditar": { variant: "dispatch" as const },
    "En reparto": { variant: "delivered" as const },
    "Entregado": { variant: "success" as const },

    // Estados adicionales del endpoint
    "Auditoría Completada": { variant: "success" as const },
    "Cancelado": { variant: "error" as const },
    "En Picking": { variant: "processing" as const },
    "Pendiente Validación Cliente": { variant: "warning" as const },
    "Pendiente de Ola": { variant: "pending" as const },
    "Ola Asignada": { variant: "pending" as const },
    "Enviado a Picking": { variant: "processing" as const },
    "Fulfillment en Proceso": { variant: "review" as const },
    "Listo Para Fulfillment": { variant: "review" as const },
    "Listo para Finanzas": { variant: "review" as const },
    "N.C Creada": { variant: "error" as const },
    "Nota Crédito Pendiente": { variant: "warning" as const },
    "Pendiente Facturación": { variant: "warning" as const },
    "Pendiente Finanzas": { variant: "warning" as const },
    "Pendiente Inventario": { variant: "pending" as const },
    "Pendiente Validación Inventario": { variant: "warning" as const },

    // Estados de pre-venta
    "Nueva Preventa": { variant: "info" as const },
    "Pendiente Revision Credito": { variant: "review" as const },
    "Pendiente Revisión Crédito": { variant: "review" as const },
    "Preventa Vencida": { variant: "error" as const },
    "Preventa Consumida": { variant: "success" as const },

    // Estados de PedidoStatus (legacy)
    "Pendiente": { variant: "pending" as const },
    "En Proceso": { variant: "processing" as const },
    "Completado": { variant: "success" as const },
    "Anulado": { variant: "error" as const },
    "Pickeado": { variant: "success" as const },
    "Pickeada": { variant: "success" as const },
    "Finalizado": { variant: "success" as const },
    "Entregada": { variant: "delivered" as const },
    "Procesando": { variant: "processing" as const },
    "En curso": { variant: "processing" as const },
    "Recibido": { variant: "info" as const },
    "Listo para enviar": { variant: "dispatch" as const },
};

const PEDIDO_ITEM_STATUSES = {
    "Procesado": { variant: "success" as const },
    "Pendiente": { variant: "pending" as const },
    "Faltante": { variant: "error" as const },
};

// Registrar en el registry global
registerStatusMap("pedido", PEDIDO_STATUSES);
registerStatusMap("pedido-item", PEDIDO_ITEM_STATUSES);

/* ────────────────────────────────────────────────────────────
 * getStatusVariant
 * Mapea el estado textual de un pedido al variant del badge.
 * ──────────────────────────────────────────────────────────── */
export function getStatusVariant(status: Pedido["estado"]): StatusVariant {
    return resolveStatus(status, "pedido").variant as StatusVariant;
}

/* ────────────────────────────────────────────────────────────
 * getRemainingTime
 * Calcula el tiempo restante hasta la fecha de entrega.
 * Formato de entrada esperado: "DD/MM/YYYY HH:mm:ss"
 * ──────────────────────────────────────────────────────────── */
export function getRemainingTime(fechaEntrega?: string | null) {
    if (!fechaEntrega) {
        return { label: "—", seconds: null };
    }

    const parts = fechaEntrega.split(" ");
    if (parts.length !== 2) {
        return { label: "—", seconds: null };
    }

    const [datePart, timePart] = parts;
    const [day, month, year] = datePart.split("/").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    const entregaDate = new Date(year, month - 1, day, hours, minutes, seconds);
    const now = new Date();

    const diffMs = entregaDate.getTime() - now.getTime();
    let totalSeconds = Math.floor(diffMs / 1000);

    if (totalSeconds <= 0) {
        return { label: "Tiempo vencido", seconds: 0 };
    }

    const days = Math.floor(totalSeconds / 86400);
    totalSeconds -= days * 86400;

    const h = Math.floor(totalSeconds / 3600);
    totalSeconds -= h * 3600;

    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds - m * 60;

    const pad = (n: number) => String(n).padStart(2, "0");

    const label =
        days > 0
            ? `${days}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`
            : `${pad(h)}h ${pad(m)}m ${pad(s)}s`;

    return {
        label,
        seconds: Math.floor(diffMs / 1000),
    };
}

/* ────────────────────────────────────────────────────────────
 * getPedidoStatusVariant
 * Mapea el estado legacy de PedidoStatus al variant del badge.
 * Delega al registry centralizado (dominio "pedido").
 * ──────────────────────────────────────────────────────────── */
export const getPedidoStatusVariant = (status: PedidoStatus): StatusVariant => {
    return resolveStatus(status, "pedido").variant as StatusVariant;
};

/* ────────────────────────────────────────────────────────────
 * getItemStatusVariant
 * Mapea el estado de un item de pedido al variant del badge.
 * Delega al registry centralizado (dominio "pedido-item").
 * ──────────────────────────────────────────────────────────── */
export const getItemStatusVariant = (status: ItemStatus): StatusVariant => {
    return resolveStatus(status, "pedido-item").variant as StatusVariant;
};
