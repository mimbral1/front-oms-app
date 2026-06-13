// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/api/publicar-api.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/api.ts`. Cambios respecto al legacy:
//   - `fetch` directo → `useFetchWithAuthPim` (token JWT + x-plataforma-id auto)
//   - module-level functions → hook `usePublicarApi`
//   - tipos TS estrictos donde el legacy usa `any`
//
// El SHAPE de cada call HTTP, los paths, los query params, las normalizaciones
// de response y los retornos son IDÉNTICOS al legacy. No inventar.
//
// Endpoints reales (verificados contra `pim-service/CLAUDE.md` y
// `meli-catalog-service/CLAUDE.md`):
//   GET    /api/pim/canales/:channel/productos/:sku/vista-previa    → preview rico
//   GET    /api/pim/canales/:channel/productos/:sku/vista-previa?categoria_id=X
//   GET    /api/pim/ml/categorias/buscar?q=&solo_hojas=1            → buscar ML
//   GET    /api/pim/categorias/buscar?q=&marketplace=falabella      → buscar Fala
//   GET    /api/pim/ml/categorias/:catId/atributos                  → meta attrs ML
//   GET    /api/pim/ml/tiendas-oficiales                            → official store
//   POST   /api/pim/ml/imagenes                                     → upload imagen
//   POST   /api/pim/ml/publicar-prueba                              → publish ML test
//   POST   /api/pim/canales/:channel/productos/:sku/publicar        → publish real
//   POST   /api/pim/canales/:channel/productos/:sku/reintentar      → retry real
//
// `:channel` es "mercadolibre"|"falabella" (nombres largos). Joi validator
// backend valida estricto — mandar "ml"/"fala" causa ERR_EMPTY_RESPONSE.

"use client";

import { useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuthPim } from "@/lib/http/client";
import { URL_PIM_SERVICE } from "@/lib/http/endpoints";
import {
    canonicalFalaFeedName,
    FALA_HIDDEN_OPTIONALS,
    FALA_PACKAGE_FIELD_META,
    FALA_PACKAGE_DIMS,
    toArray,
} from "../helpers/constants";
import type {
    FalaChannelData,
    FalaScoreRule,
    FichaMaestra,
    ImageDiagnostic,
    ItemCondition,
    MLChannelData,
    MarketplaceCategory,
    ProductoSap,
    PublicarAttribute,
    PublicarChannel,
    PublicarResult,
    UploadedImage,
} from "../types/publicar-types";

interface ApiEnvelope<T> {
    readonly ok?: boolean;
    readonly data?: T;
    readonly results?: T;
    readonly code?: string;
    readonly message?: string;
}

function extractSingle<T>(env: ApiEnvelope<T> | T): T {
    if (env && typeof env === "object" && "data" in (env as ApiEnvelope<T>)) {
        return (env as ApiEnvelope<T>).data as T;
    }
    return env as T;
}

function extractList<T>(env: ApiEnvelope<ReadonlyArray<T>> | ReadonlyArray<T>): ReadonlyArray<T> {
    if (Array.isArray(env)) return env as ReadonlyArray<T>;
    const e = env as ApiEnvelope<ReadonlyArray<T>>;
    if (Array.isArray(e?.data)) return e.data;
    if (Array.isArray(e?.results)) return e.results;
    return [];
}

function pickToken(ctxToken: string | null): string {
    if (ctxToken) return ctxToken;
    try {
        const ls = JSON.parse(localStorage.getItem("authState") || "{}");
        if (ls?.token) return String(ls.token);
    } catch {
        /* empty */
    }
    return Cookies.get("authToken") || "";
}

function asNumber(v: unknown): number | undefined {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "string" && v.trim()) {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function asArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
}

/** Mapea `channel` del front a la URL del backend.
 *  Backend usa "mercadolibre" / "falabella" en `/canales/:channel/...`. */
