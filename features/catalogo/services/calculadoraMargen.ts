// features/catalogo/services/calculadoraMargen.ts
//
// Cliente para POST /api/pim/calculadora/precio-sugerido (pim-service).
//
// El backend resuelve internamente:
//   1. Costo desde SAP (OITM_Products.AvgPrice via vw_producto_sap)
//   2. Categoría ML desde el cascade P0-P5 (si no se pasa categoria_override)
//   3. Llama meli-catalog-service:/calculadora/precio-sugerido con todo resuelto
//   4. Solver: 3 bandas LOW/MID/HIGH para shipping + redondeo psicológico .990
//
// Validado en prod (Mayo 2026) — Einhell SKU 026004626: cost $68.804 + margen
// 6.42% objetivo → predice $103.106; precio real en ML = $102.990. Error 0.11%.

import { URL_MIMBRAL_MAPEOS, URL_PIM_SERVICE } from "@/lib/http/endpoints";

const URL_PIM_BASE = `${(URL_PIM_SERVICE || URL_MIMBRAL_MAPEOS || "").replace(/\/+$/, "")}/api/pim`;

export interface CalculadoraPrecioRequest {
    sku: string;
    /** Fracción 0-1 (ej. 0.06 = 6%). NO porcentaje. */
    margen_objetivo: number;
    /**
     * cm. OPCIONAL: si se omite, meli-catalog las resuelve del ítem
     * (atributos SELLER_PACKAGE_*) → la lista pre-calcula con solo { sku, margen }.
     */
    dimensiones?: {
        /** cm */
        largo: number;
        /** cm */
        ancho: number;
        /** cm */
        alto: number;
    };
    /** kg. OPCIONAL: ver `dimensiones` (se resuelve del ítem si se omite). */
    peso_kg?: number;
    /** ID de categoría ML (MLC...) si quieres saltarte el cascade. */
    categoria_override?: string;
    /**
     * item_id ML (MLC...) de una publicación EXISTENTE. Cuando viene, el backend
     * resuelve el envío real por item_id (shipping_options/free?item_id) sin
     * necesitar dimensiones. Solo ML (no aplica a Falabella).
     */
    item_id?: string;
    /**
     * Precio (CLP) que se está evaluando. El backend cotiza el envío FULL al
     * precio real (ML varía el envío por precio): precio de OFERTA si está
     * vigente, si no el publicado. Solo ML, junto con item_id.
     */
    item_price?: number;
}

export interface CalculadoraDesglose {
    /** Costo del producto desde SAP AvgPrice. CLP sin IVA. */
    costo_avgprice?: number;
    /** Costo de envío estimado por ML (CLP). null/0 si el seller paga. */
    envio_clp?: number;
    /** Fixed fee de ML por publicación de bajo costo. CLP. */
    fixed_fee?: number;
    /**
     * Comisión ML como **PORCENTAJE 0-100** (ej. 13 = 13%, NO 0.13).
     * (Mayo 2026) El backend devuelve los `*_pct` siempre como porcentaje;
     * el legacy widget divide por 100 antes de usarlos. Si el cálculo te da
     * comisión 1200%, es que olvidaste el /100.
     */
    tasa_comision_pct?: number;
    /** IVA como porcentaje 0-100 (19 = 19%). */
    iva_pct?: number;
    /** Margen objetivo del request como porcentaje 0-100. */
    margen_objetivo_pct?: number;
    /** Margen efectivo logrado por el solver, porcentaje 0-100. */
    margen_efectivo_pct?: number;
    /** Utilidad neta = precio − comisión − iva − envío − fixed − costo. */
    utilidad_neta?: number;
    /** Banda de precio elegida por el solver: LOW/MID/HIGH. */
    banda?: string;
    /** Categoría ML resuelta. */
    categoria_ml?: string;
    /** De dónde salió la categoría: cascade/override/etc. */
    categoria_fuente?: string;
}

export interface CalculadoraShippingConfig {
    /** "me2" | "me1" | "custom" — modo de envío ML. */
    mode?: string;
    /** "cross_docking" | "fulfillment" | "default" — tipo logístico. */
    logistic_type?: string;
    /** Si la publicación ofrece envío gratis. */
    free_shipping?: boolean;
    /** Envío (CLP) si free_shipping=true. */
    envio_free_clp?: number | null;
    /** Envío (CLP) si free_shipping=false. */
    envio_no_free_clp?: number | null;
    /** Envíos por banda si free_shipping=true: low <9990, mid 9990-19989, high >=19990. */
    envios_free_bandas?: { low?: number; mid?: number; high?: number } | null;
    /** Envíos por banda si free_shipping=false: low <9990, mid 9990-19989, high >=19990. */
    envios_no_free_bandas?: { low?: number; mid?: number; high?: number } | null;
    /** Umbral CLP de envío gratis (19990). */
    free_shipping_min_clp?: number | null;
}

