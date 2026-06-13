// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/types/dashboard-types.ts
//
// Tipos del dominio Dashboard. Backend canónico: `GET /api/pim/dashboard`
// (ver `pim-service/src/routes/dashboard.routes.js`).
//
// NOTA: el endpoint actual NO acepta filtro por marketplace — devuelve datos
// agregados con split ML/Falabella en `kpis.published_ml/published_fala`. La
// view filtra por marketplace en cliente cuando aplica.

export interface DashboardKpis {
    /** Total de publicaciones activas. */
    published: number;
    published_ml: number;
    published_fala: number;
    /** Cantidad de errores recientes. */
    errors: number;
    /** Lotes de carga masiva no completados. */
    batches: number;
    /** Acciones pendientes (TBD backend — siempre 0 por ahora). */
    pending: number;
}

export interface DashboardBatch {
    id: string;
    name: string;
    total: number;
    done: number;
    status: string;
}

export interface DashboardProduct {
    sku: string;
    title: string;
    canal: "ml" | "fala" | (string & {});
    /** ISO date string (`last_updated` / `UpdatedAt` / null). */
    when: string | null;
}

export interface DashboardResponse {
    kpis: DashboardKpis;
    batches: DashboardBatch[];
    products: DashboardProduct[];
    /** ISO timestamp de cuándo el backend generó la respuesta. */
    generated_at: string;
}
