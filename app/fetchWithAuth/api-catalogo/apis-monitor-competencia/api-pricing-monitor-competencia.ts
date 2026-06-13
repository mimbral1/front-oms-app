"use client";

import { useFetchWithAuth } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE, BASE_ANALYSIS_SERVICE_CATALOGO } from "@/lib/http/endpoints";

/* ──────────────────────────────
   Constantes
────────────────────────────── */

const PRICING_BASE_URL = BASE_ANALYSIS_SERVICE;
const PRICING_BASE_URL_CATALOGO = BASE_ANALYSIS_SERVICE_CATALOGO;

/* ⚠ PROVISIONALES CON IP */
const PRICING_IP_BASE = process.env.NEXT_PUBLIC_PRICING_IP_BASE;

/* ──────────────────────────────
   Tipos
────────────────────────────── */

/* ===== Historial mensual por SKU ===== */

export type HistorialMensualSkuItem = {
    tienda: string;
    enero: number;
    febrero: number;
    marzo: number;
    abril: number;
    mayo: number;
    junio: number;
    julio: number;
    agosto: number;
    septiembre: number;
    octubre: number;
    noviembre: number;
    diciembre: number;
};

export type HistorialMensualSkuResponse = {
    success: boolean;
    sku: string;
    nombre: string;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    data: HistorialMensualSkuItem[];
};

/* ===== Historial global (dispersión competencia) ===== */

export type HistorialGlobalItem = {
    tienda: string;
    enero: number;
    febrero: number;
    marzo: number;
    abril: number;
    mayo: number;
    junio: number;
    julio: number;
    agosto: number;
    septiembre: number;
    octubre: number;
    noviembre: number;
    diciembre: number;
};

export type HistorialGlobalResponse = {
    success: boolean;
    data: HistorialGlobalItem[];
};

/* ===== Producto análisis ===== */

export type ProductoAnalisis = {
    producto: {
        sku: string;
        nombre: string;
        marca: string;
        categoria: string;
        precio: number;
        url: string | null;
        urlMimbral: string | null;
        urlMarketplace: string | null;
        marketplace: string | null;
        posicion: string;
        totalVentas: number;
        mlId: string | null;
        margenPesos: number | null;
        margenPorcentaje: number | null;
        stockML: number | null;
        fechaActualizacionML: string | null;
    };
    competidores: {
        competidor: string;
        precioCompetencia: number;
        precioMimbral: number;
        deltaPorcentual: number;
        estadoCompetencia: string;
        rangoDelta: string;
        posicion: string;
        url: string;
        fechaActualizacion: string;
    }[];
    analisis: {
        cantidadCompetidores: number;
        cantidadMasBaratos: number;
        posicion: number;
    };
};

/* ===== Catálogo ===== */

export type CatalogProduct = {
    Image: string | null;
    Name: string;
    ItemCode: string;
    Category: string | null;
    Brand: string | null;
    Status: string;
};

/* ──────────────────────────────
   Hook API
────────────────────────────── */

export function usePricingMonitorCompetenciaApi() {
    const { fetchWithAuth } = useFetchWithAuth();

    /* =====================================================
       CATÁLOGO (CON TOKEN)
    ===================================================== */

    const searchProductosByNombre = async (
        name: string,
        page = 1,
        pageSize = 10
    ) => {
        const qs = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
            name,
        });

        return fetchWithAuth(
            `catalog/products?${qs.toString()}`,
            { cache: "no-store" }
        );
    };

    const searchProductosBySku = async (
        sku: string,
        page = 1,
        pageSize = 10
    ) => {
        const qs = new URLSearchParams({
            page: String(page),
            pageSize: String(pageSize),
            itemCode: sku,
        });

        return fetchWithAuth(
            `catalog/products?${qs.toString()}`,
            { cache: "no-store" }
        );
    };

    /* =====================================================
       SAFE FETCH
    ===================================================== */

    const safeFetch = async (url: string) => {
        const res = await fetch(url, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
        });

        const contentType = res.headers.get("content-type") ?? "";
        const text = await res.text();

        if (!res.ok) {
            throw new Error(`Error ${res.status} - ${text || "Error desconocido"}`);
        }

        if (!contentType.toLowerCase().includes("application/json")) {
            throw new Error(`Error: respuesta no JSON en ${url}`);
        }

        try {
            return JSON.parse(text);
        } catch {
            throw new Error(`Error: JSON invalido en ${url}`);
        }
    };

    /* =====================================================
       PRICING ANALISIS
    ===================================================== */

    const getProductoPricingAnalisis = async (
        sku: string
    ): Promise<{
        success: boolean;
        data: ProductoAnalisis;
    }> => {
        const url = `${PRICING_BASE_URL_CATALOGO}/pricing/productos/${sku}`;
        return safeFetch(url);
    };

    /* =====================================================
       HISTORIAL MENSUAL SKU (IP PROVISIONAL)
    ===================================================== */

    const getHistorialMensualSku = async (
        sku: string,
        anio = 2026
    ): Promise<HistorialMensualSkuResponse> => {

        const url = `${PRICING_IP_BASE}/pricing/productos/${sku}/historial?anio=${anio}&mockData=true&mockSeed=demo1`;

        console.log("→ GET Historial SKU:", url);

        return safeFetch(url);
    };

    /* =====================================================
       HISTORIAL GLOBAL DISPERSIÓN (IP PROVISIONAL)
    ===================================================== */

    const getHistorialGlobal = async (
        anio = 2026
    ): Promise<HistorialGlobalResponse> => {

        const url = `${PRICING_BASE_URL_CATALOGO}/analisis/precios/historial-global?anio=${anio}&mockData=true&mockSeed=demo-global`;

        console.log("→ GET Historial Global:", url);

        return safeFetch(url);
    };

    return {
        searchProductosByNombre,
        searchProductosBySku,
        getProductoPricingAnalisis,
        getHistorialMensualSku,
        getHistorialGlobal,
    };
}


