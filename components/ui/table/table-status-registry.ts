// components/ui/table/table-status-registry.ts
// Registro centralizado: dominio + status → variant → color hex.
// Los features registran sus status; DataTable resuelve automáticamente.

/* ─── Variant → Color ─── */

const variantToColor: Record<string, string> = {
    success: "#22c55e",
    warning: "#eab308",
    pending: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    processing: "#60a5fa",
    partial: "#facc15",
    review: "#fb923c",
    dispatch: "#a855f7",
    delivered: "#15803d",
    found: "#22c55e",
    missing: "#ef4444",
    warning2: "#F67316",
    oncourse: "#3B82F6",
    ended: "#6B7280",
    pink: "#f43f5e",
    create: "#28a745",
    update: "#007bff",
    delete: "#dc3545",
    patch: "#a855f7",
    inactive: "#d1d5db",
    activo: "#28a745",
    inactivo: "#dc3545",
};

/* ─── Registry ─── */

// domain → (status → variant string)
const registry = new Map<string, Map<string, string>>();

/**
 * Registra un mapa de estados para un dominio de tabla.
 * Se puede llamar múltiples veces (merge).
 */
export function registerTableStatusMap(
    domain: string,
    map: Record<string, string>,
) {
    if (!registry.has(domain)) {
        registry.set(domain, new Map());
    }
    const domainMap = registry.get(domain)!;
    for (const [key, variant] of Object.entries(map)) {
        domainMap.set(key, variant);
    }
}

/**
 * Resuelve un status + dominio → color hex para el borde de fila.
 * Maneja overrides de color por dominio (auditoria, motivo).
 */
export function resolveTableColor(
    status: string,
    domain: string,
): string {
    const variant = registry.get(domain)?.get(status) ?? "info";

    // Domain-specific color overrides
    if (domain === "auditoria") {
        const auditoriaColors: Record<string, string> = {
            success: "#28a745",
            info: "#007bff",
            warning: "#d6d6d6",
            error: "#dc3545",
        };
        return auditoriaColors[variant] ?? variantToColor[variant] ?? "#d1d5db";
    }

    if (domain === "motivo") {
        const motivoColors: Record<string, string> = {
            activo: "#28a745",
            inactivo: "#dc3545",
        };
        return motivoColors[variant] ?? variantToColor[variant] ?? "#d1d5db";
    }

    return variantToColor[variant] ?? "#d1d5db";
}

/* ─── Built-in domain registrations ─────────────────────────────────────── */

registerTableStatusMap("pedido", {
    "Pedido Recibido": "info",
    "Pedido recibido": "info",
    "Asignando Pickers": "processing",
    "En picking": "processing",
    "Picking Completado Parcialmente": "partial",
    "Picking Completado": "success",
    "Asignado a Packer": "processing",
    "Recibido en Packing": "review",
    "En packing": "review",
    "Pendiente de auditar": "dispatch",
    "En reparto": "delivered",
    Entregado: "success",
    Finalizada: "success",
    "En curso": "oncourse",
    Corregir: "neutral",
    Error: "error",
    found: "success",
    missing: "error",
});

registerTableStatusMap("auditoria", {
    Finalizada: "success",
    "En curso": "info",
    Corregir: "warning",
    Error: "error",
});

registerTableStatusMap("motivo", {
    Activo: "activo",
    Inactivo: "inactivo",
});

registerTableStatusMap("picking", {
    Pickeada: "success",
    Pendiente: "warning",
});

registerTableStatusMap("pickingUser", {
    Active: "success",
    Inactive: "error",
});

registerTableStatusMap("product", {
    Active: "success",
    Inactive: "inactive",
});

registerTableStatusMap("packing", {
    Active: "success",
    Inactive: "inactive",
});

registerTableStatusMap("General", {
    Active: "success",
    Inactive: "inactive",
    active: "success",
    inactive: "inactive",
});

registerTableStatusMap("integration", {
    Waiting: "warning",
    Succeeded: "success",
    Failed: "error",
    Running: "info",
});

registerTableStatusMap("Finanza", {
    Pendiente: "warning",
    Procesado: "success",
    Cancelado: "error",
});

registerTableStatusMap("Formulario", {
    Facturado: "success",
    Pendiente: "warning",
});

registerTableStatusMap("Almacenes", {
    Activo: "success",
    Inactivo: "inactive",
});

