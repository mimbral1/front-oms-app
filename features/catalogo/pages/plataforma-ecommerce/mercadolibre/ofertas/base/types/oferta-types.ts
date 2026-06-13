// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/types/oferta-types.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/types.ts` (~233 LOC). Cambio respecto al legacy: agregamos los tipos
// auxiliares de UI (sub-tabs, detail tabs) que el OMS necesita para el chrome
// Janis pero no afectan el shape de la API.
//
// La fuente de verdad sobre las reglas de cada tipo de campaña ML (14 tipos,
// lifecycle, trampas) vive en pim-service/CLAUDE.md → "Promociones ML —
// gestión completa".

/**
 * Los 14 tipos de promoción ML soportados por /seller-promotions/*.
 * Discriminated union para que `switch (camp.type)` sea exhaustivo.
 *
 * Reglas resumidas (doc completa en CLAUDE.md → "Promociones ML"):
 *
 * - DEAL: invitación oficial ML (Hot Sale, CyberDay). Opt-in. No editable post-start.
 * - MARKETPLACE_CAMPAIGN: co-fondeada por ML. Vendedor acepta. No editable post-start.
 * - VOLUME: descuento por cantidad. Vendedor crea. Modificar = delete+create.
 * - DOD: oferta del día. Stock OBLIGATORIO. No editable post-start. Plazo en horas.
 * - LIGHTNING: oferta relámpago. Stock MANDATORIO. No se borra una vez started.
 * - PRE_NEGOTIATED: descuento acordado offline con agente comercial.
 * - SELLER_CAMPAIGN: vendedor crea + define. 5–80%, máx 14 días, soporta top_deal_price.
 * - SMART: candidatos refrescan diariamente. Co-fondeada automatizada.
 * - PRICE_MATCHING: precios competitivos co-fondeada. Vendedor acepta.
 * - PRICE_MATCHING_MELI_ALL: 100% ML. Opt-in automático. Vendedor solo desactiva.
 * - UNHEALTHY_STOCK: liquidación stock Full. Acuerdo offline previo.
 * - PRICE_DISCOUNT: descuento individual. Si hay DEAL activo, queda en stand-by. 14 días máx.
 * - SELLER_COUPON_CAMPAIGN: cupones (solo MLB).
 * - BANK: descuento por método de pago (ej. Pix). ML define.
 */
export type MLPromotionType =
    | "DEAL"
    | "MARKETPLACE_CAMPAIGN"
    | "VOLUME"
    | "DOD"
    | "LIGHTNING"
    | "PRE_NEGOTIATED"
    | "SELLER_CAMPAIGN"
    | "SMART"
    | "PRICE_MATCHING"
    | "PRICE_MATCHING_MELI_ALL"
    | "UNHEALTHY_STOCK"
    | "PRICE_DISCOUNT"
    | "SELLER_COUPON_CAMPAIGN"
    | "BANK";

/**
 * Códigos de error ML que esta UI sabe interpretar. Mapeados a mensajes
 * humanos en `helpers/error-map.ts`. Cuando ML devuelve un código distinto,
 * el caller hace fallback al `message` raw del error response.
 */
export type MLErrorCode =
    | "ERROR_CREDIBILITY_DISCOUNTED_PRICE"
    | "buyer_discount_not_in_range"
    | "best_buyer_discount_not_in_range"
    | "discount_below_10_percent_difference"
    | "discount_below_5_percent_difference"
    | "error_credibility_price"
    | "TOP_DEAL_LOCKED"
    | "CAMPAIGN_TOO_LONG"
    | "NAME_DUPLICATED"
    | "PRICE_ONLY_BETTER"
    | "STOCK_INSUFFICIENT"
    | "PROMO_CONFLICT"
    | "REPUTATION_NOT_GREEN"
    | "ENTITY_LOCKED"
    | "TOO_MANY_REQUESTS"
    | "MISSING_PROMOTION_TYPE"
    | "UPSTREAM_TIMEOUT"
    | "UPSTREAM_UNREACHABLE";

export type Channel = "ml" | "fala";

export type Reputation = "green" | "yellow" | "red";

export type CampaignStatus =
    | "active"
    | "scheduled"
    | "ended"
    | "paused"
    | "draft";

/** Sub-tab de OfertasListView (UI-only). */
export type OfertasTab = "activas" | "finalizadas" | "disponibles";

/** Tab del detalle de una oferta (UI-only). */
export type OfertaDetailTab =
    | "resumen"
    | "items"
    | "cofinanciacion"
    | "calendario"
    | "plataformas";

/**
 * Rango "creíble" que ML devuelve por SKU dentro de un response de
 * `listPromotionItems`. ML lo calcula con el historial del item; es
 * **por item, no por campaña** (un mismo MLC tiene el mismo rango en todas
 * las promos en las que participa).
 *
 * Solo expuesto vía `/seller-promotions/promotions/:id/items` —
 * `/api/pim/productos` no lo trae. Por eso lo cacheamos cuando lo vemos
 * pasar y el modal de inscripción lo lee de ahí en lugar de los fallbacks
 * inventados de `normalizeCatalogSku`.
 */
export interface MlItemRange {
    readonly original_price: number;
    readonly min_discounted_price: number;
    readonly max_discounted_price: number;
    /** Puede ser null — ML lo omite si no tiene historial suficiente. */
    readonly suggested_discounted_price: number | null;
}

