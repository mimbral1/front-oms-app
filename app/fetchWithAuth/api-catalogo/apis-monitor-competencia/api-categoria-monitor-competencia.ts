// app\fetchWithAuth\api-catalogo\apis-monitor-competencia\api-categoria-monitor-competencia.ts

import { fetchJson as fetchJSON } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE } from "@/lib/http/endpoints";

const BASE_URL = BASE_ANALYSIS_SERVICE;

/* ──────────────────────────────
   Tipos
────────────────────────────── */
export type CategoriaApi = {
    categoria: string;
    total_skus: number;
    skus_mas_baratos: number;
    skus_segundos_mas_baratos: number;
    skus_bajo_margen: number;
    skus_sobre_marginados: number;
    skus_excesivamente_baratos: number;
};

export type SubcategoriaApi = {
    categoria_padre: string;
    subcategoria: string;
    total_skus: number;
    skus_mas_baratos: number;
    skus_segundos_mas_baratos: number;
    skus_bajo_margen: number;
    skus_sobre_marginados: number;
    skus_excesivamente_baratos: number;
};


/* ──────────────────────────────
   Calls
────────────────────────────── */
export async function getCategoriasMonitor(): Promise<CategoriaApi[]> {
    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/monitor/categorias`
    );
    return res.data || [];
}

export async function getSubcategoriasMonitor(): Promise<SubcategoriaApi[]> {

    const res = await fetchJSON<any>(
        `${BASE_URL}/analisis/monitor/subcategorias`
    );
    return res.data || [];
}
