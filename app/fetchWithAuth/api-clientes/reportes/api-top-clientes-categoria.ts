import { fetchJson as fetchJSON } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE } from "@/lib/http/endpoints";

const BASE_URL_ANALYTICS = "https://catalogomimbral.loclx.io/api/analytics";
const BASE_URL_ANALYSIS = BASE_ANALYSIS_SERVICE;

/* ──────────────────────────────
   Tipos
────────────────────────────── */

export interface TopClienteCategoriaApi {
    cardCode: string;
    nombre: string;
    rut: string | null;
    telefono: string | null;
    correo: string | null;
    tipoCliente: string;
    cantidadFacturas: number;
    cantidadUnidadesVendidas: number;
    totalVentas: number;
    margenReal: number;
    margenRealPct: number;
    margenEsperado: number;
    margenEsperadoPct: number;
    ultimaCompra: string;
    topCategoria: string;
    topMarca: string;
    topProducto: string;
    topProductoSku: string;
    topFormaPago: string;
    topVendedor: string;
    topCanal: string;
    topSucursal: string;
}

export interface TopClientesResponse {
    success: boolean;
    data: TopClienteCategoriaApi[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

/* ──────────────────────────────
   Tipos filtro 
────────────────────────────── */

interface CategoriasResponse {
    success: boolean;
    data: string[];
    total: number;
}

/* ──────────────────────────────
   Endpoint
────────────────────────────── */

export async function getTopClientesPorCategoria(params: {
    categoria?: string;
    marca?: string;
    canal?: string;
    page?: number;
    pageSize?: number;
}): Promise<TopClientesResponse> {

    const searchParams = new URLSearchParams();

    if (params.categoria) {
        searchParams.append("categorias", params.categoria);
    }

    if (params.marca) {
        searchParams.append("marcas", params.marca);
    }

    if (params.canal) {
        searchParams.append("canales", params.canal);
    }

    if (params.page) {
        searchParams.append("page", String(params.page));
    }

    if (params.pageSize) {
        searchParams.append("pageSize", String(params.pageSize));
    }

    const url = `${BASE_URL_ANALYTICS}/clientes?${searchParams.toString()}`;

    return fetchJSON<TopClientesResponse>(url);
}

/* ──────────────────────────────
   Endpoint categorías
────────────────────────────── */

export async function getCategoriasFiltro(): Promise<string[]> {
    const res = await fetchJSON<CategoriasResponse>(
        `${BASE_URL_ANALYSIS}/filtros/categorias`
    );

    return res.data || [];
}