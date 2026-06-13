// app\fetchWithAuth\api-catalogo\apis-monitor-competencia\api-general-monitor-competencia.ts

import { fetchJson as fetchJSON } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE } from "@/lib/http/endpoints";

const BASE_URL = BASE_ANALYSIS_SERVICE;

/* ──────────────────────────────
   Helpers
────────────────────────────── */
function qs(params: Record<string, any>) {
    const q = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "Todas")
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    return q ? `?${q}` : "";
}

/* ──────────────────────────────
   KPIs Generales
────────────────────────────── */
export type GeneralKpis = {
    productos_lider: number;
    productos_posicion_2: number;
    productos_posicion_3: number;
    productos_posicion_4plus: number;
    productos_alta_saturacion: number;
    productos_media_saturacion: number;
    productos_baja_saturacion: number;
    productos_sin_competencia: number;
    posicion_promedio_general: number;
    margen_promedio_general: number;
    total_productos: number;
    con_competencia: number;
    porcentaje_lider: number;
    porcentaje_posicion_2: number;
    porcentaje_posicion_3: number;
    porcentaje_posicion_4plus: number;
};

export async function getGeneralKpis(filters: { canal?: string }) {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/general/kpis${qs(filters)}`
    );

    const d = res.data;

    return {
        productos_lider: d.productoslider,
        productos_posicion_2: d.productosposicion2,
        productos_posicion_3: d.productosposicion3,
        productos_posicion_4plus: d.productosposicion4plus,
        productos_alta_saturacion: d.productosaltasaturacion,
        productos_media_saturacion: d.productosmediasaturacion,
        productos_baja_saturacion: d.productosbajasaturacion,
        productos_sin_competencia: d.productossincompetencia,
        posicion_promedio_general: d.posicionpromediogeneral,
        margen_promedio_general: d.margenpromediogeneral,
        total_productos: d.totalproductos,
        con_competencia: d.concompetencia,
        porcentaje_lider: d.porcentajelider,
        porcentaje_posicion_2: d.porcentajeposicion2,
        porcentaje_posicion_3: d.porcentajeposicion3,
        porcentaje_posicion_4plus: d.porcentajeposicion4plus,
    } as GeneralKpis;
}

/* ──────────────────────────────
   Historial global de precios (gráfico)
────────────────────────────── */
export type HistorialPreciosRow = {
    fecha: string;
    [tienda: string]: number | string;
};

export async function getHistorialPreciosGlobal(filters: {
    canal?: string;
    categoria?: string;
}) {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/precios/historial-global${qs(filters)}`
    );
    return Array.isArray(res.data) ? res.data : [];
}

/* ──────────────────────────────
   Dominancia y cobertura de competidores
────────────────────────────── */
export type DominanciaCompetidor = {
    competidor: string;
    ganados_por_competencia: number;
};

export async function getDominanciaCompetidores(filters: { canal?: string }) {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/competidores${qs(filters)}`
    );

    return (res.data || []).map((d: any) => ({
        competidor: d.competidor,
        ganados_por_competencia: d.ganadosporcompetencia,
    })) as DominanciaCompetidor[];
}

export type CoberturaItem = {
    competidor: string;
    porcentaje: number;
    total: number;
};

export async function getCoberturaProductos(filters: { canal?: string }) {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/competidores/cobertura/productos${qs(filters)}`
    );

    return (res.data || []).map((d: any) => ({
        competidor: d.competidor,
        porcentaje: d.porcentajecobertura,
        total: d.productoscoincidentes,
    })) as CoberturaItem[];
}

export async function getCoberturaCategorias(filters: { canal?: string }) {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/competidores/cobertura/categorias${qs(filters)}`
    );

    return (res.data || []).map((d: any) => ({
        competidor: d.competidor,
        porcentaje: d.porcentajecoberturacategorias,
        total: d.categoriascompartidas,
    })) as CoberturaItem[];
}

export async function getCoberturaMarcas(filters: { canal?: string }) {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/competidores/cobertura/marcas${qs(filters)}`
    );

    return (res.data || []).map((d: any) => ({
        competidor: d.competidor,
        porcentaje: d.porcentajecoberturamarcas,
        total: d.marcascompartidas,
    })) as CoberturaItem[];
}
