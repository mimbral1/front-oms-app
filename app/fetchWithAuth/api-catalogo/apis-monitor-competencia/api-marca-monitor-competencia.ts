// app\fetchWithAuth\api-catalogo\apis-monitor-competencia\api-marca-monitor-competencia.ts

import { fetchJson as fetchJSON } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE } from "@/lib/http/endpoints";

const BASE_URL = BASE_ANALYSIS_SERVICE;

/* ──────────────────────────────
   Tipos
────────────────────────────── */
export type MarcaResumenApi = {
    marca: string;
    total_skus: number;
    skus_mas_baratos: number;
    skus_segundos_mas_baratos: number;
    skus_bajo_margen: number;
    skus_sobre_marginados: number;
    skus_excesivamente_baratos: number;
};

export type MarcaResumenResponse = {
    success: boolean;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    data: MarcaResumenApi[];
};

/* ──────────────────────────────
   Categorías por marca
────────────────────────────── */

export type CategoriasPorMarcaResponse = {
    success: boolean;
    marca: string;
    data: string[];
    total: number;
    page: number;
    pageSize: number;
};

export async function getResumenMarcas(
    page: number = 1,
    pageSize: number = 10
): Promise<MarcaResumenResponse> {
    return fetchJSON<MarcaResumenResponse>(
        `${BASE_URL}/analisis/monitor/marcas?page=${page}&pageSize=${pageSize}`
    );
}

export async function getCategoriasPorMarca(
    marca: string
): Promise<CategoriasPorMarcaResponse> {
    return fetchJSON<CategoriasPorMarcaResponse>(
        `${BASE_URL}/filtros/categorias-por-marca?marca=${encodeURIComponent(marca)}`
    );
}