function channelToUrl(channel: PublicarChannel): "mercadolibre" | "falabella" {
    return channel === "ml" ? "mercadolibre" : "falabella";
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

/** Resultado de `getVistaPrevia` — shape normalizado del endpoint raw. */
export interface VistaPreviaResult {
    sku: string;
    sap: ProductoSap | null;
    categoria: MarketplaceCategory | null;
    /** Solo para Falabella (`opcionales` filtradas, `faltantes` con package
     *  dims promovidos). */
    falaRequiredAttrs?: PublicarAttribute[];
    falaOptionalAttrs?: PublicarAttribute[];
    /** Solo Fala. */
    falaScoreRules?: FalaScoreRule[];
    falaScoreActual?: number | null;
    falaBasicMeta?: Record<string, unknown>;
    /** payload_publicacion raw del backend (passthrough). Útil para hidratar
     *  los slots ml/fala del state. */
    rawPayload: Record<string, unknown>;
    /** `package_dims_required` flag del backend. */
    packageDimsRequired?: boolean;
}

/**
 * Resultado consolidado de `lookupSkuState(channel, sku, officialStoreId)`.
 * Espejo del legacy `lookupSkuState()` — el wizard mergea esto al state via
 * `setState(prev => ({ ...prev, ...nextState }))`.
 *
 * Devuelve slots para AMBOS canales aunque la consulta sea per-channel — el
 * `categoria`/`mlAvailableAttrs` opuesto al canal activo queda `null`/`[]`
 * para que el state quede limpio al hacer merge.
 */
export interface LookupSkuState {
    sku: string;
    sap: ProductoSap | null;
    category: MarketplaceCategory | null;
    categoryFala: MarketplaceCategory | null;
    mlAvailableAttrs: PublicarAttribute[];
    falaRequiredAttrs: PublicarAttribute[];
    falaOptionalAttrs: PublicarAttribute[];
    falaScoreRules: FalaScoreRule[];
    falaScoreActual: number | null;
    falaBasicMeta: Record<string, unknown>;
    /** Slot ML con campos básicos pre-rellenados desde el preview. */
    ml: MLChannelData;
    /** Slot Falabella idem. */
    fala: FalaChannelData;
}

/** Re-fetch parcial Falabella tras cambio manual de categoría. */
export interface FalaPreviewForCategoryResult {
    falaRequiredAttrs: PublicarAttribute[];
    falaOptionalAttrs: PublicarAttribute[];
    falaScoreRules: FalaScoreRule[];
    falaScoreActual: number | null;
    falaBasicMeta: Record<string, unknown>;
    falaPayload: Record<string, unknown>;
}

/**
 * Cuenta vendedora de un canal, resuelta desde commerce-service vía
 * `/api/pim/cuentas`. `id` es el `Account.Id` que va como `accountId` al
 * publicar (Falabella → 4, ML → 3). `salesChannelId` es el canal al que
 * pertenece (Falabella → 5, ML → 3).
 */
export interface CuentaCanal {
    id: number;
    name: string;
    referenceId: string;
    salesChannelId: number | null;
    salesChannelName: string | null;
    ecommerceName: string | null;
}

export interface UsePublicarApi {
    /**
     * Resuelve la cuenta vendedora del canal desde `/api/pim/cuentas`
     * (commerce-service). Devuelve `null` si no hay cuenta activa que matchee.
     * Se usa para auto-rellenar `accountId` y mostrar la cuenta real en la UI
     * (en vez de un id hardcodeado).
     */
    fetchCuentaCanal: (channel: PublicarChannel) => Promise<CuentaCanal | null>;

    /**
     * Lookup completo de un SKU para el canal activo. Hace `vista-previa` +
     * (ML) `categorias/:id/atributos`. Pre-rellena el slot ml/fala con datos
     * del payload_publicacion del backend (title, price, Name, Brand, etc.).
     *
     * `officialStoreId` (opcional) se inyecta en `ml.official_store_id` cuando
     * el preview no lo trae explícito. Default lo carga el wizard al mount
     * via `fetchOfficialStoreId()`.
     */
    lookupSkuState: (
        channel: PublicarChannel,
        sku: string,
        officialStoreId?: number | null,
    ) => Promise<LookupSkuState>;

    /** Llamada raw a `/vista-previa` (con override opcional de categoría). */
    getVistaPrevia: (
        channel: PublicarChannel,
        sku: string,
        opts?: { categoriaId?: string },
    ) => Promise<VistaPreviaResult | null>;

    /** GET /api/pim/productos/:sku/ficha — ficha maestra para precargar. null si no hay. */
    fetchFichaProducto: (
        sku: string,
        canalDestino: PublicarChannel,
    ) => Promise<FichaMaestra | null>;

    /**
     * Re-pega el preview Falabella con override de categoría. Devuelve solo
     * los campos que cambian al re-resolver la categoría — el caller mergea.
     */
    fetchFalaPreviewForCategory: (
        sku: string,
        categoriaId: string | number,
    ) => Promise<FalaPreviewForCategoryResult>;

    /** GET /api/pim/ml/tiendas-oficiales — default official store del seller. */
    fetchOfficialStoreId: () => Promise<number | null>;

    /** Buscar categorías por canal. ML usa `/ml/categorias/buscar?solo_hojas=1`,
     *  Fala usa `/categorias/buscar?marketplace=falabella`. */
    searchCategorias: (
        q: string,
        channel: PublicarChannel,
    ) => Promise<ReadonlyArray<MarketplaceCategory>>;

    /** META de atributos para una categoría ML (no aplica Fala — sus attrs
     *  vienen embebidos en vista-previa). */
    fetchMlCategoryAttributes: (
        categoryId: string,
    ) => Promise<ReadonlyArray<PublicarAttribute>>;

    /** GET /api/pim/canales/:channel/productos/:sku/calidad */
    getCalidad: (
        channel: PublicarChannel,
        sku: string,
    ) => Promise<{ score: number; missing?: string[] }>;

    /** Upload multipart. Falabella → /api/pim/imagenes (Cloudinary, host neutral);
     *  ML (default) → /api/pim/ml/imagenes (upload propio de ML, da picture_id). */
    uploadImagen: (file: File, channel?: PublicarChannel) => Promise<UploadedImage>;

    /** POST /api/pim/ml/imagenes/diagnostico — diagnóstico de calidad pre-publicación (solo ML). */
    diagnosticarImagen: (args: {
        pictureId?: string; pictureUrl?: string;
        categoryId?: string; title?: string;
        pictureType?: "thumbnail" | "variation_thumbnail" | "other";
    }) => Promise<ImageDiagnostic>;

    /**
     * POST /api/pim/ml/publicar-prueba — endpoint de PRUEBA de ML (no toca ML
     * real, lo cura el backend). Body es el payload completo `buildMlPayload`.
     */
    publishMlTest: (
        payload: Record<string, unknown>,
    ) => Promise<PublicarResult>;

    /**
     * POST /api/pim/canales/:channel/productos/:sku/publicar — REAL.
     *
     * Body shape (legacy): `{ createdBy, accountId?, payload }`.
     * `idempotencyKey` (UUID v4) — header `Idempotency-Key`. Si el call se
     * repite con la misma key, backend replay-tea sin tocar ML/Fala. Sin key,
     * doble click = doble publicación real.
     */
    publicar: (
        channel: PublicarChannel,
        sku: string,
        body: { createdBy: number; accountId?: number; payload: Record<string, unknown> },
        opts?: { idempotencyKey?: string },
    ) => Promise<PublicarResult>;

    /** POST /api/pim/canales/:channel/productos/:sku/reintentar */
    reintentar: (
        channel: PublicarChannel,
        sku: string,
        opts?: { idempotencyKey?: string },
    ) => Promise<PublicarResult>;
}

// ─── Shape raw del backend ────────────────────────────────────────────────────

interface RawMlCategory {
    id?: string;
    nombre?: string;
    path?: string;
}

interface RawFalaCategory {
    marketplaceCategoriaId?: string | number;
    marketplaceCategoriaNombre?: string;
}

interface RawVistaPreviaResponse {
    sku?: string;
    sap?: Record<string, unknown> | null;
    categoria?: {
        id?: number | string;
        nombre?: string;
        path?: string;
        suggested?: boolean;
        source?: string;
        deprecated?: boolean;
    } | null;
    payload_publicacion?: Record<string, unknown> | null;
    faltantes?: unknown[];
    opcionales?: unknown[];
    score_reglas?: unknown[];
    score_actual?: number | null;
    campos_basicos_meta?: Record<string, unknown>;
    package_dims_required?: boolean;
}

// ─── Normalizers (port verbatim del legacy api.ts) ────────────────────────────

/**
 * Normaliza un atributo Falabella de `faltantes` / `opcionales`. Preserva los
 * 5 campos canonical: `score_impact`, `content_score_impact`, `attributeType`,
 * `score_rule`, `score_hint`. Sin estos los filtros de Step3 fallan.
 */
function normalizeFalaPreviewAttribute(attr: unknown): PublicarAttribute {
    const a = (attr ?? {}) as Record<string, unknown>;
    const opciones = asArray<Record<string, unknown>>(a.opciones);
    const values = opciones
        .map((o) => ({
            id: String(o.id ?? o.name ?? ""),
            name: String(o.name ?? o.id ?? ""),
        }))
        .filter((v) => v.id && v.name);
    const rawFeedName = String(a.feedName ?? a.FeedName ?? a.Name ?? "");
    const feedName = canonicalFalaFeedName(rawFeedName);
    const contentScoreImpact = Boolean(a.content_score_impact);
    const packageMeta = FALA_PACKAGE_FIELD_META[feedName];
    return {
        id: feedName,
        feedName,
        name: String(a.Name ?? a.feedName ?? a.FeedName ?? ""),
        label: packageMeta?.label ?? String(a.Name ?? a.feedName ?? a.FeedName ?? ""),
        required: Boolean(a.required),
        score_impact: contentScoreImpact,
        content_score_impact: contentScoreImpact,
        attributeType: (a.attributeType as string) ?? null,
        score_rule:
            (a.score_rule as PublicarAttribute["score_rule"]) ?? null,
        score_hint: (a.score_hint as string) ?? null,
        target: (a.target as string) || "product_data",
        value_type: packageMeta ? "number_unit" : values.length ? "list" : "string",
        values,
        units: packageMeta ? [...packageMeta.units] : undefined,
        default_unit: packageMeta?.defaultUnit,
        hint: ((a.score_hint as string) ?? (a.description as string)) || null,
        description: (a.description as string) || null,
        exampleValue: (a.exampleValue as string) || null,
        maxLength: (a.maxLength as number | string) ?? null,
    };
}

/** Normaliza un atributo ML del endpoint `/categorias/:id/atributos`. Espejo
 *  verbatim del legacy `normalizeMlCategoryAttributes()`. */
function normalizeMlCategoryAttributes(payload: unknown): PublicarAttribute[] {
    const p = (payload ?? {}) as Record<string, unknown>;
    const attrs = asArray<Record<string, unknown>>(p.atributos);
    const specs = (p.technical_specs ?? {}) as Record<string, unknown>;
    const hierarchyMap = new Map<string, { required: boolean; hierarchy?: string }>();
    asArray<Record<string, unknown>>(specs.components).forEach((component) => {
        asArray<Record<string, unknown>>(
            (component.component as Record<string, unknown>)?.groups,
        ).forEach((group) => {
            asArray<Record<string, unknown>>(group.attributes).forEach((attr) => {
                const id = String(attr.id ?? "");
                if (!id) return;
                hierarchyMap.set(id, {
                    required: Boolean(attr.required),
                    hierarchy: (attr.hierarchy as string) || "",
                });
            });
        });
    });
    const out: PublicarAttribute[] = [];
    for (const attr of attrs) {
        const tags = (attr.tags ?? {}) as Record<string, unknown>;
        if (tags.fixed) continue;
        const id = String(attr.id ?? "");
        if (!id) continue;
        const spec = hierarchyMap.get(id);
        const required = Boolean(spec?.required || tags.required);
        if (tags.hidden && !required) continue;
        const allowedUnits = asArray<Record<string, unknown> | string>(attr.allowed_units)
            .map((u) =>
                typeof u === "string" ? u : String(u.id ?? u.name ?? ""),
            )
            .filter(Boolean);
        const values = asArray<Record<string, unknown> | string>(attr.values)
            .map((v) =>
                typeof v === "string"
                    ? { id: v, name: v }
                    : { id: String(v.id ?? v.name ?? ""), name: String(v.name ?? v.id ?? "") },
            )
            .filter((v) => v.id && v.name);
        let valueType: PublicarAttribute["value_type"] = "string";
        if (allowedUnits.length) valueType = "number_unit";
        else if (values.length) valueType = "list";
        out.push({
            id,
            name: String(attr.name ?? id),
            label: String(attr.name ?? id),
            required,
            score_impact: false,
            value_type: valueType,
            values,
            units: allowedUnits,
            default_unit:
                (attr.default_unit as string) || allowedUnits[0] || undefined,
            hint:
                (tags.tooltip as string) ||
                (attr.description as string) ||
                spec?.hierarchy ||
                null,
        });
    }
    return out;
}

/** Pre-rellena `state.ml` con valores del payload_publicacion ML del backend. */
function collectMlBasicData(
    payload: Record<string, unknown> | null | undefined,
    officialStoreId: number | null,
): MLChannelData {
    const p = payload || {};
    const attrsMap: Record<string, unknown> = {};
    toArray<Record<string, unknown>>(
        asArray<Record<string, unknown>>(p.attributes),
    ).forEach((attribute) => {
        const key = attribute?.id as string;
        if (!key) return;
        attrsMap[key] = attribute?.value_name || attribute?.value_id || "";
    });
    return {
        title: (p.title as string) || "",
        description: (p.description as string) || "",
        price: (p.price as string | number) || "",
        available_quantity: (p.available_quantity as string | number) ?? "",
        condition: ((p.condition as ItemCondition) || "new") as ItemCondition,
        listing_type_id: (p.listing_type_id as string) || "gold_special",
        status: (p.status as string) || "paused",
        currency_id: (p.currency_id as string) || "CLP",
        buying_mode: (p.buying_mode as string) || "buy_it_now",
        warranty: (p.warranty as string) || "",
        family_name: (p.family_name as string) || "",
        domain_id: (p.domain_id as string) || "",
        official_store_id:
            (p.official_store_id as number | string | null) ?? officialStoreId ?? null,
        attrs: attrsMap,
    };
}

/** Pre-rellena `state.fala` con valores del payload_publicacion Fala. */
function collectFalaBasicData(
    payload: Record<string, unknown> | null | undefined,
    sku: string,
    categoryFalaId: string | null,
): FalaChannelData {
    const p = payload || {};
    const attrsMap: Record<string, unknown> = {};
    asArray<Record<string, unknown>>(p.Attributes).forEach((attribute) => {
        const key = canonicalFalaFeedName(
            (attribute?.FeedName as string) ||
            (attribute?.feedName as string) ||
            (attribute?.Name as string) ||
            "",
        );
        if (!key) return;
        attrsMap[key] = (attribute?.Value ?? attribute?.value ?? "") as unknown;
    });
    return {
        SellerSku: (p.SellerSku as string) || sku,
        PrimaryCategory:
            (p.PrimaryCategory as string) || categoryFalaId || "",
        Name: (p.Name as string) || "",
        Brand: (p.Brand as string) || "",
        Description: (p.Description as string) || "",
        Price: (p.Price as string | number) ?? "",
        Quantity: (p.Quantity as string | number) ?? "",
        Status: ((p.Status as string) || "active") as FalaChannelData["Status"],
        attrs: attrsMap,
    };
}

/** Normaliza la rama Fala del preview — filtra hidden + promueve package
 *  dims a required (decisión Mimbral). */
function normalizeFalaAttrs(raw: RawVistaPreviaResponse): {
    falaRequiredAttrs: PublicarAttribute[];
    falaOptionalAttrs: PublicarAttribute[];
} {
    const rawFaltantes = asArray<unknown>(raw.faltantes).map(
        normalizeFalaPreviewAttribute,
    );
    const rawOpcionales = asArray<unknown>(raw.opcionales).map(
        normalizeFalaPreviewAttribute,
    );

    const faltantesFiltered: PublicarAttribute[] = [];
    for (const a of rawFaltantes) {
        const fn = canonicalFalaFeedName(a.feedName ?? a.id);
        if (FALA_HIDDEN_OPTIONALS.has(fn)) continue;
        faltantesFiltered.push(a);
    }

    const opcionalesFiltered: PublicarAttribute[] = [];
    const packageDimsPromoted: PublicarAttribute[] = [];
    for (const a of rawOpcionales) {
        const fn = canonicalFalaFeedName(a.feedName ?? a.id);
        if (FALA_HIDDEN_OPTIONALS.has(fn)) continue;
        if (FALA_PACKAGE_DIMS.has(fn)) {
            packageDimsPromoted.push({ ...a, required: true });
        } else {
            opcionalesFiltered.push(a);
        }
    }

    return {
        falaRequiredAttrs: [...faltantesFiltered, ...packageDimsPromoted],
        falaOptionalAttrs: opcionalesFiltered,
    };
}

/** Mapea el `sap` raw del backend al shape de `ProductoSap`. */
function normalizeSap(raw: Record<string, unknown> | null | undefined): ProductoSap | null {
    if (!raw) return null;
    // El backend devuelve el sap con shape `{sku, nombre, marca, codeBars, n3:
    // {id, nombre, n2Nombre, n1Nombre}}` (Fala buildFalaPreview) o el equivalente
    // ML. Lo pasamos passthrough — el state lo lee como objeto opaco.
    return raw as ProductoSap;
}

/** Normaliza el endpoint `/vista-previa` al shape consumible. */
function normalizeVistaPrevia(
    raw: RawVistaPreviaResponse | null,
    channel: PublicarChannel,
    skuFallback: string,
): VistaPreviaResult | null {
    if (!raw) return null;
    const cat = raw.categoria || null;

    const categoria: MarketplaceCategory | null = cat?.id
        ? {
              id: String(cat.id),
              nombre: cat.nombre ?? undefined,
              path: cat.path ?? undefined,
              suggested: cat.suggested ?? true,
              deprecated: cat.deprecated ?? undefined,
          }
        : null;

    const result: VistaPreviaResult = {
        sku: String(raw.sku ?? skuFallback),
        sap: normalizeSap(raw.sap),
        categoria,
        rawPayload: raw.payload_publicacion || {},
        packageDimsRequired: Boolean(raw.package_dims_required),
    };

    if (channel === "fala") {
        const { falaRequiredAttrs, falaOptionalAttrs } = normalizeFalaAttrs(raw);
        result.falaRequiredAttrs = falaRequiredAttrs;
        result.falaOptionalAttrs = falaOptionalAttrs;
        result.falaScoreRules = asArray<FalaScoreRule>(raw.score_reglas);
        result.falaScoreActual = raw.score_actual ?? null;
        result.falaBasicMeta = (raw.campos_basicos_meta as Record<string, unknown>) || {};
    }

    return result;
}

// ─── Hook público ─────────────────────────────────────────────────────────────

export function usePublicarApi(): UsePublicarApi {
    const { fetchWithAuthPim, token } = useFetchWithAuthPim();
    const { user } = useAuth();
    // Patrón del proyecto (ver editor-api.ts, picking, carga masiva): el
    // front envía `userName`/`userEmail` además del `userId` para que el
    // backend escriba logs de auditoría con nombre legible sin JOIN a
    // `Perfiles`. El JWT firmado se sigue mandando como header para que
    // el backend pueda validar consistencia si quiere.
    const actorUserName = user?.nombre ?? null;
    const actorUserEmail = user?.email ?? null;

    const getVistaPrevia: UsePublicarApi["getVistaPrevia"] = useCallback(
        async (channel, sku, opts) => {
            const ch = channelToUrl(channel);
            const qs = opts?.categoriaId
                ? `?categoria_id=${encodeURIComponent(opts.categoriaId)}`
                : "";
            try {
                const env = await fetchWithAuthPim<
                    ApiEnvelope<RawVistaPreviaResponse> | RawVistaPreviaResponse
                >(
                    `/api/pim/canales/${ch}/productos/${encodeURIComponent(
                        sku,
                    )}/vista-previa${qs}`,
                );
                const raw = extractSingle<RawVistaPreviaResponse>(
                    env as ApiEnvelope<RawVistaPreviaResponse>,
                );
                return normalizeVistaPrevia(raw, channel, sku);
            } catch (e) {
                const err = e as { status?: number };
                if (err?.status === 404) return null;
                throw e;
            }
        },
        [fetchWithAuthPim],
    );

    const fetchFichaProducto: UsePublicarApi["fetchFichaProducto"] = useCallback(
        async (sku, canalDestino) => {
            const ch = canalDestino === "fala" ? "falabella" : "mercadolibre";
            try {
                const env = await fetchWithAuthPim<{ ok?: boolean; data?: FichaMaestra | null }>(
                    `/api/pim/productos/${encodeURIComponent(sku)}/ficha?canalDestino=${ch}`,
                );
                return env?.data ?? null;
            } catch (e) {
                const err = e as { status?: number };
                if (err?.status === 404) return null;
                return null; // precarga es best-effort: nunca rompe el wizard
            }
        },
        [fetchWithAuthPim],
    );

    const fetchMlCategoryAttributes: UsePublicarApi["fetchMlCategoryAttributes"] = useCallback(
        async (categoryId) => {
            try {
                const raw = await fetchWithAuthPim<unknown>(
                    `/api/pim/ml/categorias/${encodeURIComponent(
                        categoryId,
                    )}/atributos`,
                );
                return normalizeMlCategoryAttributes(raw);
            } catch (e) {
                const err = e as { status?: number };
                if (err?.status === 404) return [];
                throw e;
            }
        },
        [fetchWithAuthPim],
    );

    const fetchOfficialStoreId: UsePublicarApi["fetchOfficialStoreId"] = useCallback(
        async () => {
            try {
                interface OfficialStoreResponse {
                    default_official_store_id?: number | null;
                    configured_official_store_id?: number | null;
                }
                const json = await fetchWithAuthPim<OfficialStoreResponse>(
                    "/api/pim/ml/tiendas-oficiales",
                );
                return (
                    json?.default_official_store_id ??
                    json?.configured_official_store_id ??
                    null
                );
            } catch {
                return null;
            }
        },
        [fetchWithAuthPim],
    );

    const fetchFalaPreviewForCategory: UsePublicarApi["fetchFalaPreviewForCategory"] = useCallback(
        async (rawSku, categoriaId) => {
            const sku = String(rawSku || "").trim();
            if (!sku) throw new Error("SKU requerido");
            if (categoriaId == null || String(categoriaId).trim() === "") {
                throw new Error("categoriaId requerido");
            }
            const preview = await getVistaPrevia("fala", sku, {
                categoriaId: String(categoriaId),
            });
            if (!preview) {
                throw new Error(`Sin preview Falabella para SKU ${sku}`);
            }
            return {
                falaRequiredAttrs: preview.falaRequiredAttrs ?? [],
                falaOptionalAttrs: preview.falaOptionalAttrs ?? [],
                falaScoreRules: preview.falaScoreRules ?? [],
                falaScoreActual: preview.falaScoreActual ?? null,
                falaBasicMeta: preview.falaBasicMeta ?? {},
                falaPayload: preview.rawPayload,
            };
        },
        [getVistaPrevia],
    );

    const lookupSkuState: UsePublicarApi["lookupSkuState"] = useCallback(
        async (channel, rawSku, officialStoreId = null) => {
            const sku = String(rawSku || "").trim();
            if (!sku) throw new Error("Ingresa un SKU");

            // Solo pegamos vista-previa del canal activo — el OMS está por
            // canal (no como el legacy que carga ambos en paralelo).
            const preview = await getVistaPrevia(channel, sku);
            if (!preview || !preview.sap) {
                throw new Error(`No se pudo cargar el SKU ${sku}`);
            }

            const category =
                channel === "ml" ? preview.categoria : null;
            const categoryFala =
                channel === "fala" ? preview.categoria : null;

            // ML attrs vienen por separado (fetchMlCategoryAttributes)
            const mlAvailableAttrs =
                channel === "ml" && category?.id
                    ? await fetchMlCategoryAttributes(category.id).catch(() => [])
                    : [];

            return {
                sku,
                sap: preview.sap,
                category,
                categoryFala,
                mlAvailableAttrs: [...mlAvailableAttrs],
                falaRequiredAttrs: preview.falaRequiredAttrs ?? [],
                falaOptionalAttrs: preview.falaOptionalAttrs ?? [],
                falaScoreRules: preview.falaScoreRules ?? [],
                falaScoreActual: preview.falaScoreActual ?? null,
                falaBasicMeta: preview.falaBasicMeta ?? {},
                ml:
                    channel === "ml"
                        ? collectMlBasicData(preview.rawPayload, officialStoreId)
                        : ({} as MLChannelData),
                fala:
                    channel === "fala"
                        ? collectFalaBasicData(
                              preview.rawPayload,
                              sku,
                              categoryFala?.id ?? null,
                          )
                        : ({} as FalaChannelData),
            };
        },
        [getVistaPrevia, fetchMlCategoryAttributes],
    );

    const searchCategorias: UsePublicarApi["searchCategorias"] = useCallback(
        async (q, channel) => {
            // ML: `/api/pim/ml/categorias/buscar?solo_hojas=1` (proxy a MeliCatalog).
            // Fala: `/api/pim/categorias/buscar?marketplace=falabella` (local DB).
            // Mandar `marketplace=ml` causa ERR_EMPTY_RESPONSE (Joi rechaza).
            if (channel === "ml") {
                const params = new URLSearchParams({ q, solo_hojas: "1" });
                try {
                    const env = await fetchWithAuthPim<
                        ApiEnvelope<ReadonlyArray<RawMlCategory>>
                    >(`/api/pim/ml/categorias/buscar?${params.toString()}`);
                    const raw = extractList<RawMlCategory>(env);
                    return raw.map((c) => ({
                        id: String(c.id ?? ""),
                        nombre: c.nombre || undefined,
                        path: c.path || undefined,
                    }));
                } catch (e) {
                    const err = e as { status?: number };
                    if (err?.status === 404) return [];
                    throw e;
                }
            }
            const params = new URLSearchParams({ q, marketplace: "falabella" });
            try {
                const env = await fetchWithAuthPim<
                    ApiEnvelope<ReadonlyArray<RawFalaCategory>>
                >(`/api/pim/categorias/buscar?${params.toString()}`);
                const raw = extractList<RawFalaCategory>(env);
                return raw.map((c) => {
                    const fullName = String(c.marketplaceCategoriaNombre ?? "").trim();
                    const parts = fullName.split(">").map((p) => p.trim()).filter(Boolean);
                    const leaf = parts.length ? parts[parts.length - 1]! : fullName;
                    return {
                        id: String(c.marketplaceCategoriaId ?? ""),
                        nombre: leaf,
                        path: fullName,
                    };
                });
            } catch (e) {
                const err = e as { status?: number };
                if (err?.status === 404) return [];
                throw e;
            }
        },
        [fetchWithAuthPim],
    );

    const getCalidad: UsePublicarApi["getCalidad"] = useCallback(
        async (channel, sku) => {
            const ch = channelToUrl(channel);
            try {
                const env = await fetchWithAuthPim<
                    ApiEnvelope<{ score: number; missing?: string[] }>
                >(
                    `/api/pim/canales/${ch}/productos/${encodeURIComponent(
                        sku,
                    )}/calidad`,
                );
                return extractSingle(env) ?? { score: 0 };
            } catch (e) {
                const err = e as { status?: number };
                if (err?.status === 404) return { score: 0 };
                throw e;
            }
        },
        [fetchWithAuthPim],
    );

    const uploadImagen: UsePublicarApi["uploadImagen"] = useCallback(
        async (file, channel) => {
            // Multipart — no podemos usar fetchWithAuthPim (setea Content-Type JSON).
            const base = URL_PIM_SERVICE || "";
            // Cloudinary único (host neutral): los dos canales suben al mismo endpoint.
            // ML publica luego desde la URL (pictures:[{source}]) y el diagnóstico corre
            // por picture_url. Se deja de usar /api/pim/ml/imagenes (mlstatic).
            const path = "/api/pim/imagenes";
            const url = `${base.replace(/\/+$/, "")}${path}`;
            const t = pickToken(token);
            const fd = new FormData();
            fd.append("file", file);
            // Auditoría — quién subió la imagen.
            const uploadedBy = Number(user?.id) || 0;
            if (uploadedBy) fd.append("uploadedBy", String(uploadedBy));
            if (actorUserName) fd.append("userName", actorUserName);
            if (actorUserEmail) fd.append("userEmail", actorUserEmail);
            const headers: Record<string, string> = { "x-plataforma-id": "1" };
            if (t) headers.Authorization = `Bearer ${t}`;
            const res = await fetch(url, { method: "POST", body: fd, headers });
            if (!res.ok) {
                let detail: { message?: string } = {};
                try {
                    detail = await res.json();
                } catch {
                    /* empty */
                }
                throw new Error(detail?.message ?? `HTTP ${res.status} al subir imagen`);
            }
            // ML devuelve shape snake_case (`secure_url`, `picture_id`) — el
            // backend lo proxea passthrough. Acá normalizamos a camelCase para
            // que `ImageTile` lo lea desde `secureUrl`/`pictureId` correctamente.
            // También aceptamos camelCase si el backend ya lo mapea.
            interface RawMlPicture {
                id?: string;
                picture_id?: string;
                pictureId?: string;
                secure_url?: string;
                secureUrl?: string;
                url?: string;
                source?: string;
                variations?: Array<{ secure_url?: string; url?: string; size?: string }>;
            }
            const env: ApiEnvelope<RawMlPicture> | RawMlPicture = await res.json();
            const raw = extractSingle<RawMlPicture>(env);
            // Si hay variations, preferimos la de mayor tamaño (típicamente la
            // primera o la última según ML). Para preview tomamos cualquiera.
            const variationUrl = raw.variations?.[0]?.secure_url || raw.variations?.[0]?.url;
            const normalized: UploadedImage = {
                id: raw.id ?? raw.picture_id ?? raw.pictureId,
                pictureId: raw.picture_id ?? raw.pictureId ?? raw.id,
                secureUrl: raw.secure_url ?? raw.secureUrl ?? variationUrl,
                url: raw.url ?? raw.source ?? raw.secure_url ?? raw.secureUrl ?? variationUrl,
            };
            return normalized;
        },
        [token, user?.id, actorUserName, actorUserEmail],
    );

    const diagnosticarImagen: UsePublicarApi["diagnosticarImagen"] = useCallback(
        async ({ pictureId, pictureUrl, categoryId, title, pictureType }) => {
            try {
                const env = await fetchWithAuthPim<ApiEnvelope<ImageDiagnostic>>(
                    "/api/pim/ml/imagenes/diagnostico",
                    { method: "POST", body: JSON.stringify({ pictureId, pictureUrl, categoryId, title, pictureType }) },
                );
                return extractSingle(env) ?? { ok: false, action: "unknown", detections: [] };
            } catch {
                return { ok: false, action: "unknown", detections: [] }; // no bloquear
            }
        },
        [fetchWithAuthPim],
    );

    const fetchCuentaCanal: UsePublicarApi["fetchCuentaCanal"] = useCallback(
        async (channel) => {
            // PIM es el orquestador: pega a /api/pim/canales/:channel/cuenta y PIM
            // resuelve SalesChannel→Account internamente. El front NO hace matching
            // de nombres ni conoce ids — solo pregunta por canal.
            interface RawCuenta {
                Id?: number;
                SalesChannelId?: number;
                SalesChannelName?: string;
                ReferenceId?: string;
                Name?: string;
                EcommerceName?: string;
                Status?: boolean | number;
            }
            const ch = channelToUrl(channel);
            try {
                const env = await fetchWithAuthPim<
                    ApiEnvelope<RawCuenta> | RawCuenta
                >(`/api/pim/canales/${ch}/cuenta`);
                const match = extractSingle<RawCuenta>(env as ApiEnvelope<RawCuenta>);
                if (!match || match.Id == null) return null;
                return {
                    id: Number(match.Id),
                    name: String(match.Name ?? ""),
                    referenceId: String(match.ReferenceId ?? ""),
                    salesChannelId:
                        match.SalesChannelId != null ? Number(match.SalesChannelId) : null,
                    salesChannelName: match.SalesChannelName ?? null,
                    ecommerceName: match.EcommerceName ?? null,
                };
            } catch {
                // 404 (sin cuenta) / red → degradamos a null; la UI muestra "—".
                return null;
            }
        },
        [fetchWithAuthPim],
    );

    const publishMlTest: UsePublicarApi["publishMlTest"] = useCallback(
        async (payload) => {
            const env = await fetchWithAuthPim<ApiEnvelope<PublicarResult>>(
                "/api/pim/ml/publicar-prueba",
                {
                    method: "POST",
                    body: JSON.stringify({
                        ...payload,
                        userName: actorUserName,
                        userEmail: actorUserEmail,
                    }),
                },
            );
            return extractSingle(env) ?? { ok: false };
        },
        [fetchWithAuthPim, actorUserName, actorUserEmail],
    );

    const publicar: UsePublicarApi["publicar"] = useCallback(
        async (channel, sku, body, opts) => {
            const ch = channelToUrl(channel);
            const headers: Record<string, string> = {};
            if (opts?.idempotencyKey) {
                headers["Idempotency-Key"] = opts.idempotencyKey;
            }
            const env = await fetchWithAuthPim<ApiEnvelope<PublicarResult>>(
                `/api/pim/canales/${ch}/productos/${encodeURIComponent(
                    sku,
                )}/publicar`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        ...body,
                        userName: actorUserName,
                        userEmail: actorUserEmail,
                    }),
                },
            );
            return extractSingle(env) ?? { ok: false };
        },
        [fetchWithAuthPim, actorUserName, actorUserEmail],
    );

    const reintentar: UsePublicarApi["reintentar"] = useCallback(
        async (channel, sku, opts) => {
            const ch = channelToUrl(channel);
            const headers: Record<string, string> = {};
            if (opts?.idempotencyKey) {
                headers["Idempotency-Key"] = opts.idempotencyKey;
            }
            const triggeredBy = Number(user?.id) || null;
            const env = await fetchWithAuthPim<ApiEnvelope<PublicarResult>>(
                `/api/pim/canales/${ch}/productos/${encodeURIComponent(
                    sku,
                )}/reintentar`,
                {
                    method: "POST",
                    headers,
                    // reintentar no tenía body — agregamos `triggeredBy` +
                    // datos de actor para auditar quién relanzó el retry.
                    body: JSON.stringify({
                        triggeredBy,
                        userName: actorUserName,
                        userEmail: actorUserEmail,
                    }),
                },
            );
            return extractSingle(env) ?? { ok: false };
        },
        [fetchWithAuthPim, user?.id, actorUserName, actorUserEmail],
    );

    return useMemo(
        () => ({
            lookupSkuState,
            getVistaPrevia,
            fetchFichaProducto,
            fetchFalaPreviewForCategory,
            fetchOfficialStoreId,
            searchCategorias,
            fetchMlCategoryAttributes,
            getCalidad,
            uploadImagen,
            diagnosticarImagen,
            fetchCuentaCanal,
            publishMlTest,
            publicar,
            reintentar,
        }),
        [
            lookupSkuState,
            getVistaPrevia,
            fetchFichaProducto,
            fetchFalaPreviewForCategory,
            fetchOfficialStoreId,
            searchCategorias,
            fetchMlCategoryAttributes,
            getCalidad,
            uploadImagen,
            diagnosticarImagen,
            fetchCuentaCanal,
            publishMlTest,
            publicar,
            reintentar,
        ],
    );
}
