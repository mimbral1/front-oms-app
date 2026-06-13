// ─── Table Styles ────────────────────────────────────────────────────────────

// DataTable
export const tableContainer = "w-full overflow-x-auto";
export const tableContainerAdaptive = "w-full max-w-full overflow-x-hidden";
export const tableBase = "w-full table-auto border-collapse";
export const tableHead = "bg-[#E8EAF7]";
export const tableHeadCell =
    "px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500";
export const tableRow = "cursor-pointer transition hover:shadow";
export const tableCellFirst = "px-2 align-middle";
export const tableCellDefault = "px-2 align-top";
export const tableCellBase = "text-sm text-gray-700 align-middle";

// AdaptiveDataTable
export const adaptiveContainer = "w-full flex flex-col gap-2";
export const adaptiveHeaderGrid =
    "grid gap-2 px-3 py-2 rounded-md bg-[#E8EAF7] text-xs font-medium text-gray-600";
export const adaptiveHeaderCols = "grid-cols-[1.2fr_2fr_1.6fr_1fr_1fr_1fr]";
export const adaptiveRowGrid =
    "grid gap-2 px-3 py-3 rounded-lg bg-white shadow-sm cursor-pointer transition hover:shadow-md";
export const adaptiveRowCell = "min-w-0 text-sm text-gray-700";

// DataTableExpandable
export const expandableDetailRow = "border-t bg-gray-50";
export const expandableDetailCell = "px-0 py-3";
export const expandableCellBase = "text-sm text-gray-700 align-middle min-h-[44px]";

// TableHeader
export const tableHeaderWrapper = "space-y-6";
export const tableHeaderTitle = "text-2xl font-bold text-gray-900";
export const tableHeaderDescription = "mt-1 text-sm text-gray-500";

// TablePagination
export const tablePaginationContainer =
    "flex items-center justify-between bg-white px-4 py-3 sm:px-6";
export const tablePaginationButton =
    "rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
export const tablePaginationInfo = "text-sm text-gray-700";

// DataFilters
export const filtersContainer = "mb-6 grid gap-4";
export const filterInput = "rounded-lg border border-gray-300 px-4 py-2";

// ─── Status Config Maps ─────────────────────────────────────────────────────

export const estadosConfig: Record<string, Record<string, string>> = {
    pedido: {
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
    },
    auditoria: {
        Finalizada: "success",
        "En curso": "info",
        Corregir: "warning",
        Error: "error",
    },
    motivo: {
        Activo: "activo",
        Inactivo: "inactivo",
    },
    picking: {
        Pickeada: "success",
        Pendiente: "warning",
    },
    pickingUser: {
        Active: "success",
        Inactive: "error",
    },
    product: {
        Active: "success",
        Inactive: "inactive",
    },
    packing: {
        Active: "success",
        Inactive: "inactive",
    },
    General: {
        Active: "success",
        Inactive: "inactive",
        active: "success",
        inactive: "inactive",
    },
    integration: {
        Waiting: "warning",
        Succeeded: "success",
        Failed: "error",
        Running: "info",
    },
    Finanza: {
        Pendiente: "warning",
        Procesado: "success",
        Cancelado: "error",
    },
    Formulario: {
        Facturado: "success",
        Pendiente: "warning",
    },
    Almacenes: {
        Activo: "success",
        Inactivo: "inactive",
    },
    General2: {
        Activo: "success",
        Inactivo: "inactive",
        Preparando: "success",
        Pendiente: "inactive",
        true: "success",
        false: "inactive",
    },
    Preparables: {
        Preparando: "warning",
        Pendiente: "inactive",
        Preparado: "success",
    },
    Products: {
        Activo: "success",
        Inactivo: "inactive",
    },
    shipment: {
        Created: "warning2",
        Delivered: "success",
    },
    DeliverySlot: {
        Finalizada: "ended",
        "En curso": "oncourse",
    },
    Exportaciones: {
        Enviado: "success",
        Pendiente: "warning",
        Error: "error",
    },
    Paquete: {
        "No retornable": "pink",
        "En uso": "warning",
    },
    Ubicaciones: {
        active: "success",
        inactive: "inactive",
    },
    AlmacenamientoPosicion: {
        Activo: "success",
        Inactivo: "info",
    },
    EmailPendienteRetiro: {
        Enviado: "success",
        ErrorTemplate: "error",
    },
    OrdenesCompra: {
        O: "success",
        C: "info",
    },
    SolicitudesRms: {
        Finalizada: "success",
        Procesando: "warning",
        Rechazada: "error",
    },
    Rutas: {
        Creada: "warning2",
        Iniciado: "oncourse",
        Finalizada: "success",
    },
    AdmModEnd: {
        Activa: "success",
        Inactiva: "inactive",
    },
    Reintentos: {
        Procesado: "success",
        Error: "error",
    },
    Pedidos: {
        "Pedido Nuevo": "info",
        "OV Creada": "partial",
        "Pedido Pagado": "success",
        "Pedido Facturado": "review",
        "Listo para Picking": "processing",
        "Pendiente Entrega": "dispatch",
        "Pedido Entregado": "delivered",
        "Auditoría Completada": "success",
        "Pendiente Validación Cliente": "warning",
        "Pendiente de Ola": "pending",
        "Enviado a Picking": "processing",
        "Fulfillment en Proceso": "review",
        "Listo Para Fulfillment": "review",
        "N.C Creada": "error",
        "Nota Crédito Pendiente": "warning",
    },
    Faltantes: {
        Pendiente: "warning",
        Procesado: "success",
        Cancelado: "error",
    },
    Usuarios: {
        Activo: "success",
        Inactivo: "error",
    },
    Traslados: {
        POSTED: "success",
        QUEUED: "info",
    },
    Rondas: {
        Pickeada: "success",
        Pendiente: "inactive",
    },
    Logs: {
        CREATE: "create",
        UPDATE: "update",
        DELETE: "delete",
        PATCH: "patch",
    },
    ReporteNotasDeCredito: {
        Abierta: "success",
        Cerrada: "info",
    },
    CreditoClientes: {
        "Sin riesgo": "success",
        "En riesgo": "warning",
        Riesgoso: "error",
        "New tag": "info",
    },
    PedidosRondas: {
        Entregada: "success",
        "No entregada": "info",
    },
    trackeoPacking: {
        "En uso": "warning",
        "No retornable": "error",
    },
    Pricing: {
        "Muy Caro": "error",
        Competitivo: "warning",
        "Más Barato": "success",
    },
};

