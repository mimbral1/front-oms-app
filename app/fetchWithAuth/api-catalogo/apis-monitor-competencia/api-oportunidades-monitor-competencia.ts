// app\fetchWithAuth\api-catalogo\apis-monitor-competencia\api-oportunidades-monitor-competencia.ts

import { fetchJson as fetchJSON } from "@/lib/http/client";
import { BASE_ANALYSIS_SERVICE } from "@/lib/http/endpoints";

const BASE_URL = BASE_ANALYSIS_SERVICE;

/* ──────────────────────────────
   Resumen general
────────────────────────────── */
export type ResumenOportunidades = {
    TotalProductos: number;
    OportunidadesMargen: number;
    OportunidadesCrecimiento: number;
    ProductosExclusivos: number;
    OportunidadesOutOfStock: number;
    ValorPotencialMargen: number;
    PorcOportunidadesMargen: number;
    PorcOportunidadesCrecimiento: number;
    PorcProductosExclusivos: number;
};

export type OportunidadesPorCompetidor = {
    Competidor: string;
    ProductosComparables: number;
    NosotrosMasBarato: number;
    EllosMasBarato: number;
    OportunidadesMargen: number;
    ProductosSinStockEllos: number;
    ValorPotencialVsCompetidor: number;
};

export async function getResumenOportunidades(): Promise<{
    resumenGeneral: ResumenOportunidades;
    porCompetidor: OportunidadesPorCompetidor[];
}> {
    const res = await fetchJSON<any>(`${BASE_URL}/monitor/oportunidades`);
    return res.data;
}
