// components/ui/badge/status-registry.ts
// Registro centralizado: status string → visual config.
// Cada dominio registra sus estados; el badge los resuelve automáticamente.

/* ─── Tipos ─── */

export type StatusVariant =
    | "success"
    | "warning"
    | "error"
    | "info"
    | "pending"
    | "processing"
    | "partial"
    | "review"
    | "dispatch"
    | "delivered"
    | "active"
    | "inactive"
    | "default";

export interface StatusConfig {
    /** Variant semántico → define el color */
    variant: StatusVariant;
    /** Label de display (si difiere del key original) */
    label?: string;
    /** Ícono opcional */
    icon?: string;
}

/** Mapa de variant → clases Tailwind */
export const variantStyles: Record<StatusVariant, string> = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    pending: "bg-orange-500 text-white",
    processing: "bg-blue-400 text-white",
    partial: "bg-yellow-400 text-black",
    review: "bg-orange-400 text-black",
    dispatch: "bg-purple-500 text-white",
    delivered: "bg-green-700 text-white",
    active: "bg-green-600 text-white",
    inactive: "bg-gray-400 text-white",
    default: "bg-gray-200 text-black",
};

/* ─── Registry interno ─── */

// Clave = dominio (ej: "pedido", "ola", "ruta", "global")
// Valor = mapa de statusString → config
const registry = new Map<string, Map<string, StatusConfig>>();

/**
 * Registra un mapa de estados para un dominio.
 * Se puede llamar múltiples veces para el mismo dominio (merge).
 *
 * @example
 * registerStatusMap("pedido", {
 *   "Pedido Nuevo":     { variant: "info" },
 *   "Pedido Pagado":    { variant: "success" },
 *   "Pendiente Entrega": { variant: "dispatch" },
 * });
 */
export function registerStatusMap(
    domain: string,
    map: Record<string, StatusConfig>
) {
    if (!registry.has(domain)) {
        registry.set(domain, new Map());
    }
    const domainMap = registry.get(domain)!;
    for (const [key, config] of Object.entries(map)) {
        domainMap.set(key.toLowerCase(), config);
    }
}

/**
 * Resuelve un status string → StatusConfig.
 * Busca primero en el dominio específico; si no encuentra, busca en "global".
 * Si no existe en ningún lado, devuelve { variant: "default" }.
 */
export function resolveStatus(
    status: string,
    domain?: string
): StatusConfig {
    const key = status.toLowerCase();

    // 1) Buscar en dominio específico
    if (domain) {
        const config = registry.get(domain)?.get(key);
        if (config) return config;
    }

    // 2) Buscar en "global"
    const global = registry.get("global")?.get(key);
    if (global) return global;

    // 3) Fallback
    return { variant: "default" };
}

/**
 * Atajo: resuelve y devuelve directamente las clases Tailwind.
 */
export function resolveStatusStyles(
    status: string,
    domain?: string
): string {
    const { variant } = resolveStatus(status, domain);
    return variantStyles[variant];
}

/**
 * Devuelve el label de display para un status.
 * Si el registro define un label custom, lo usa; si no, devuelve el status original.
 */
export function resolveStatusLabel(
    status: string,
    domain?: string
): string {
    const config = resolveStatus(status, domain);
    return config.label ?? status;
}

/* ─── Estados globales (compartidos entre todos los dominios) ─── */

registerStatusMap("global", {
    // Español
    "Activo": { variant: "active" },
    "Inactivo": { variant: "inactive" },
    "Pendiente": { variant: "pending" },
    "Completado": { variant: "success" },
    "Cancelado": { variant: "error" },
    "En Proceso": { variant: "processing" },
    "Aprobada": { variant: "success" },
    "Rechazada": { variant: "error" },
    "Finalizada": { variant: "success" },
    "En curso": { variant: "processing" },
    "Error": { variant: "error" },

    // Inglés (active/inactive)
    "Active": { variant: "active" },
    "Inactive": { variant: "inactive" },
    "active": { variant: "active" },
    "inactive": { variant: "inactive" },
});