/**
 * SKU del catálogo con rangos sugeridos por ML para cada item.
 * `min/max/suggested_discounted_price` los devuelve la API ML por invitación.
 */
export interface CatalogSku {
    readonly sku: string;
    readonly item_id?: string | null;
    readonly name: string;
    readonly price: number;
    readonly stock: number;
    readonly image: string | null;
    readonly min_discounted_price: number;
    readonly max_discounted_price: number;
    readonly suggested_discounted_price: number;
    readonly reputation: Reputation;
    readonly has_active_promo: boolean;
}

/** SKU dentro de una campaña activa (precio y stock comprometidos). */
export interface CampaignSku {
    /**
     * `item_id` ML (`MLC...`) — único por publicación. Se usa como key estable
     * en listas porque el `sku` SAP del seller puede repetirse cuando hay
     * variantes o catalog listings que apuntan al mismo SKU desde distintos
     * `item_id`.
     */
    readonly item_id: string;
    readonly sku: string;
    readonly name: string;
    readonly price: number;
    readonly stock: number;
    readonly image?: string | null;
    readonly discount: number;
    readonly new_price: number;
    readonly override: boolean;
    readonly status:
        | "active"
        | "paused"
        | "finished"
        | "candidate"
        | "pending"
        | "sync_requested"
        | "restore_requested";
    readonly top_deal?: number;
    readonly stock_committed?: number | null;
}

/**
 * Campaña ya inscrita / creada. Las fechas pueden venir como string si recién
 * se hidrataron de localStorage; los helpers revivers las convierten a Date.
 */
export interface Campaign {
    readonly id: string;
    readonly name: string;
    readonly channel: Channel;
    readonly type?: MLPromotionType;
    readonly official_id?: string;
    readonly start_date: Date | string | null;
    readonly end_date: Date | string | null;
    readonly global_discount?: number;
    readonly skus: ReadonlyArray<CampaignSku>;
    readonly skus_count?: number;
    readonly sales_so_far?: number;
    readonly stock_committed?: number;
    readonly avg_discount?: number;
    readonly paused: boolean;
    readonly draft: boolean;
    /** Cofinanciación SMART/MARKETPLACE_CAMPAIGN: % a cargo del seller. */
    readonly seller_percentage?: number;
    /** Cofinanciación: % a cargo de ML. */
    readonly meli_percentage?: number;
}

/**
 * Campaña oficial ML disponible (que el vendedor puede aceptar / inscribirse).
 */
export interface MLAvailable {
    readonly id: string;
    readonly name: string;
    readonly desc: string;
    readonly icon: string;
    readonly iconClass?: string;
    readonly type: MLPromotionType;
    readonly start_date: Date | string;
    readonly end_date: Date | string;
    readonly duration_hours?: number;
    readonly min_discount: number;
    readonly max_discount: number;
    readonly eligible_categories: ReadonlyArray<string>;
    readonly eligible_skus: ReadonlyArray<string>;
    readonly enrolled: boolean;
    readonly enrolled_count?: number;
    readonly locked_after_start: boolean;
    readonly requires_stock: boolean;
    readonly min_stock_required?: number;
    readonly supports_top_deal: boolean;
}

/**
 * Invitación ML donde el fetch de items falló (ML 500, timeout, network).
 * NO la mezclamos con `ml_available` con `eligible_skus: []` porque confunde
 * — el user no sabría si es "ML aún no calificó" o "ML está roto". En su
 * lugar va a una sección separada con badge de error y botón retry.
 */
export interface MLFailedInvitation {
    readonly id: string;
    readonly name: string;
    readonly type: MLPromotionType;
    readonly start_date: Date | string;
    readonly end_date: Date | string;
    readonly errorCode: string | null;
    readonly errorMessage: string;
}

/** Estado raíz que vive en memoria/localStorage. */
export interface OfertasState {
    readonly campaigns: ReadonlyArray<Campaign>;
    readonly ml_available: ReadonlyArray<MLAvailable>;
    readonly ml_failed: ReadonlyArray<MLFailedInvitation>;
}

/** Borrador de campaña que está construyendo el wizard. */
export interface CampaignDraft {
    id: "DRAFT";
    name: string;
    channel: Channel;
    type: MLPromotionType;
    start_date: string | Date;
    end_date: string | Date;
    global_discount: number;
    skus: CampaignSku[];
    paused: boolean;
    draft: true;
}

/** Item por SKU dentro del MLEnrollModal (estado local del modal). */
export interface EnrollItem {
    selected: boolean;
    discount: number;
    top_deal: number;
    stock_committed: number | null;
}

/** Payload que devuelve el modal al confirmar inscripción. */
export interface EnrollPayload {
    readonly items: ReadonlyArray<{
        readonly sku: string;
        readonly name: string;
        readonly price: number;
        readonly stock: number;
        readonly discount: number;
        readonly top_deal: number;
        readonly stock_committed: number | null;
    }>;
    readonly campName: string;
    readonly endDate: Date;
}

// ─── Helpers de fechas (UI) ───────────────────────────────────────────────────

/** Helper: extrae fecha como Date a partir de string ISO o Date. */
export function asDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Computa días que faltan hasta `end_date`. Negativo = ya terminó. */
export function daysLeft(end: string | Date | null | undefined): number | null {
    const d = asDate(end);
    if (!d) return null;
    const diffMs = d.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