// ─── Color Maps ──────────────────────────────────────────────────────────────

export const variantToColor: Record<string, string> = {
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
    info: "#3b82f6",
    processing: "#60a5fa",
    partial: "#facc15",
    review: "#fb923c",
    dispatch: "#a855f7",
    delivered: "#15803d",
    found: "#22c55e",
    missing: "#ef4444",
    "#28a745": "#28a745",
    "#007bff": "#007bff",
    "#d6d6d6": "#d6d6d6",
    "#dc3545": "#dc3545",
    warning2: "#F67316",
    oncourse: "#3B82F6",
    ended: "#6B7280",
    pink: "#f43f5e",
    create: "#28a745",
    update: "#007bff",
    delete: "#dc3545",
    patch: "#a855f7",
};

export const statusVariantsPedidos: Record<string, string> = {
    success: "border-green-500",
    warning: "border-yellow-500",
    error: "border-red-500",
    info: "border-blue-500",
    processing: "border-blue-400",
    partial: "border-yellow-400",
    review: "border-orange-400",
    dispatch: "border-purple-500",
    delivered: "border-green-700",
};

export const statusColorsPicking: Record<string, string> = {
    success: "border-green-500",
    warning: "border-yellow-500",
    info: "border-blue-500",
};

export const statusColorsAuditoria: Record<string, string> = {
    success: "border-[#28a745]",
    info: "border-[#007bff]",
    warning: "border-[#d6d6d6] text-black",
    error: "border-[#dc3545]",
};

export const statusColorsProduct: Record<string, string> = {
    success: "border-green-500",
    error: "border-red-500",
    info: "border-blue-500",
    warning: "border-yellow-500",
    inactive: "border-gray-400",
};

export const statusColorsGeneral: Record<string, string> = {
    success: "border-green-500",
    inactive: "border-gray-400",
};

export const statusColorsAlmacenes: Record<string, string> = {
    success: "border-green-500",
    inactive: "border-gray-400",
};

export const statusColorsProducts: Record<string, string> = {
    Y: "border-green-500",
    N: "border-gray-400",
};

export const statusColorsIntegration: Record<string, string> = {
    success: "border-green-500",
    warning: "border-yellow-500",
    error: "border-red-500",
    info: "border-blue-500",
};

export const statusColorsFinanzas: Record<string, string> = {
    success: "border-green-500",
    warning: "border-yellow-500",
    error: "border-red-500",
    info: "border-blue-500",
};

export const statusColorsFormulario: Record<string, string> = {
    success: "border-green-500",
    warning: "border-yellow-500",
    error: "border-red-500",
    info: "border-blue-500",
};

export const paddingMapping: Record<number, string> = {
    8: "py-[8px]",
    12: "py-[12px]",
    16: "py-[16px]",
    20: "py-[20px]",
    24: "py-[24px]",
    28: "py-[28px]",
    32: "py-[32px]",
    36: "py-[36px]",
};

// ─── Expandable local config ─────────────────────────────────────────────────

export const estadosConfigLocal: Record<string, Record<string, string>> = {
    AdmModEnd: { Activa: "success", Inactiva: "inactive" },
    General: { Active: "success", Inactive: "inactive" },
};
