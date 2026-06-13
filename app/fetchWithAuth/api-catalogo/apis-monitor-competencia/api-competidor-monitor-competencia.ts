// app\fetchWithAuth\api-catalogo\apis-monitor-competencia\api-competidor-monitor-competencia.ts

import { fetchJson as fetchJSON } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE } from "@/lib/http/endpoints";

const BASE_URL = BASE_ANALYSIS_SERVICE;

/* ──────────────────────────────
   Tipos
────────────────────────────── */
export type CompetidorResumenApi = {
    Competidor: string;
    SKUsComparables: number;
    SKUsEllosMasBarato: number;
    SKUsEmpate: number;
    SKUsNosotrosMasBarato: number;
    DeltaPromedioPorcentaje: number;
};

export async function getCompetidoresResumen(): Promise<CompetidorResumenApi[]> {
    const res = await fetchJSON<any>(`${BASE_URL}/monitor/competidor`);
    return res.data;
}

/* ──────────────────────────────
   Detalle por competidor
────────────────────────────── */

export type CompetidorDetalleApi = {
    Competidor: string;
    SKUsComparables: number;
    SKUsEllosMasBarato: number;
    SKUsEmpate: number;
    SKUsNosotrosMasBarato: number;
    PorcEllosMasBarato: number;
    PorcNosotrosMasBarato: number;
    PrecioPromedioNuestro: number;
    PrecioPromedioEllos: number;
    DeltaPromedioPorcentaje: number;
    SKUsSomosSegundo: number;
    Estrategia: string;
};

export async function getCompetidorDetalle(
    competidor: string
): Promise<CompetidorDetalleApi | null> {
    const res = await fetchJSON<any>(
        `${BASE_URL}/monitor/competidor?competidor=${encodeURIComponent(
            competidor
        )}`
    );

    return res.data?.[0] || null;
}

/* ──────────────────────────────
   (Preparados para siguientes vistas)
────────────────────────────── */
export async function getProductosComparables(
    competidor: string
): Promise<any> {
    const res = await fetchJSON<any>(
        `${BASE_URL}/monitor/competidor/${competidor}/productos-comparables`
    );
    return res.data;
}

export async function getCatalogoCompartido(
    competidor: string
): Promise<any> {
    const res = await fetchJSON<any>(
        `${BASE_URL}/monitor/competidor/${competidor}/catalogo-compartido`
    );
    return res.data;
}

export async function getCambiosPrecio(): Promise<any> {
    const res = await fetchJSON<any>(
        `${BASE_URL}/monitor/competidor/cambios-precio`
    );
    return res.data;
}
