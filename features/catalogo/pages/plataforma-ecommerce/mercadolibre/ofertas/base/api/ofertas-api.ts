// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/api/ofertas-api.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/api.ts` (906 LOC). Adaptaciones para OMS:
//   - `fetch` directo → `useFetchWithAuthPim` (JWT + x-plataforma-id auto)
//   - module-level functions → hook `useOfertasApi`
//   - `ApiError` exported para que `error-map.ts` lo importe del path correcto
//   - Funciones puras (cacheItemRangeIfPresent, normalizers, isItemActive)
//     viven en module-scope
//
// SHAPE de paths, query params, response parsing → IDÉNTICO al legacy.
// El legacy es la fuente de verdad — battle-tested con 9k+ items ML reales.

"use client";

import { useCallback, useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import type {
    Campaign,
    CatalogSku,
    MLAvailable,
    MLFailedInvitation,
    MLPromotionType,
    MlItemRange,
    Reputation,
} from "../types/oferta-types";
import type { OfferPublication, ProductMatch } from "../types/elegibilidad-types";

const BASE = "/api/pim";
// Path rewrite del pim-service: este path se reescribe en el monolito a
// `:3013/api/pim/seller-promotions/*` (sin `canales/mercadolibre`). El front
// pega al primero — el monolito hace el path rewrite.
const SP_BASE = `${BASE}/canales/mercadolibre/seller-promotions`;

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
    status: number;
    code: string | null;
    causes: ReadonlyArray<{ code?: string; message?: string }>;
    constructor(
        message: string,
        status: number,
        code: string | null = null,
        causes: ReadonlyArray<{ code?: string; message?: string }> = [],
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.causes = causes;
    }
}

/** Re-export bajo nombre histórico (algunos hooks importan `OfertasApiError`). */
export const OfertasApiError = ApiError;
export type OfertasApiError = ApiError;

// ─── Shapes raw del backend (idénticos al legacy) ────────────────────────────

interface MlPaging {
    readonly searchAfter?: string;
    readonly search_after?: string;
    readonly limit?: number;
    readonly total?: number;
}

function readSearchAfter(paging: MlPaging | undefined): string | undefined {
    return paging?.searchAfter ?? paging?.search_after ?? undefined;
}

interface InvitationsResponse {
    readonly ok?: boolean;
    readonly results?: ReadonlyArray<RawInvitation>;
    readonly paging?: MlPaging;
}

interface RawInvitation {
    readonly id: string;
    readonly type?: MLPromotionType;
    readonly promotion_type?: MLPromotionType;
    readonly name?: string;
    readonly description?: string;
    readonly start_date?: string;
    readonly finish_date?: string;
    readonly end_date?: string;
    readonly deadline_date?: string;
    readonly status?: "pending" | "started" | "finished";
    readonly min_discount?: number;
    readonly max_discount?: number;
    readonly stock_required?: boolean;
    readonly min_stock_required?: number;
}

interface PromotionItemsResponse {
    readonly ok?: boolean;
    readonly results?: ReadonlyArray<RawPromotionItem>;
    readonly paging?: MlPaging;
}

/**
 * Status posibles de un item dentro de una promoción ML.
 *
 * Lifecycle base:
 *   candidate ──opt-in──> pending ──fecha inicio──> started ──fecha fin──> finished
 *
 * Estados de transición (solo PRICE_DISCOUNT):
 *   sync_requested    — procesando activación del descuento
 *   restore_requested — procesando eliminación del descuento
 */
type ItemStatus =
    | "candidate"
    | "pending"
    | "started"
    | "finished"
    | "sync_requested"
    | "restore_requested";

export interface RawPromotionItem {
    readonly id: string;
    readonly status: ItemStatus;
    /** Tipo de promo. ML lo incluye en GET /seller-promotions/items/:item_id
     *  (cada entrada es de un tipo distinto). Opcional porque listPromotionItems
     *  (items de UNA campaña) no lo trae por ítem. */
    readonly type?: MLPromotionType;
    readonly name?: string;
    readonly sub_type?: string;
    readonly price?: number;
    readonly original_price?: number;
    readonly offer_id?: string;
    readonly start_date?: string;
    readonly end_date?: string;
    readonly finish_date?: string;
    readonly min_discounted_price?: number;
    readonly max_discounted_price?: number;
    readonly suggested_discounted_price?: number;
    readonly meli_percentage?: number;
    readonly seller_percentage?: number;
    readonly stock?: { readonly min?: number; readonly max?: number };
}

