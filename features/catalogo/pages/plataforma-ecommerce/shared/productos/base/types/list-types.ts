// features/catalogo/pages/plataforma-ecommerce/shared/productos/base/types/list-types.ts

export interface CategoriaMarketplace {
    id: string;
    /**
     * Nombre humano de la categoría (cuando el backend pudo resolverlo).
     * Backend ML lo popula via `item.category_name`, `item.category.name` o
     * via lookup local `mlGetPath(category_id)`. Puede faltar si la categoría
     * no está cacheada — en ese caso el front cae al `id`.
     */
    nombre?: string;
}

export interface SapInfo {
    n3_id: string;
    n3_nombre: string;
    n2_nombre: string;
    n1_nombre: string;
}

export interface MapeoInfo {
    categoria_id: string;
    categoria_nombre: string;
    confianza: number;
    validado: boolean;
}

/**
 * Score oficial de calidad de ML (endpoint `GET /item/:id/performance`).
 *
 * Lo persiste el worker `performance-refresh.runner.js` del meli-catalog-service
 * en `ml_skus.performance_*` cada 6 horas, Y se actualiza via lazy refresh
 * cuando el seller abre un SKU en el Editor (endpoint `/calidad` updatea de paso).
 *
 * El endpoint `/api/pim/productos` lo enriquece sin hacer N+1 calls a ML.
 *
 * Puede faltar (`undefined` o `null` campos):
 *   - SKU recién publicado que el worker aún no procesó
 *   - SKU no presente en `ml_skus` (publicado fuera del PIM, ej. Multivende)
 *   - ML aún no calculó el score (publicación sin tráfico/tiempo)
 *
 * Cuando falta, la UI muestra "Sin score" — NUNCA inventamos un valor.
 *
 * NOTA sobre `buckets`: ML devuelve también `buckets[]` con las acciones
 * pendientes/completadas pero NO se persisten en `ml_skus` (cambian seguido
 * y serían ~80 MB). El Editor las consume via live-fetch al endpoint
 * `/calidad` cuando el seller abre el SKU.
 */
export interface ProductPerformance {
    /** Score 0-100 oficial ML. */
    score: number;
    /** Nivel categórico oficial: Bad / Medium / Good. */
    level?: "Bad" | "Medium" | "Good" | null;
    /**
     * Nivel localizado al site del seller. Para MLC/MLA:
     * "Básica" (Bad) | "Estándar" (Medium) | "Profesional" (Good).
     * Útil para mostrar el wording oficial de ML en el Editor.
     */
    level_wording?: string | null;
    /** Cuándo ML calculó este score (no cuándo lo sincronizamos). ISO 8601. */
    calculated_at?: string | null;
    /** Cuándo el worker `performance-refresh` corrió por última vez para este ítem. ISO 8601. */
    synced_at?: string | null;
}

export interface MarketplaceProduct {
    item_id: string;
    sku: string;
    seller_sku?: string;
    titulo: string;
    url_producto: string;
    precio: number;
    /**
     * Precio original (sin descuento) cuando hay oferta activa. Lo expone el
     * backend desde `item.original_price` de la API ML — gratis, sin extra
     * fetch. Si no hay oferta, viene `null`.
     *
     * Importante: en el listing solo se detectan ofertas "baratas":
     *   - catalog discount / loyalty / tienda oficial (item.original_price > price)
     *   - deals oficiales ML (Hot Sale, CyberDay) vía `deal_ids`
     * Las seller promotions privadas solo se enriquecen en el detalle.
     */
    precio_original?: number | null;
    /** True si el listing detectó algún tipo de oferta (catalog / loyalty / deal ML). */
    tiene_oferta?: boolean;
    /** Precio vivo de oferta cuando ML expone sale_price o seller promotion. */
    oferta_precio?: number | null;
    /** Precio base/original asociado a la oferta. */
    oferta_precio_orig?: number | null;
    /** Porcentaje de descuento redondeado, derivado de `precio_original` vs `precio`. */
    oferta_pct?: number | null;
    stock: number;
    estado: string;
    /**
     * Sub-estados crudos de ML que acompañan a `estado`. Según la guía oficial
     * "Gestionar Moderaciones" de Mercado Libre, los códigos relevantes son:
     *   - `forbidden`                 → Ítem inhabilitado por ML
     *   - `held`                      → Inactiva, en revisión por ML
     *   - `suspended`                 → Suspendida por riesgo de fraude
     *   - `suspended_for_prevention`  → Suspendida por prevención
     *   - `pending_documentation`     → Denuncia de Brand Protection Program
     *   - `waiting_for_patch`         → Pausada por infracciones (acción del vendedor)
     *   - `picture_download_pending`  → Procesando imagen subida por URL
     *   - `picture_downloading_pending` → Idem (variante de spelling de ML)
     *   - `pending_review`            → ML revisando
     *   - `warning`                   → Con advertencia de moderación
     *   - `out_of_stock`              → Sin stock
     *   - `expired`                   → Expirada
     *
     * Útil para tooltip explicativo y para relabel cuando ML usa `under_review`
     * como puerta a un cierre por moderación.
     */
    sub_status?: string[];
    /**
     * Tags crudos del item ML. Acá interesan los de moderación:
     *   - `moderation_penalty`     → Penalizada por ML (precio inusual / sin ventas)
     *   - `poor_quality_thumbnail` → Foto de portada de baja calidad
     * El resto se ignora (hay decenas de tags ML internos sin valor de UI).
     */
    tags?: string[];
    imagenes: string[];
    categoria_marketplace: CategoriaMarketplace | null;
    sap: SapInfo | null;
    mapeo: MapeoInfo | null;
    coincide: boolean | null;
    /**
     * Score real de calidad de ML cuando está disponible en el cache de
     * `ml_skus`. Undefined cuando el worker aún no procesó este ítem o ML
     * todavía no calculó score. Ver `ProductPerformance` para detalles.
     */
    performance?: ProductPerformance;
    /**
     * Indica que esta publicación usa el catálogo compartido de ML
     * (`catalog_listing=true` en la API ML). El content (título, fotos,
     * atributos) viene de la ficha de catálogo, no del seller. ML NO calcula
     * `/item/:id/performance` para estos items (devuelve null/404), porque
     * el score del listing del seller no aplica — solo el del catálogo.
     *
     * El front lo usa para diferenciar el badge:
     *   - `is_catalog_listing=true` + `performance=undefined` → badge azul "Catálogo"
     *   - `is_catalog_listing=false` + `performance=undefined` → badge gris "Sin score"
     *   - `performance` presente → pill verde/ámbar/rojo según level
     */
    is_catalog_listing?: boolean;
    /**
     * Falabella: content score (0-100) del producto en Sellercenter
     * (`GetContentScore`). Define el destino de la publicación: ≥71 aprobación
     * automática, 30-70 revisión manual (≤2 días), <30 rechazo automático. ML
     * NO lo usa (ML usa `performance.score`). Lo expone el catálogo Model B
     * (`fal_skus.content_score` vía `shapeFalSkuRow`).
     */
    content_score?: number | null;
    /**
     * Falabella: estado del control de calidad de contenido (QC) en Sellercenter
     * (`GetProducts.QCStatus`): "approved" | "pending" | "rejected". Complementa
     * `content_score` — el score puede ser alto pero el QC haber rechazado por
     * otra razón. ML no lo usa.
     */
    qc_status?: string | null;
}

export interface MarketplaceProductsAPIResponse {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    marketplace: string;
    fromCache: boolean;
    data: MarketplaceProduct[];
}