export interface CalculadoraPrecioResponse {
    /** Precio sugerido bruto antes de redondeo .990. */
    precio_sugerido: number;
    /** Precio redondeado a .990 (terminación psicológica). */
    precio_redondeado_990?: number;
    desglose?: CalculadoraDesglose;
    shipping_config?: CalculadoraShippingConfig;
    /** Inputs ya resueltos (costo desde SAP, categoría del cascade, etc.). */
    inputs_resueltos?: Record<string, unknown>;
}

interface CalculadoraErrorEnvelope {
    ok?: boolean;
    error?: string;
    message?: string;
    details?: unknown;
}

export class CalculadoraError extends Error {
    status: number;
    details: unknown;
    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "CalculadoraError";
        this.status = status;
        this.details = details;
    }
}

/**
 * Llama el endpoint y devuelve el shape canonical de la response.
 * El backend (pim-service) wrappea con `{ ok, data }` o devuelve el shape
 * pelado — manejamos ambos.
 */
export async function calcularPrecioSugerido(
    params: CalculadoraPrecioRequest,
    token?: string | null,
): Promise<CalculadoraPrecioResponse> {
    const url = `${URL_PIM_BASE}/calculadora/precio-sugerido`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
        cache: "no-store",
    });

    let json: any = null;
    try {
        json = await res.json();
    } catch {
        // ignore — manejamos abajo
    }

    if (!res.ok) {
        const env = (json ?? {}) as CalculadoraErrorEnvelope;
        const msg =
            env.message ||
            env.error ||
            `HTTP ${res.status} llamando calculadora`;
        throw new CalculadoraError(msg, res.status, env.details ?? null);
    }

    // pim-service wrappea con { ok: true, data: {...} } o devuelve shape pelado.
    const data: any = json?.data ?? json;
    if (!data || typeof data !== "object" || data.precio_sugerido == null) {
        throw new CalculadoraError(
            "Respuesta del backend inválida (falta precio_sugerido)",
            500,
            json,
        );
    }
    return data as CalculadoraPrecioResponse;
}

// ── Variante Falabella ────────────────────────────────────────────────────────
//
// Mismo endpoint (`/api/pim/calculadora/precio-sugerido`) pero con
// `marketplace: "falabella"` → pim resuelve costo + categoría y delega a
// fcom-catalog. fcom NO tiene API de envíos: comisión por categoría
// (fal_category_commission) + cofinanciamiento por peso FACTURABLE =
// max(peso_real, largo×ancho×alto/4000). NO hay default de comisión: si la
// categoría no está cargada, devuelve 422 (CalculadoraError).
//
// El shape nativo de fcom difiere del de ML (`comision_pct` vs
// `tasa_comision_pct`, sin `precio_redondeado_990`), así que lo ADAPTAMOS a
// `CalculadoraPrecioResponse` para que el modal lo renderice igual.

export interface CalculadoraFalaRequest {
    sku: string;
    /** Fracción 0-1 (ej. 0.06 = 6%). */
    margen_objetivo: number;
    /** cm. Falabella aún requiere dims (no hay enabler de auto-resolución). */
    dimensiones?: { largo: number; ancho: number; alto: number };
    /** kg */
    peso_kg?: number;
    /** ID de categoría Falabella (numérico, ej. "2068"). */
    fala_category_id?: string | number | null;
    /** Rating del seller (2|3|4|5). Default backend = 4 (Mimbral). */
    seller_rating?: number;
    costo_override?: number;
}

/** Campos extra Falabella (peso volumétrico) para mostrar en la UI. */
export interface CalculadoraFalaExtra {
    peso_real_kg?: number;
    peso_volumetrico_kg?: number;
    peso_facturable_kg?: number;
    peso_facturado?: "real" | "volumetrico";
    price_tier?: string;
}