interface ProductosListRow {
    readonly item_id: string;
    readonly sku?: string;
    readonly seller_custom_field?: string;
    readonly seller_sku?: string;
    readonly titulo?: string;
    readonly precio?: number;
    readonly stock?: number;
    readonly imagenes?: ReadonlyArray<string>;
    readonly estado?: string;
    readonly reputation?: Reputation;
}

interface ProductosListResponse {
    readonly ok?: boolean;
    readonly page?: number;
    readonly pageSize?: number;
    readonly total?: number;
    readonly totalPages?: number;
    readonly data: ReadonlyArray<ProductosListRow>;
}

interface RawPublicationRow {
    readonly itemId: string;
    readonly isPrimary?: boolean;
    readonly isCatalogListing?: boolean;
    readonly catalogProductId?: string | null;
    readonly variationId?: string | null;
    readonly inventoryId?: string | null;
    readonly userProductId?: string | null;
    readonly itemStatus?: string | null;
    readonly logisticType?: string | null;
}
interface PublicacionesResponse {
    readonly ok?: boolean;
    readonly publications?: ReadonlyArray<RawPublicationRow>;
}

// ─── Cache module-level de rangos ML por item ────────────────────────────────

const _itemRanges = new Map<string, MlItemRange>();

/** Lookup del rango ML real para un MLC. `null` si nunca lo vimos. */
export function getItemRange(itemId: string): MlItemRange | null {
    return _itemRanges.get(itemId) ?? null;
}

/**
 * Cachea el rango ML cuando los campos críticos vinieron en el response.
 * Requiere `original_price > 0` + `min` + `max`. `suggested` puede ser null.
 * Si falta `min` o `max`, NO cacheamos (fail loud — el modal esconde el SKU).
 */
function cacheItemRangeIfPresent(it: RawPromotionItem): void {
    if (
        typeof it.original_price === "number" &&
        typeof it.min_discounted_price === "number" &&
        typeof it.max_discounted_price === "number" &&
        it.original_price > 0
    ) {
        _itemRanges.set(it.id, {
            original_price: it.original_price,
            min_discounted_price: it.min_discounted_price,
            max_discounted_price: it.max_discounted_price,
            suggested_discounted_price:
                typeof it.suggested_discounted_price === "number"
                    ? it.suggested_discounted_price
                    : null,
        });
    }
}

/**
 * Items cuyo status indica que el seller está participando ahora mismo o
 * tiene la inscripción programada/en proceso. NO incluye 'candidate' ni
 * 'finished'.
 */
function isItemActive(s: ItemStatus): boolean {
    return (
        s === "started" ||
        s === "pending" ||
        s === "sync_requested" ||
        s === "restore_requested"
    );
}

/**
 * Detecta si una invitación corresponde a una campaña histórica (terminada).
 *
 * Reemplaza al check anterior `finished.length > 0` que dependía de que ML
 * nos devolviera items con `status === "finished"`. Como ahora filtramos por
 * `status_item="active|paused"` (para no inflar el conteo con candidates en
 * MARKETPLACE_CAMPAIGN), ML ya no incluye los finalizados en la respuesta.
 * Detectamos histórica por la fecha de fin de la invitación, igual que
 * `statusOf` hace para `Campaign`.
 */
function isInvitationEnded(inv: MLAvailable): boolean {
    const end = inv.end_date instanceof Date ? inv.end_date : new Date(inv.end_date);
    return Number.isFinite(end.getTime()) && end.getTime() < Date.now();
}

// ─── Normalizers (verbatim del legacy) ───────────────────────────────────────