// =============== GET LISTADO DE PRODUCTOS =============== 

const BASE_URL = BASE_ANALYSIS_SERVICE_CATALOGO;

async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: "no-store" });
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();

    if (!res.ok) {
        throw new Error(`Error ${res.status} en ${url}`);
    }

    if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error(`Respuesta no JSON en ${url}`);
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        throw new Error(`JSON invalido en ${url}`);
    }
}

/* --- Tipos que devuelve el backend actualmente --- */

interface CanalApi {
    canalPropio: string;
    precioPropio: number | null;
    posicion: string;
    margenPorcentaje: number | null;
    margenPesos: number | null;
    masBarato: { competidor: string; precio: number } | null;
    competidores: unknown[];
    tiendasGrandes?: unknown[];
}

interface PricingProductoRaw {
    sku: string;
    nombre: string;
    marca: string;
    categoria: string;
    urlImagen: string | null;
    totalVentas: number | null;
    ventasPorCanal: unknown;
    canales: CanalApi[];
}

interface PricingListadoRawResponse {
    success: boolean;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    data: PricingProductoRaw[];
}

/* --- Tipo normalizado que consume la vista --- */

export interface PricingProductoApi {
    sku: string;
    nombre: string;
    marca: string;
    categoria: string;
    precioMimbral: number;
    stockMimbral: number;
    precioMinCompetencia: number;
    posicion: string;
    status: string;
    competidorMasBarato: string;
    urlMimbral: string;
    marketplace: string;
    url_imagen: string;
}

export interface PricingListadoResponse {
    success: boolean;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    data: PricingProductoApi[];
}

/* --- Helpers de transformación --- */

function pickPrimaryCanal(canales: CanalApi[]): CanalApi | undefined {
    return canales.find((c) => c.canalPropio === "VTEX") ?? canales[0];
}

function computeStatus(
    precioPropio: number | null,
    precioMinCompetencia: number | null,
    posicion: string
): string {
    const pos = parseInt(posicion, 10);
    if (pos === 1) return "Más Barato";

    if (precioPropio && precioMinCompetencia && precioMinCompetencia > 0) {
        const diff = (precioPropio - precioMinCompetencia) / precioMinCompetencia;
        if (diff <= 0.10) return "Competitivo";
        return "Muy Caro";
    }

    return "Sin datos";
}

function mapRawToApi(raw: PricingProductoRaw): PricingProductoApi {
    const canal = pickPrimaryCanal(raw.canales);

    const precioPropio = canal?.precioPropio ?? 0;
    const precioMin = canal?.masBarato?.precio ?? 0;
    const posicion = canal?.posicion ?? "N/A";

    return {
        sku: raw.sku,
        nombre: raw.nombre,
        marca: raw.marca,
        categoria: raw.categoria,
        precioMimbral: precioPropio,
        stockMimbral: 0,
        precioMinCompetencia: precioMin,
        posicion,
        status: computeStatus(precioPropio, precioMin, posicion),
        competidorMasBarato: canal?.masBarato?.competidor ?? "",
        urlMimbral: "",
        marketplace: canal?.canalPropio ?? "",
        url_imagen: raw.urlImagen ?? "",
    };
}

/* --- Función pública --- */

export async function getPricingProductos(params: {
    page?: number;
    pageSize?: number;
    marca?: string;
    categoria?: string;
    sku?: string;
}): Promise<PricingListadoResponse> {
    const query = new URLSearchParams();

    if (params.page) query.append("page", String(params.page));
    if (params.pageSize) query.append("pageSize", String(params.pageSize));
    if (params.marca) query.append("marca", params.marca);
    if (params.categoria) query.append("categoria", params.categoria);
    if (params.sku) query.append("sku", params.sku);

    const raw = await fetchJSON<PricingListadoRawResponse>(
        `${BASE_URL}/pricing/productos?${query.toString()}`
    );

    return {
        success: raw.success,
        page: raw.page,
        pageSize: raw.pageSize,
        total: raw.total,
        totalPages: raw.totalPages,
        data: raw.data.map(mapRawToApi),
    };
}