export async function calcularPrecioSugeridoFala(
    params: CalculadoraFalaRequest,
    token?: string | null,
): Promise<CalculadoraPrecioResponse & { fala?: CalculadoraFalaExtra }> {
    const url = `${URL_PIM_BASE}/calculadora/precio-sugerido`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ marketplace: "falabella", ...params }),
        cache: "no-store",
    });

    let json: any = null;
    try {
        json = await res.json();
    } catch {
        // ignore — manejamos abajo
    }

    if (!res.ok) {
        const env = (json ?? {}) as CalculadoraErrorEnvelope;
        const msg =
            env.message || env.error || `HTTP ${res.status} llamando calculadora Falabella`;
        throw new CalculadoraError(msg, res.status, env.details ?? null);
    }

    const r: any = json?.data ?? json;
    if (!r || typeof r !== "object" || r.precio_sugerido == null) {
        throw new CalculadoraError(
            "Respuesta del backend inválida (falta precio_sugerido)",
            500,
            json,
        );
    }

    // Adaptar shape fcom → CalculadoraPrecioResponse (lo que el modal renderiza).
    return {
        precio_sugerido: r.precio_sugerido,
        // Falabella no redondea .990 en backend → el modal usa el precio bruto.
        desglose: {
            costo_avgprice: r.costo,
            envio_clp: r.envio_clp,
            fixed_fee: 0, // Falabella no cobra fee fijo por publicación
            tasa_comision_pct: r.comision_pct, // fcom lo llama comision_pct
            iva_pct: r.iva_pct,
            margen_objetivo_pct: r.margen_objetivo_pct,
            categoria_fuente: r.categoria_fuente,
        },
        fala: {
            peso_real_kg: r.peso_real_kg,
            peso_volumetrico_kg: r.peso_volumetrico_kg,
            peso_facturable_kg: r.peso_facturable_kg,
            peso_facturado: r.peso_facturado,
            price_tier: r.price_tier,
        },
    };
}

// ── Cambio de precio ML ─────────────────────────────────────────────────────────

export interface CambiarPrecioResult {
    sku: string;
    campos_actualizados?: string[];
    warnings?: string[] | null;
    errores?: Array<{ campo: string; mensaje: string; code?: string }>;
    [k: string]: unknown;
}

export interface CambiarPrecioActor {
    token?: string | null;
    userId?: number | null;
    userName?: string | null;
    userEmail?: string | null;
}

/**
 * Cambia el precio de una publicación ML (PUT real a ML vía pim → meli, con logs
 * en ml_event_log). Mismo contrato que el "Guardar" del editor. Solo ML.
 * El backend maneja oferta/deal (403 → mensaje claro).
 */
export async function cambiarPrecioMl(
    sku: string,
    precio: number,
    actor: CambiarPrecioActor = {},
): Promise<CambiarPrecioResult> {
    const url = `${URL_PIM_BASE}/productos/${encodeURIComponent(sku)}`;
    const idemKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `calc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const body: Record<string, unknown> = { marketplace: "ml", cambios: { precio } };
    if (actor.userId != null) {
        body.userId = actor.userId;
        body.userName = actor.userName ?? null;
        body.userEmail = actor.userEmail ?? null;
    }
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idemKey,
            ...(actor.token ? { Authorization: `Bearer ${actor.token}` } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });
    let json: any = null;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok) {
        const msg = json?.message || json?.error || `No se pudo cambiar el precio (HTTP ${res.status})`;
        throw new CalculadoraError(msg, res.status, json);
    }
    const data = json?.data ?? json;
    if (Array.isArray(data?.errores) && data.errores.length > 0) {
        const msg = data.errores.map((e: any) => e?.mensaje || e?.campo).join("; ");
        throw new CalculadoraError(msg, 200, data);
    }
    return data as CambiarPrecioResult;
}

// ── Cambio de precio Falabella (feed-async) ─────────────────────────────────────

export interface CambiarPrecioFalaResult extends CambiarPrecioResult {
    /** feed_id del ProductUpdate Sellercenter (async). Lo pollea FeedStatusCard. */
    feed_id?: string;
}

/**
 * Cambia el precio de un producto Falabella reusando el PUT del editor
 * (PUT /api/pim/productos/:sku con marketplace:"falabella"). Dispara un
 * ProductUpdate ASÍNCRONO en Sellercenter y devuelve un `feed_id` para pollear.
 * NO espera la resolución del feed — el caller usa FeedStatusCard con ese feed_id.
 */
export async function cambiarPrecioFala(
    sku: string,
    precio: number,
    actor: CambiarPrecioActor = {},
): Promise<CambiarPrecioFalaResult> {
    const url = `${URL_PIM_BASE}/productos/${encodeURIComponent(sku)}`;
    const idemKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `calcfala-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const body: Record<string, unknown> = {
        marketplace: "falabella",
        cambios: { precio },
    };
    if (actor.userId != null) {
        body.userId = actor.userId;
        body.userName = actor.userName ?? null;
        body.userEmail = actor.userEmail ?? null;
    }
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idemKey,
            ...(actor.token ? { Authorization: `Bearer ${actor.token}` } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
    });
    let json: any = null;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok) {
        const msg = json?.message || json?.error || `No se pudo cambiar el precio (HTTP ${res.status})`;
        throw new CalculadoraError(msg, res.status, json);
    }
    const data = json?.data ?? json;
    if (Array.isArray(data?.errores) && data.errores.length > 0) {
        const msg = data.errores.map((e: any) => e?.mensaje || e?.campo).join("; ");
        throw new CalculadoraError(msg, 200, data);
    }
    return data as CambiarPrecioFalaResult;
}