function normalizeInvitation(raw: RawInvitation): MLAvailable {
    const type = (raw.type ?? raw.promotion_type ?? "DEAL") as MLPromotionType;
    return {
        id: raw.id,
        name: raw.name ?? `Campaña ${raw.id}`,
        desc: raw.description ?? "",
        icon: iconForType(type),
        iconClass: iconClassForType(type),
        type,
        start_date: raw.start_date ? new Date(raw.start_date) : new Date(),
        end_date: new Date(
            raw.finish_date ?? raw.end_date ?? raw.deadline_date ?? Date.now() + 86400000,
        ),
        min_discount: raw.min_discount ?? 5,
        max_discount: raw.max_discount ?? 80,
        eligible_categories: ["Todas"],
        eligible_skus: [],
        enrolled: raw.status === "started" || raw.status === "pending",
        locked_after_start:
            type === "DEAL" ||
            type === "DOD" ||
            type === "LIGHTNING" ||
            type === "MARKETPLACE_CAMPAIGN",
        requires_stock: type === "DOD" || type === "LIGHTNING",
        min_stock_required: undefined,
        supports_top_deal: type === "SELLER_CAMPAIGN",
    };
}

function normalizeCatalogSku(raw: ProductosListRow): CatalogSku {
    return {
        sku: raw.seller_sku || raw.seller_custom_field || raw.sku || raw.item_id,
        item_id: raw.item_id ?? null,
        name: raw.titulo ?? "(sin título)",
        price: Number(raw.precio ?? 0),
        stock: Number(raw.stock ?? 0),
        image: raw.imagenes?.[0] ?? null,
        min_discounted_price: 0,
        max_discounted_price: Number(raw.precio ?? 0),
        suggested_discounted_price: Math.round(Number(raw.precio ?? 0) * 0.85),
        reputation: raw.reputation ?? "green",
        has_active_promo: false,
    };
}

function iconForType(t: MLPromotionType): string {
    switch (t) {
        case "DEAL":
            return "🔥";
        case "DOD":
        case "LIGHTNING":
            return "⚡";
        case "PRICE_DISCOUNT":
            return "%";
        case "PRICE_MATCHING":
        case "PRICE_MATCHING_MELI_ALL":
            return "⇆";
        case "VOLUME":
            return "×";
        case "SELLER_CAMPAIGN":
            return "🛍";
        case "UNHEALTHY_STOCK":
            return "📦";
        case "SELLER_COUPON_CAMPAIGN":
            return "🎟";
        case "BANK":
            return "💳";
        case "SMART":
            return "✨";
        case "PRE_NEGOTIATED":
            return "🤝";
        case "MARKETPLACE_CAMPAIGN":
            return "🏷";
        default:
            return "🏷";
    }
}

function iconClassForType(t: MLPromotionType): string {
    if (t === "DEAL") return "hot";
    if (t === "DOD" || t === "LIGHTNING") return "lightning";
    if (t === "PRICE_DISCOUNT") return "discount";
    return "";
}

// ─── Helper "buildCampaign" (verbatim del legacy) ────────────────────────────

interface EnrolledInvitation {
    readonly inv: MLAvailable;
    readonly itemsCountApprox: number;
}

function buildCampaignFromEnrollment(e: EnrolledInvitation): Campaign {
    // El listado ya no descarga los ítems de cada campaña — clasifica por
    // conteos baratos (`getPromotionCounts`). Por eso no calculamos
    // `avg_discount`/`sales_so_far`/`stock_committed` (ninguno se muestra en
    // la tabla). `skus_count` viene del conteo de inscritos.
    return {
        id: e.inv.id,
        name: e.inv.name,
        channel: "ml",
        type: e.inv.type,
        official_id: e.inv.id,
        start_date:
            e.inv.start_date instanceof Date
                ? e.inv.start_date
                : new Date(e.inv.start_date),
        end_date:
            e.inv.end_date instanceof Date
                ? e.inv.end_date
                : new Date(e.inv.end_date),
        skus: [],
        skus_count: e.itemsCountApprox,
        stock_committed: 0,
        paused: false,
        draft: false,
    };
}

// ─── Public API types ────────────────────────────────────────────────────────

export interface OptInItemBody {
    readonly promotion_id: string;
    readonly promotion_type: MLPromotionType;
    readonly deal_price?: number;
    readonly top_deal_price?: number;
    readonly stock?: number;
    readonly offer_id?: string;
}

export interface CreateCampaignBody {
    readonly name: string;
    readonly promotion_type: "SELLER_CAMPAIGN" | "VOLUME" | "SELLER_COUPON_CAMPAIGN";
    readonly start_date: string;
    readonly finish_date: string;
    readonly deal_price?: number;
    readonly top_deal_price?: number;
}

