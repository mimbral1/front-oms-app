// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/types/editor-types.ts
//
// Tipos canonical del Editor de producto (Fase 7 del MIGRATION_PLAN).
//
// Reusa el shape de `ProductDetail` que ya consume `MarketplaceProductosDetail`
// y `useMarketplaceProductoDetailData`. Ese shape viene del endpoint legacy:
//
//   GET /api/pim/productos/:sku/detalle?marketplace=<ml|falabella|vtex>
//
// Estructura real (validada con `pim-service/Plataforma_Marketplace/public/editar.html`):
//   {
//     sku, seller_sku, item_id, url_producto, seller_custom_field,
//     campos_basicos: { titulo:{valor,editable,tipo}, precio:{...}, stock:{...}, ... },
//     atributos: [{ id, nombre, valor, editable, requerido, tipo, opciones }, ...],
//     imagenes: { lista: [url, ...], total, maximo, minimo_recomendado },
//     meta: { last_updated, tiene_ventas, sold_quantity, health, category_id, tags },
//   }

export type {
    CampoBasico as EditorCampoBasico,
    ProductoAtributo as EditorAtributo,
    ProductDetail as EditorProduct,
} from "../../../productos/base/types/detail-types";

/**
 * IDs de los 6 tabs del editor. Match al legacy `editar.html` (no usa los 9
 * del mockup `ml_producto_editor.html`):
 *   - info        → identificadores + campos_basicos + meta
 *   - imagenes    → grid de imágenes
 *   - descripcion → texto descriptivo (futuro: rich text)
 *   - atributos   → dynamic fields por categoría
 *   - calidad     → score + faltantes (endpoint /calidad)
 *   - logs        → audit_log de MELICATALOG_DB
 */
export type EditorTabId =
    | "info"
    | "imagenes"
    | "descripcion"
    | "atributos"
    | "calidad"
    | "publicaciones"
    | "logs";

/** Acciones del header del editor. */
export type EditorTopBarAction = "aplicar" | "guardar" | "guardar-y-nuevo" | "cancelar";

/**
 * Patch que se envía en `PUT /api/pim/productos/:sku`.
 * Sólo los campos modificados. `marketplace` siempre va.
 */
export interface EditorSavePatch {
    marketplace: string; // "ml" | "falabella" | "vtex"
    cambios: {
        titulo?: string;
        precio?: number;
        stock?: number;
        descripcion?: string;
        estado?: string;
        seller_custom_field?: string;
        imagenes?: string[];
        atributos?: Array<{
            id: string;
            valor?: unknown;
            value?: unknown;
            value_name?: string;
        }>;
        [key: string]: unknown;
    };
}

/** Resultado del PUT (lo que devuelve el backend). */
export interface EditorSaveResult {
    saved?: string[];
    warnings?: string[];
    message?: string;
    /**
     * Falabella: el ProductUpdate es ASÍNCRONO → el backend devuelve el
     * `feed_id` del feed Sellercenter (lo inyecta `fala-read.service.updateProducto`).
     * El editor monta una FeedStatusCard que lo pollea hasta resolverse.
     * En ML/VTEX no viene.
     */
    feed_id?: string;
    feed_action?: string;
}

/**
 * Una fila de la bitácora del producto (`dbo.fal_product_audit`, Falabella).
 * Shape crudo del backend: los campos JSON (`changed_fields`, `values_old/new`,
 * `response_raw`) llegan como string NVARCHAR — se parsean en el render.
 *
 * GET /api/pim/productos/:sku/audit?marketplace=falabella
 */
export interface EditorAuditEntry {
    id: number | string;
    sku: string;
    entity: string;
    /** UPDATE | INSERT | DELETE | PUBLISH | … */
    action: string;
    /** Etiqueta del ciclo de publicación: ENCOLADO | FEED_ENVIADO |
     *  SINCRONIZADO | RECHAZADO | ADVERTENCIA | TIMEOUT | PAUSADO | ACTUALIZADO.
     *  Null en filas legacy previas a la migración 029. */
    event_type?: string | null;
    changed_fields?: string | null;
    values_old?: string | null;
    values_new?: string | null;
    /** Respuesta de Sellercenter: */
    fala_action?: string | null;     // ProductUpdate | ProductCreate | FeedStatus
    fala_feed_id?: string | null;
    fala_request_id?: string | null;
    fala_status?: string | null;     // ok | error | sin-id
    fala_error?: string | null;
    payload_xml?: string | null;     // solo si includePayload=1
    response_raw?: string | null;    // solo si includePayload=1
    user_id?: number | null;
    user_name?: string | null;
    user_email?: string | null;
    request_id?: string | null;
    created_at: string;
}

/**
 * Check pasado (correcto) en la calidad. ML lo manda como string o
 * `{label}` corto/humano. Falabella manda objeto técnico con `metrica` y
 * `puntos` que enriquecemos antes de mostrar.
 */
export type EditorCalidadCheck =
    | string
    | {
          label?: string;
          mensaje?: string;
          text?: string;
          campo_id?: string;
          puntos?: number;
          metrica?: {
              valor?: number | string;
              unidad?: string;
              min?: number;
              max?: number;
          };
      };

/** Problema detectado en la calidad — link clickeable a una sección. */
export interface EditorCalidadProblema {
    mensaje: string;
    /** Sección a la que saltar (ej. "imgs", "desc"). Opcional. */
    seccion?: string;
}

/**
 * Resultado de `GET /api/pim/productos/:sku/calidad?marketplace=mp`.
 *
 * Shape distinto por marketplace:
 *   - ML usa `score` (0-100).
 *   - Falabella usa `content_score_falabella` (mismo rango).
 *
 * `nivel` es la etiqueta humana ("Bueno", "Excelente", etc).
 */
export interface EditorCalidad {
    score?: number;
    content_score_falabella?: number;
    nivel?: string;
    problemas?: EditorCalidadProblema[];
    checks_ok?: EditorCalidadCheck[];
    [key: string]: unknown;
}

/**
 * Una publicación ML de un SKU (junction ml_sku_items, contrato 3a).
 * GET /api/pim/canales/mercadolibre/productos/:sku/publicaciones → { publications: EditorPublicacion[] }
 */
export interface EditorPublicacion {
    itemId: string;
    isPrimary: boolean;
    isCatalogListing: boolean;
    catalogProductId: string | null;
    variationId: string | null;
    inventoryId: string | null;
    userProductId: string | null;
    itemStatus: string | null;    // active | paused | closed | under_review | inactive
    logisticType: string | null;  // fulfillment | self_service | cross_docking | ...
    publishStatus: string | null;
    performance: { score: number; level: string | null } | null;
}