// ── Historial de precio ─────────────────────────────────────────────────────────

export interface HistorialPrecioEntry {
    id: string | number;
    createdAt: string;
    precioOld: number | null;
    precioNew: number | null;
    userName: string | null;
    oferta?: { tiene_oferta: boolean; nombre: string | null; deal_ids: string[] } | null;
    /** Falabella: feed Sellercenter del ProductUpdate (null/ausente en ML). */
    feedId?: string | null;
    /** Falabella: estado del evento/feed (SINCRONIZADO|RECHAZADO|FEED_ENVIADO|ENCOLADO|…). */
    estado?: string | null;
}

function parseMaybeJson(v: unknown): any {
    if (v == null) return null;
    if (typeof v === "object") return v;
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } }
    return null;
}

/** Historial de cambios de PRECIO de un SKU (filtra el audit a entradas con precio). Solo ML. */
export async function fetchHistorialPrecio(
    sku: string,
    token?: string | null,
): Promise<HistorialPrecioEntry[]> {
    const url = `${URL_PIM_BASE}/productos/${encodeURIComponent(sku)}/audit?marketplace=ml&limit=100&includePayload=1`;
    const res = await fetch(url, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        cache: "no-store",
    });
    if (!res.ok) {
        if (res.status === 501) return [];
        let j: any = null; try { j = await res.json(); } catch { /* */ }
        throw new CalculadoraError(j?.message || `No se pudo cargar el historial (HTTP ${res.status})`, res.status, j);
    }
    const json: any = await res.json().catch(() => null);
    const rows: any[] = Array.isArray(json) ? json : (json?.data ?? []);
    const out: HistorialPrecioEntry[] = [];
    for (const r of rows) {
        const vo = parseMaybeJson(r.values_old);
        const vn = parseMaybeJson(r.values_new);
        const precioOld = vo && vo.precio != null ? Number(vo.precio) : null;
        const precioNew = vn && vn.precio != null ? Number(vn.precio) : null;
        if (precioOld == null && precioNew == null) continue;
        if (precioOld != null && precioNew != null && precioOld === precioNew) continue;
        out.push({
            id: r.id,
            createdAt: r.created_at,
            precioOld,
            precioNew,
            userName: r.user_name ?? null,
            oferta: vn && vn.oferta ? vn.oferta : null,
        });
    }
    return out;
}

/**
 * Historial de cambios de PRECIO de lista de un SKU Falabella. Lee `dbo.price_events`
 * vía GET /api/pim/productos/:sku/price-events. A diferencia del audit
 * (`fal_product_audit`, solo cambios manuales), price_events captura TODAS las
 * fuentes (manual, sync, oferta) → historial completo. Columnas planas
 * `precio_old`/`precio_new` (no JSON). `source` (manual|sync|oferta_inicio|…) se
 * mapea a `estado`. Se filtran las filas que no movieron el precio de lista
 * (p.ej. inicio/fin de oferta), para que "volver a este precio" tenga sentido.
 */
export async function fetchHistorialPrecioFala(
    sku: string,
    token?: string | null,
): Promise<HistorialPrecioEntry[]> {
    const url = `${URL_PIM_BASE}/productos/${encodeURIComponent(sku)}/price-events?limit=100`;
    const res = await fetch(url, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        cache: "no-store",
    });
    if (!res.ok) {
        if (res.status === 501) return [];
        let j: any = null; try { j = await res.json(); } catch { /* */ }
        throw new CalculadoraError(j?.message || `No se pudo cargar el historial (HTTP ${res.status})`, res.status, j);
    }
    const json: any = await res.json().catch(() => null);
    const rows: any[] = Array.isArray(json) ? json : (json?.data ?? []);
    const out: HistorialPrecioEntry[] = [];
    for (const r of rows) {
        const precioOld = r.precio_old != null ? Number(r.precio_old) : null;
        const precioNew = r.precio_new != null ? Number(r.precio_new) : null;
        if (precioOld == null && precioNew == null) continue;
        if (precioOld != null && precioNew != null && precioOld === precioNew) continue;
        out.push({
            id: r.id,
            createdAt: r.created_at,
            precioOld,
            precioNew,
            userName: r.changed_by_name ?? null,
            oferta: null,
            feedId: null,
            estado: r.source ?? null,
        });
    }
    return out;
}
