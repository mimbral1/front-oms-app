// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/types/catalogo-types.ts
//
// Tipos del dominio Catálogo (vista alternativa al `productos/` legacy con
// chrome Janis). Re-exporta los shapes ya consumidos por
// `shared/productos/base/types/list-types.ts` para no duplicar contratos.

export type {
    MarketplaceProduct,
    MarketplaceProductsAPIResponse,
    CategoriaMarketplace,
    SapInfo,
    MapeoInfo,
    ProductPerformance,
} from "../../../productos/base/types/list-types";

/**
 * Status filter del dropdown del toolbar.
 *
 * Mapeo a estados ML reales (en `catalogo-api.ts:mapStatusFilter`):
 *   activos       → "active"           (publicación viva)
 *   pausados      → "paused"           (vendedor pausó)
 *   cerrados      → "closed"           (vendedor o ML cerró)
 *   en-revision   → "under_review"     (ML revisando, puede ser forbidden)
 *   sin-publicar  → "draft"            (legacy, no es status ML canónico)
 *   con-errores   → "error"            (legacy, ML no expone un status así directo)
 *   todos         → (sin filter)
 *
 * "draft" + "error" se mantienen por compat — el backend puede ignorarlos.
 */
export type CatalogoStatusFilter =
    | "todos"
    | "activos"
    | "pausados"
    | "cerrados"
    | "en-revision"
    | "sin-publicar"
    | "con-errores";

/**
 * Reputation traffic-light tag — visual concept del mockup `catalogo.html`.
 *
 * NOTA: el backend NO expone un campo `rep` directamente. La derivamos
 * heurísticamente desde `estado`, `stock` y otras señales en `CatalogoTable`.
 */
export type ReputationLevel = "green" | "yellow" | "red";

/**
 * Filtro de Calidad del toolbar — además de los 3 levels (green/yellow/red),
 * agregamos:
 *   - `"todas"`     → muestra todo **excepto** items con `is_catalog_listing=true`
 *                     (default; los items de catálogo se ven solo cuando el
 *                     usuario filtra explícito).
 *   - `"catalogo"`  → muestra **solo** items con `is_catalog_listing=true`.
 *
 * Los items catalog_listing son publicaciones que usan la ficha compartida de
 * ML — Mimbral los publica masivamente para ganar exposición. ML no calcula
 * performance del listing (el content es de ML, no del seller). Si los
 * mostráramos junto con las clásicas, "ensucian" la vista: el usuario solo
 * ve "Catálogo" gris/azul en la mayoría de las filas. Por eso default oculto.
 */
export type ReputationFilter = ReputationLevel | "todas" | "catalogo";

/** Filtros del toolbar — usados para query params y filtering local. */
export interface CatalogoListFilters {
    search?: string;
    status?: CatalogoStatusFilter;
    /** Si se pasa, filtra por categoría ML (TBD si el backend acepta este param). */
    categoryId?: string;
    /** Filtro de Calidad — incluye "todas" (excl. catálogo) y "catalogo" (solo catálogo). */
    reputation?: ReputationFilter;
    page?: number;
    pageSize?: number;
}

/** Modo de visualización (lista vs grid). */
export type CatalogoViewMode = "list" | "grid";
