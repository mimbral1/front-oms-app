// hooks/Pedidos/filtros-pedidos.tsx
/**
 * Centraliza la construcción de query params y la llamada a
 * GET /api/oms-service/orders/summary
 *
 */

import { BASE_OMS } from "@/lib/http/endpoints";

export type SortDir = "ASC" | "DESC";

export type ApiFilters = {
    /** ID textual del pedido */
    id?: string | number;
    /** Búsqueda libre */
    q?: string;
    /** dd/mm/yyyy o dd/mm/yyyy HH:mm:ss (el backend ya lo entiende) */
    dateFrom?: string;
    /** dd/mm/yyyy o dd/mm/yyyy HH:mm:ss (el backend ya lo entiende) */
    dateTo?: string;
    /** Campo de ordenamiento (por defecto backend: orderID) */
    sortBy?: string;
    /** Dirección de ordenamiento (por defecto backend: DESC) */
    sortDir?: SortDir;
    /** ID numérico del pedido (orderId en backend) */
    orderId?: string | number;
    /** Referencia (u_ref1 en backend) */
    u_ref1?: string;
    /** Folio (folioNum en backend) */
    folioNum?: string;
    /** Nombre/cliente */
    cliente?: string;
    /** Estado numérico del pedido */
    orderStatusId?: string | number;

    tipoEntrega?: string;
    direccion?: string;
    empresaDelivery?: string;
    almacen?: string;
    fechaEntregaDesde?: string;
    fechaEntregaHasta?: string;

    salesChannel?: string;
};

/** Item tal como lo entrega el backend (sin transformar a tu tipo Pedido del store) */
export type SummaryItem = {
    datosPedido: {
        pedido: string; // ej: "VTEX-001-..."
        orderId: number;
        createdAt: string; // "dd/mm/yyyy HH:mm:ss"
        seller: string;
    };
    datosCliente: {
        nombre: string;
        correo: string;
        celular: string;
        rut: string;
    };
    datosEntrega: {
        tipoEntrega: string;
        direccion: string;
        fechaEntrega: string; // "dd/mm/yyyy HH:mm:ss"
        empresaDelivery: string;
    };
    picking: Array<{
        producto: string;
        item: string;
        cantidad: number;
    }>;
    totales: {
        total: number;
        tipoPago: string;
    };
    estado: {
        id: number | null;
        status: string; // ej: "Pedido Nuevo"
    };
};

export type SummaryResponse = {
    total: number;
    page: number;
    pageSize: number;
    sortBy: string;
    sortDir: SortDir;
    data: SummaryItem[];
};

export type FetchSummaryParams = {
    page?: number;
    pageSize?: number;
    filters?: ApiFilters;
    /** AbortController.signal opcional para cancelar la petición */
    signal?: AbortSignal;
};

/**
 * Base URL de OMS. Permite override por env var en tiempo de build.
 * Si no existe la env, usa la URL local provista.
 */
const BASE_URL =
    process.env.NEXT_PUBLIC_OMS_BASE_URL?.replace(/\/+$/, "") ||
    BASE_OMS;

/** Endpoint relativo para la lista resumida de pedidos */
const SUMMARY_PATH = "/orders/summary";

/** Agrega par solo si tiene valor (string no vacío o número válido) */
function appendIfPresent(
    params: URLSearchParams,
    key: string,
    value: unknown
) {
    if (value === null || value === undefined) return;

    // Permitir 0 como valor válido
    if (typeof value === "number") {
        params.append(key, String(value));
        return;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
            params.append(key, trimmed);
        }
        return;
    }
}

/**
 * Construye la query para /orders/summary respetando los nombres EXACTOS
 * que consume el backend.
 */
export function buildSummaryQuery({
    page,
    pageSize,
    filters,
}: {
    page?: number;
    pageSize?: number;
    filters?: ApiFilters;
}): string {
    const qs = new URLSearchParams();

    // Paginación
    appendIfPresent(qs, "page", page ?? 1);
    appendIfPresent(qs, "pageSize", pageSize ?? 50);

    // Filtros API (nombres exactos)
    if (filters) {
        appendIfPresent(qs, "id", filters.id);
        appendIfPresent(qs, "q", filters.q);
        appendIfPresent(qs, "dateFrom", filters.dateFrom);
        appendIfPresent(qs, "dateTo", filters.dateTo);
        appendIfPresent(qs, "sortBy", filters.sortBy);
        appendIfPresent(qs, "sortDir", filters.sortDir);
        appendIfPresent(qs, "orderId", filters.orderId);
        appendIfPresent(qs, "u_ref1", filters.u_ref1);
        appendIfPresent(qs, "folioNum", filters.folioNum);
        appendIfPresent(qs, "cliente", filters.cliente);
        appendIfPresent(qs, "orderStatusId", filters.orderStatusId);
        appendIfPresent(qs, "tipoEntrega", filters.tipoEntrega);
        appendIfPresent(qs, "direccion", filters.direccion);
        appendIfPresent(qs, "empresaDelivery", filters.empresaDelivery);
        appendIfPresent(qs, "almacen", filters.almacen);
        appendIfPresent(qs, "fechaEntregaDesde", filters.fechaEntregaDesde);
        appendIfPresent(qs, "fechaEntregaHasta", filters.fechaEntregaHasta);
        appendIfPresent(qs, "salesChannel", filters.salesChannel);
    }

    return qs.toString();
}

/**
 * Hace la llamada a /orders/summary y retorna el payload del backend sin transformar.
 * No muta el shape para no romper integraciones existentes.
 */
export async function fetchPedidosSummary({
    page,
    pageSize,
    filters,
    signal,
}: FetchSummaryParams = {}): Promise<SummaryResponse> {
    const query = buildSummaryQuery({ page, pageSize, filters });
    const url = `${BASE_URL}${SUMMARY_PATH}?${query}`;

    const res = await fetch(url, {
        method: "GET",
        signal,
        headers: {
            "Accept": "application/json",
        },
        // credentials: "include", // descomentar si el backend requiere cookies
    });

    if (!res.ok) {
        // Intenta extraer mensaje legible del backend
        let detail = "";
        try {
            const errJson = (await res.json()) as any;
            detail = errJson?.message || errJson?.error || "";
        } catch {
            // noop
        }
        const msg = `OMS ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ""
            }`;
        throw new Error(msg);
    }

    const json = (await res.json()) as SummaryResponse;

    // Validación mínima del shape esperado
    if (
        typeof json !== "object" ||
        json === null ||
        !Array.isArray((json as any).data) ||
        typeof (json as any).total !== "number"
    ) {
        throw new Error("Respuesta inesperada de OMS: shape inválido en /orders/summary");
    }

    return json;
}