export type RetryResult =
    | { readonly kind: "enrolled"; readonly campaign: Campaign }
    | { readonly kind: "available"; readonly invitation: MLAvailable }
    | {
          readonly kind: "failed";
          readonly errorCode: string | null;
          readonly errorMessage: string;
      };

export interface LoadOfertasResult {
    readonly campaigns: ReadonlyArray<Campaign>;
    readonly ml_available: ReadonlyArray<MLAvailable>;
    readonly ml_failed: ReadonlyArray<MLFailedInvitation>;
}

// ─── Hook público ────────────────────────────────────────────────────────────

export interface UseOfertasApi {
    listInvitations: (opts?: {
        promotion_type?: MLPromotionType;
        status?: "pending" | "started" | "finished";
        limit?: number;
        search_after?: string;
    }) => Promise<{
        results: ReadonlyArray<MLAvailable>;
        search_after?: string;
    }>;

    listPromotionItems: (
        promoId: string,
        type: MLPromotionType,
        opts?: {
            status_item?: "active" | "paused";
            limit?: number;
            search_after?: string;
        },
    ) => Promise<{
        results: ReadonlyArray<RawPromotionItem>;
        search_after?: string;
        total?: number;
    }>;

    listAllPromotionItems: (
        promoId: string,
        type: MLPromotionType,
        opts?: {
            status_item?: "active" | "paused";
            /**
             * Máximo de páginas a recorrer (limit=50 por página).
             * Default: 20 (≈1000 ítems). Para campañas grandes evita
             * minutos de paginación + rate limit ML.
             */
            maxPages?: number;
        },
    ) => Promise<{
        results: ReadonlyArray<RawPromotionItem>;
        total: number;
    }>;

    listItemPromotions: (
        itemId: string,
    ) => Promise<{ results: ReadonlyArray<RawPromotionItem> }>;

    /** Conteos baratos (limit=1, cacheados 60s) de una promoción. */
    getPromotionCounts: (
        promoId: string,
        type: MLPromotionType,
    ) => Promise<{ active: number | null; paused: number | null; candidate: number | null; inscritos: number }>;

    listSellerCatalog: (opts?: {
        page?: number;
        pageSize?: number;
        status?: string;
    }) => Promise<{
        items: ReadonlyArray<CatalogSku>;
        total: number;
        page: number;
        pageSize: number;
    }>;

    /** Publicaciones (N item_id) de un SKU — endpoint /publicaciones de 3b. */
    listPublicaciones: (sku: string) => Promise<OfferPublication[]>;
    /** Búsqueda de catálogo por SKU / MLC / nombre (LIKE). */
    searchProductos: (query: string) => Promise<ProductMatch[]>;

    getProductoByItemId: (itemId: string) => Promise<CatalogSku | null>;

    /** POST destructivo — opt-in / agregar item a promoción. */
    optInItem: (itemId: string, body: OptInItemBody) => Promise<unknown>;

    /** PUT destructivo — modificar item en promoción (DEAL/SELLER_CAMPAIGN). */
    modifyItem: (itemId: string, body: OptInItemBody) => Promise<unknown>;

    /** DELETE destructivo — quitar item de una promo específica o de todas. */
    removeItemFromPromotion: (
        itemId: string,
        opts: {
            promotion_type: MLPromotionType;
            promotion_id?: string;
            offer_id?: string;
        },
    ) => Promise<unknown>;

    /** POST destructivo — crear campaña propia (SELLER_CAMPAIGN/VOLUME/SELLER_COUPON_CAMPAIGN). */
    createCampaign: (body: CreateCampaignBody) => Promise<unknown>;

    /**
     * Orchestrator: paginar todas las invitaciones + partir en 3 (active /
     * finished / candidates) + failed[]. Espejo del legacy.
     */
    loadOfertasFromApi: () => Promise<LoadOfertasResult>;

    /** Retry per-card de una invitación que había fallado. */
    retryInvitationLoad: (failed: MLFailedInvitation) => Promise<RetryResult>;
}