registerTableStatusMap("General2", {
    Activo: "success",
    Inactivo: "inactive",
    Preparando: "success",
    Pendiente: "inactive",
    true: "success",
    false: "inactive",
});

registerTableStatusMap("Preparables", {
    Preparando: "warning",
    Pendiente: "inactive",
    Preparado: "success",
});

registerTableStatusMap("Products", {
    Activo: "success",
    Inactivo: "inactive",
});

registerTableStatusMap("shipment", {
    Created: "warning2",
    Delivered: "success",
});

registerTableStatusMap("DeliverySlot", {
    Finalizada: "ended",
    "En curso": "oncourse",
});

registerTableStatusMap("Exportaciones", {
    Enviado: "success",
    Pendiente: "warning",
    Error: "error",
});

registerTableStatusMap("Paquete", {
    "No retornable": "pink",
    "En uso": "warning",
});

registerTableStatusMap("Ubicaciones", {
    active: "success",
    inactive: "inactive",
});

registerTableStatusMap("AlmacenamientoPosicion", {
    Activo: "success",
    Inactivo: "info",
});

registerTableStatusMap("EmailPendienteRetiro", {
    Enviado: "success",
    ErrorTemplate: "error",
});

registerTableStatusMap("OrdenesCompra", {
    O: "success",
    C: "info",
});

registerTableStatusMap("SolicitudesRms", {
    Finalizada: "success",
    Procesando: "warning",
    Rechazada: "error",
});

registerTableStatusMap("Rutas", {
    Creada: "warning2",
    Iniciado: "oncourse",
    Finalizada: "success",
});

registerTableStatusMap("AdmModEnd", {
    Activa: "success",
    Inactiva: "inactive",
});

registerTableStatusMap("Reintentos", {
    Procesado: "success",
    Error: "error",
});

registerTableStatusMap("Pedidos", {
    "Pedido Nuevo": "info",
    "OV Creada": "partial",
    "Pedido Pagado": "success",
    "Pedido Facturado": "review",
    "Listo para Picking": "processing",
    "En Picking": "processing",
    "Pendiente Entrega": "dispatch",
    "Pedido Entregado": "delivered",
    "Cancelado": "error",
    "Auditoría Completada": "success",
    "Pendiente Validación Cliente": "warning",
    "Pendiente de Ola": "pending",
    "Ola Asignada": "pending",
    "Enviado a Picking": "processing",
    "Fulfillment en Proceso": "review",
    "Listo para Finanzas": "review",
    "Listo Para Fulfillment": "review",
    "N.C Creada": "error",
    "Nota Crédito Pendiente": "warning",
    "Pendiente Facturación": "warning",
    "Pendiente Finanzas": "warning",
    "Pendiente Inventario": "pending",
    "Pendiente Validación Inventario": "warning",
    "Asignado a Packer": "processing",
    "Recibido en Packing": "review",

    // Estados de pre-venta
    "Nueva Preventa": "info",
    "Pendiente Revision Credito": "review",
    "Pendiente Revisión Crédito": "review",
    "Preventa Vencida": "error",
    "Preventa Consumida": "success",
});

registerTableStatusMap("Faltantes", {
    Pendiente: "warning",
    Procesado: "success",
    Cancelado: "error",
});

registerTableStatusMap("Usuarios", {
    Activo: "success",
    Inactivo: "error",
});

registerTableStatusMap("Traslados", {
    POSTED: "success",
    QUEUED: "info",
});

registerTableStatusMap("Rondas", {
    Pickeada: "success",
    Pendiente: "inactive",
});

registerTableStatusMap("Logs", {
    CREATE: "create",
    UPDATE: "update",
    DELETE: "delete",
    PATCH: "patch",
});

registerTableStatusMap("ReporteNotasDeCredito", {
    Abierta: "success",
    Cerrada: "info",
});

registerTableStatusMap("CreditoClientes", {
    "Sin riesgo": "success",
    "En riesgo": "warning",
    Riesgoso: "error",
    "New tag": "info",
});

registerTableStatusMap("PedidosRondas", {
    Entregada: "success",
    "No entregada": "info",
});

registerTableStatusMap("trackeoPacking", {
    "En uso": "warning",
    "No retornable": "error",
});

registerTableStatusMap("Pricing", {
    "Muy Caro": "error",
    Competitivo: "warning",
    "Más Barato": "success",
});