export function useOfertasApi(): UseOfertasApi {
    const { fetchWithAuthPim } = useFetchWithAuthPim();

    /** Helper: request con query params + manejo de ApiError. */
    const request = useCallback(
        async <T>(
            method: string,
            path: string,
            body?: unknown,
            query?: Record<string, string | number | undefined | null>,
        ): Promise<T> => {
            const params = new URLSearchParams();
            if (query) {
                for (const [k, v] of Object.entries(query)) {
                    if (v != null && v !== "") params.set(k, String(v));
                }
            }
            const url = path + (params.toString() ? `?${params.toString()}` : "");
            try {
                return await fetchWithAuthPim<T>(url, {
                    method,
                    body: body ? JSON.stringify(body) : undefined,
                });
            } catch (e) {
                const err = e as {
                    status?: number;
                    payload?: {
                        message?: string;
                        error?: string;
                        code?: string;
                        causes?: ReadonlyArray<{ code?: string; message?: string }>;
                    };
                    message?: string;
                };
                throw new ApiError(
                    err?.payload?.message ||
                        err?.payload?.error ||
                        err?.message ||
                        `HTTP ${err?.status ?? "?"}`,
                    err?.status ?? 0,
                    err?.payload?.code ?? null,
                    err?.payload?.causes ?? [],
                );
            }
        },
        [fetchWithAuthPim],
    );

    const listInvitations: UseOfertasApi["listInvitations"] = useCallback(
        async (opts = {}) => {
            const r = await request<InvitationsResponse>(
                "GET",
                `${SP_BASE}/users/me`,
                undefined,
                {
                    promotion_type: opts.promotion_type,
                    status: opts.status,
                    limit: opts.limit,
                    search_after: opts.search_after,
                },
            );
            const list = r.results ?? [];
            return {
                results: list.map(normalizeInvitation),
                search_after: readSearchAfter(r.paging),
            };
        },
        [request],
    );

    const listPromotionItems: UseOfertasApi["listPromotionItems"] = useCallback(
        async (promoId, type, opts = {}) => {
            const r = await request<PromotionItemsResponse>(
                "GET",
                `${SP_BASE}/promotions/${encodeURIComponent(promoId)}/items`,
                undefined,
                {
                    promotion_type: type,
                    status_item: opts.status_item,
                    limit: opts.limit,
                    search_after: opts.search_after,
                },
            );
            return {
                results: r.results ?? [],
                search_after: readSearchAfter(r.paging),
                total: r.paging?.total,
            };
        },
        [request],
    );

    const listAllPromotionItems: UseOfertasApi["listAllPromotionItems"] = useCallback(
        async (promoId, type, opts = {}) => {
            const out: RawPromotionItem[] = [];
            let cursor: string | undefined;
            let total = 0;
            // ML rechaza `limit > 50` para este endpoint con HTTP 400
            // ("Invalid limit - limit must be lower than 50"). Paginamos en
            // chunks de 50 usando `search_after` (cursor-based, no paralelizable).
            //
            // `MAX_PAGES = 20` traduce a un techo de 1000 ítems por fetch.
            // Para campañas grandes como "Mimbral Mayo" (>8.000 inscritos)
            // paginar entero serían >160 requests secuenciales (~minutos +
            // rate limit). 1000 ítems iniciales son suficientes para la UI
            // del tab Ítems; si en el futuro necesitamos paginar más,
            // agregamos un control "Cargar más" en el componente.
            const MAX_PAGES = opts.maxPages ?? 20;
            for (let i = 0; i < MAX_PAGES; i++) {
                const r = await listPromotionItems(promoId, type, {
                    limit: 50,
                    status_item: opts.status_item,
                    search_after: cursor,
                });
                out.push(...r.results);
                if (r.total != null) total = r.total;
                if (!r.search_after || r.results.length === 0) break;
                cursor = r.search_after;
            }
            return { results: out, total: total || out.length };
        },
        [listPromotionItems],
    );

    const listItemPromotions: UseOfertasApi["listItemPromotions"] = useCallback(
        async (itemId) => {
            const r = await request<{
                ok?: boolean;
                results?: ReadonlyArray<RawPromotionItem>;
            }>("GET", `${SP_BASE}/items/${encodeURIComponent(itemId)}`);
            return { results: r.results ?? [] };
        },
        [request],
    );

    const getPromotionCounts: UseOfertasApi["getPromotionCounts"] = useCallback(
        async (promoId, type) => {
            const r = await request<{
                ok?: boolean;
                active?: number | null;
                paused?: number | null;
                candidate?: number | null;
                inscritos?: number;
            }>(
                "GET",
                `${SP_BASE}/promotions/${encodeURIComponent(promoId)}/counts?promotion_type=${encodeURIComponent(type)}`,
            );
            return {
                active: r.active ?? null,
                paused: r.paused ?? null,
                candidate: r.candidate ?? null,
                inscritos: r.inscritos ?? 0,
            };
        },
        [request],
    );

    const listPublicaciones: UseOfertasApi["listPublicaciones"] = useCallback(
        async (sku) => {
            const r = await request<PublicacionesResponse>(
                "GET",
                `${BASE}/canales/mercadolibre/productos/${encodeURIComponent(sku)}/publicaciones`,
            );
            return (r.publications ?? []).map((p) => ({
                itemId: p.itemId,
                isPrimary: Boolean(p.isPrimary),
                isCatalogListing: Boolean(p.isCatalogListing),
                catalogProductId: p.catalogProductId ?? null,
                variationId: p.variationId ?? null,
                inventoryId: p.inventoryId ?? null,
                userProductId: p.userProductId ?? null,
                itemStatus: p.itemStatus ?? null,
                logisticType: p.logisticType ?? null,
            }));
        },
        [request],
    );

    const searchProductos: UseOfertasApi["searchProductos"] = useCallback(
        async (query) => {
            const q = query.trim();
            if (!q) return [];
            const r = await request<ProductosListResponse>(
                "GET",
                `${BASE}/productos`,
                undefined,
                { marketplace: "ml", search: q, page: 1, pageSize: 50, status: "activos" },
            );
            return (r.data ?? []).map((row) => ({
                sku: row.sku ?? "",
                titulo: row.titulo ?? row.sku ?? "",
                itemId: row.item_id ?? undefined,
            }));
        },
        [request],
    );

    const listSellerCatalog: UseOfertasApi["listSellerCatalog"] = useCallback(
        async (opts = {}) => {
            const r = await request<ProductosListResponse>(
                "GET",
                `${BASE}/productos`,
                undefined,
                {
                    marketplace: "ml",
                    page: opts.page ?? 1,
                    pageSize: opts.pageSize ?? 50,
                    status: opts.status,
                },
            );
            return {
                items: (r.data ?? []).map(normalizeCatalogSku),
                total: r.total ?? 0,
                page: r.page ?? 1,
                pageSize: r.pageSize ?? 50,
            };
        },
        [request],
    );

    const getProductoByItemId: UseOfertasApi["getProductoByItemId"] = useCallback(
        async (itemId) => {
            try {
                const r = await request<ProductosListRow & { ok?: boolean }>(
                    "GET",
                    `${BASE}/productos/${encodeURIComponent(itemId)}`,
                    undefined,
                    { marketplace: "ml" },
                );
                return normalizeCatalogSku({
                    item_id: r.item_id ?? itemId,
                    sku: r.sku,
                    seller_custom_field: r.seller_custom_field,
                    seller_sku: r.seller_sku,
                    titulo: r.titulo,
                    precio: r.precio,
                    stock: r.stock,
                    imagenes: r.imagenes,
                    reputation: r.reputation,
                });
            } catch (err) {
                if (err instanceof ApiError && err.status === 404) return null;
                throw err;
            }
        },
        [request],
    );

    // ── Write endpoints (DESTRUCTIVOS) ───────────────────────────────────────

    const optInItem: UseOfertasApi["optInItem"] = useCallback(
        (itemId, body) =>
            request<unknown>(
                "POST",
                `${SP_BASE}/items/${encodeURIComponent(itemId)}`,
                body,
            ),
        [request],
    );

    const modifyItem: UseOfertasApi["modifyItem"] = useCallback(
        (itemId, body) =>
            request<unknown>(
                "PUT",
                `${SP_BASE}/items/${encodeURIComponent(itemId)}`,
                body,
            ),
        [request],
    );

    const removeItemFromPromotion: UseOfertasApi["removeItemFromPromotion"] = useCallback(
        (itemId, opts) =>
            request<unknown>(
                "DELETE",
                `${SP_BASE}/items/${encodeURIComponent(itemId)}`,
                undefined,
                {
                    promotion_type: opts.promotion_type,
                    promotion_id: opts.promotion_id,
                    offer_id: opts.offer_id,
                },
            ),
        [request],
    );

    const createCampaign: UseOfertasApi["createCampaign"] = useCallback(
        (body) => request<unknown>("POST", `${SP_BASE}/promotions`, body),
        [request],
    );

    // ── Orchestration: invitations + enrollment → state inicial ──────────────

    const collectAllInvitations = useCallback(async (): Promise<MLAvailable[]> => {
        const all: MLAvailable[] = [];
        let cursor: string | undefined;
        const MAX_PAGES = 20;
        for (let i = 0; i < MAX_PAGES; i++) {
            const r = await listInvitations({ limit: 50, search_after: cursor });
            all.push(...r.results);
            if (!r.search_after) break;
            cursor = r.search_after;
        }
        return all;
    }, [listInvitations]);

    const loadOfertasFromApi: UseOfertasApi["loadOfertasFromApi"] = useCallback(
        async () => {
            const all = await collectAllInvitations();

            // CRÍTICO (Mayo 2026): para campañas grandes tipo SELLER o
            // MARKETPLACE_CAMPAIGN (ej. "Mimbral Mayo" con ~9.000 ítems
            // inscritos), pegar al endpoint
            //   GET /seller-promotions/promotions/:id/items
            // con paginación completa explota a >100 requests secuenciales
            // y dispara rate limit del backend.
            //
            // Para el listado solo necesitamos saber:
            //   (a) si la invitación tiene inscritos → va a "Activas"
            //   (b) si la invitación terminó → va a "Finalizadas"
            //   (c) si no tiene inscritos y sigue vigente → va a "Disponibles"
            //   (d) cuántos inscritos hay (para la columna "SKUs")
            //
            // Hacemos UN SOLO fetch barato por invitación con
            // `getPromotionCounts` (limit=1 internamente, cacheado). Devuelve
            // {active, paused, candidate, inscritos} sin bajar páginas de
            // ítems — antes esto era una ráfaga de ~26 calls al abrir el
            // listado. Procesamos en batches de 5 para no saturar.
            // Ref: mimbral-docs/promociones/Campañas co-fondeada automatizada
            // y campañas de precios competitivos.md, línea 287-293.

            type InvitationCheckResult =
                | {
                      ok: true;
                      inv: MLAvailable;
                      active: number;
                      paused: number;
                      candidate: number;
                      inscritos: number;
                  }
                | {
                      ok: false;
                      inv: MLAvailable;
                      errorCode: string | null;
                      errorMessage: string;
                  };

            const BATCH_SIZE = 5;
            const checks: PromiseSettledResult<InvitationCheckResult>[] = [];

            for (let i = 0; i < all.length; i += BATCH_SIZE) {
                const batch = all.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.allSettled(
                    batch.map(async (inv) => {
                        try {
                            const c = await getPromotionCounts(inv.id, inv.type);
                            return {
                                ok: true as const,
                                inv,
                                active: c.active ?? 0,
                                paused: c.paused ?? 0,
                                candidate: c.candidate ?? 0,
                                inscritos: c.inscritos ?? 0,
                            };
                        } catch (err) {
                            if (process.env.NODE_ENV !== "production") {
                                console.warn(
                                    `[ofertas] check enrollment ${inv.id}/${inv.type} falló:`,
                                    err,
                                );
                            }
                            const apiErr = err as ApiError;
                            return {
                                ok: false as const,
                                inv,
                                errorCode: apiErr?.code ?? null,
                                errorMessage:
                                    apiErr?.message ?? String(err ?? "Error desconocido"),
                            };
                        }
                    }),
                );
                checks.push(...batchResults);
            }

            const enrolledList: EnrolledInvitation[] = [];
            const notEnrolledList: MLAvailable[] = [];
            const failedList: MLFailedInvitation[] = [];

            for (const c of checks) {
                if (c.status !== "fulfilled") continue;
                if (!c.value.ok) {
                    failedList.push({
                        id: c.value.inv.id,
                        name: c.value.inv.name,
                        type: c.value.inv.type,
                        start_date: c.value.inv.start_date,
                        end_date: c.value.inv.end_date,
                        errorCode: c.value.errorCode,
                        errorMessage: c.value.errorMessage,
                    });
                    continue;
                }
                const { inv, active, paused, candidate, inscritos } = c.value;

                if (active > 0) {
                    // Activa o Programada — `inscritos` es el conteo real.
                    enrolledList.push({
                        inv,
                        itemsCountApprox: inscritos,
                    });
                } else if (isInvitationEnded(inv)) {
                    // Histórica — `statusOf` la marca 'ended' por fecha.
                    // Sin items activos, usamos `inscritos` (o pausados como
                    // respaldo) para la columna SKUs.
                    enrolledList.push({
                        inv,
                        itemsCountApprox: inscritos || paused,
                    });
                } else if (candidate > 0) {
                    // Disponibles: candidatos sin opt-in. Con conteos no
                    // tenemos los IDs — el modal de inscripción los resuelve
                    // a demanda. Poblamos `eligible_skus` con placeholders del
                    // largo del conteo para que `AvailableInvitationsList`
                    // muestre el número correcto y habilite "Inscribirme".
                    notEnrolledList.push({
                        ...inv,
                        enrolled: false,
                        eligible_skus: Array.from(
                            { length: candidate },
                            (_, idx) => `candidate-${idx}`,
                        ),
                    });
                }
                // else: sin activos, sin candidatos y no terminada → se
                // omite (mismo comportamiento que antes para "no items").
            }

            return {
                campaigns: enrolledList.map(buildCampaignFromEnrollment),
                ml_available: notEnrolledList,
                ml_failed: failedList,
            };
        },
        [collectAllInvitations, getPromotionCounts],
    );

    const retryInvitationLoad: UseOfertasApi["retryInvitationLoad"] = useCallback(
        async (failed) => {
            const mockInv: MLAvailable = {
                id: failed.id,
                name: failed.name,
                desc: "",
                icon: iconForType(failed.type),
                iconClass: iconClassForType(failed.type),
                type: failed.type,
                start_date:
                    failed.start_date instanceof Date
                        ? failed.start_date
                        : new Date(failed.start_date),
                end_date:
                    failed.end_date instanceof Date
                        ? failed.end_date
                        : new Date(failed.end_date),
                min_discount: 5,
                max_discount: 80,
                eligible_categories: ["Todas"],
                eligible_skus: [],
                enrolled: false,
                locked_after_start: false,
                requires_stock: false,
                supports_top_deal: false,
            };
            try {
                const r = await listPromotionItems(failed.id, failed.type, { limit: 50 });
                for (const it of r.results) cacheItemRangeIfPresent(it);
                const active = r.results.filter((it) => isItemActive(it.status));
                const finished = r.results.filter((it) => it.status === "finished");
                const candidates = r.results.filter((it) => it.status === "candidate");

                if (active.length > 0 || finished.length > 0) {
                    const itemsForCount = active.length > 0 ? active : finished;
                    const campaign = buildCampaignFromEnrollment({
                        inv: mockInv,
                        itemsCountApprox: r.total ?? itemsForCount.length,
                    });
                    return { kind: "enrolled", campaign };
                }

                return {
                    kind: "available",
                    invitation: {
                        ...mockInv,
                        enrolled: false,
                        eligible_skus: candidates.map((c) => c.id),
                    },
                };
            } catch (err) {
                const apiErr = err as ApiError;
                return {
                    kind: "failed",
                    errorCode: apiErr?.code ?? null,
                    errorMessage:
                        apiErr?.message ?? String(err ?? "Error desconocido"),
                };
            }
        },
        [listPromotionItems],
    );

    return useMemo(
        () => ({
            listInvitations,
            listPromotionItems,
            listAllPromotionItems,
            listItemPromotions,
            getPromotionCounts,
            listSellerCatalog,
            listPublicaciones,
            searchProductos,
            getProductoByItemId,
            optInItem,
            modifyItem,
            removeItemFromPromotion,
            createCampaign,
            loadOfertasFromApi,
            retryInvitationLoad,
        }),
        [
            listInvitations,
            listPromotionItems,
            listAllPromotionItems,
            listItemPromotions,
            getPromotionCounts,
            listSellerCatalog,
            listPublicaciones,
            searchProductos,
            getProductoByItemId,
            optInItem,
            modifyItem,
            removeItemFromPromotion,
            createCampaign,
            loadOfertasFromApi,
            retryInvitationLoad,
        ],
    );
}
