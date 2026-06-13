// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/types/publicar-types.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/types.ts`. Cambios respecto del legacy: agregamos tipado más
// estricto donde el legacy usaba `any`. La forma de los slots ML/Fala
// es IDÉNTICA al legacy — payloadBuilders + coverage dependen de esto.

/** Canales que soportan el wizard (VTEX no — maneja sus publicaciones desde su admin). */
export type PublicarChannel = "ml" | "fala";

/**
 * Step actual del wizard.
 *
 * (Mayo 2026) Cambió la composición:
 *   - "recomendados" se eliminó como step dedicado — los atributos recomendados
 *     se muestran como sección colapsable dentro de "obligatorios".
 *   - "imagenes" pasa a ser un step propio entre "obligatorios" y "revisar"
 *     (antes vivía como Card dentro de "obligatorios").
 *
 * Orden: sku → obligatorios → imagenes → revisar
 */
export type PublicarStepId = "sku" | "obligatorios" | "imagenes" | "revisar";

/** Condición del item (ML). */
export type ItemCondition = "new" | "used" | "refurbished";

/** Estado Falabella (`Status` del producto). */
export type FalaStatus = "active" | "inactive";

/** Categoría de un marketplace (ML, Falabella). */
export interface MarketplaceCategory {
    id: string;
    nombre?: string;
    /** Path breadcrumb "N1 > N2 > N3". */
    path?: string;
    /** Si el backend marca esta categoría como "sugerida" (auto-mapping). */
    suggested?: boolean;
    /** Si ML marca la categoría como deprecada (no conviene publicar ahí). */
    deprecated?: boolean;
}

/**
 * Atributo dinámico que el wizard pide llenar. El shape viene del backend
 * (ML expone via `/api/pim/ml/categorias/:id/atributos`, Falabella vía
 * `/vista-previa` en `faltantes`/`opcionales`).
 */
export interface PublicarAttribute {
    /** Para ML: el `attributes[i].id` de la ML categoría. Para Falabella:
     *  `feedName` (alias de `FeedName`/`Name`). */
    id: string;
    /** Alias explícito del `feedName` Falabella (mismo valor que `id` en Fala,
     *  pero más legible cuando se cruza contra `FALA_HIDDEN_OPTIONALS` etc.). */
    feedName?: string;
    name?: string;
    label?: string;
    /** Si true, debe estar presente en Step 2 (obligatorios). */
    required?: boolean;
    /** Alias corto de `content_score_impact` — usado por `AttrInput` para el
     *  chip "↑ score". Mantener ambos por compat. */
    score_impact?: boolean;
    /** Canonical Falabella — si true, llenarlo sube `content_score_falabella`.
     *  Step3 lo usa para particionar entre "Recomendados" y "Más opciones". */
    content_score_impact?: boolean;
    /** Falabella: `'system' | 'value' | 'option' | 'multi_option' | null`.
     *  Step3 excluye los `'system'` (name/description ya están en Step 2). */
    attributeType?: string | null;
    /** Falabella score rule: regla que define cómo llenar para ganar puntos. */
    score_rule?: {
        field?: string;
        score?: number;
        min?: number;
        max?: number;
    } | null;
    /** Falabella score hint humano, ej. "min 1 · +6 score". */
    score_hint?: string | null;
    /** Falabella: `'product_data' | 'sku_data'`. Default `'product_data'`. */
    target?: string;
    /** Tipo de valor. Determina qué control monta `AttrInput`. */
    value_type?: "string" | "number" | "boolean" | "list" | "multi_list" | "number_unit";
    /** Opciones para tipos `list`/`multi_list`. */
    values?: Array<{ id: string; name: string }>;
    /** Unidades disponibles para `number_unit`. */
    units?: string[];
    default_unit?: string;
    /** Texto de ayuda. */
    hint?: string | null;
    /** Descripción larga (popover). */
    description?: string | null;
    /** Ejemplo. */
    exampleValue?: string | null;
    /** Max length para tipo string. */
    maxLength?: number | string | null;
}

/** Falabella score rule (raw del backend `state.falaScoreRules`). */
export interface FalaScoreRule {
    field?: string;
    score?: number;
    min?: number;
    max?: number;
    hint?: string;
}

/** Una detección de calidad de imagen del diagnóstico ML. */
export interface ImageDetection { name: string; message: string; }
/** Resultado del diagnóstico de una imagen (POST /api/pim/ml/imagenes/diagnostico). */
export interface ImageDiagnostic {
    /** false si el diagnóstico no pudo correr (red/cuota) — "no validada". */
    ok: boolean;
    /** "diagnostic" = hay problemas · "empty" = OK · "unknown" = no validada. */
    action: "diagnostic" | "empty" | "unknown";
    detections: ImageDetection[];
}

/** Imagen subida (resultado de `POST /api/pim/ml/imagenes`). */
export interface UploadedImage {
    id?: string;
    /** Data URL para preview local mientras sube. */
    dataUrl?: string;
    /** URL pública servida por el CDN del backend. */
    secureUrl?: string;
    /** ID de la imagen en ML (pictures). */
    pictureId?: string;
    /** Fallback. */
    url?: string;
    /** Resultado del diagnóstico de calidad ML (Fase 1 imágenes). */
    diagnostic?: ImageDiagnostic;
}

/**
 * Producto base obtenido de SAP via `vista-previa`. Shape mínimo — el legacy
 * usa `state.sap` como objeto opaco con `nombre`, `marca`, `codeBars`, `n3`.
 */
export interface ProductoSap {
    sku?: string;
    nombre?: string;
    marca?: string;
    codeBars?: string;
    descripcion?: string;
    precio_sap?: number;
    alto_cm?: number;
    ancho_cm?: number;
    largo_cm?: number;
    peso_kg?: number;
    n3?: {
        id?: number | string;
        nombre?: string;
        n2Nombre?: string;
        n1Nombre?: string;
    };
    /** Slot defensivo para campos no enumerados que vienen del backend. */
    [extra: string]: unknown;
}

/**
 * Slot ML del state — los campos que `buildMlPayload` espera. Espejo del
 * legacy `PublicarApp.tsx:initialState().ml`.
 */
export interface MLChannelData {
    title?: string;
    description?: string;
    /** CLP, viene del input como string — `buildMlPayload` hace `Number(...)`. */
    price?: string | number;
    /** Stock, viene del input como string. */
    available_quantity?: string | number;
    condition?: ItemCondition;
    listing_type_id?: string;
    /** `paused` | `active`. Default `paused` (legacy publica draft). */
    status?: string;
    currency_id?: string;
    /** `buy_it_now` default. */
    buying_mode?: string;
    warranty?: string;
    family_name?: string;
    domain_id?: string;
    official_store_id?: number | string | null;
    /** Mapa `{ attrId: value }` para atributos dinámicos de la categoría ML. */
    attrs?: Record<string, unknown>;
}

/**
 * Slot Falabella del state — los campos que `buildFalaPayload` espera. Espejo
 * del legacy `PublicarApp.tsx:initialState().fala`.
 */
export interface FalaChannelData {
    SellerSku?: string;
    PrimaryCategory?: string;
    Name?: string;
    Brand?: string;
    Description?: string;
    /** CLP, viene del input como string — `buildFalaPayload` hace `Number(...)`. */
    Price?: string | number;
    /** Stock, viene del input como string. */
    Quantity?: string | number;
    /** `active` | `inactive`. Default `active`. */
    Status?: FalaStatus;
    /** Mapa `{ feedName: value }` para atributos dinámicos del rubro Fala. */
    attrs?: Record<string, unknown>;
}

/**
 * Estado completo del wizard. Es el único objeto que se persiste a localStorage
 * para survive a un refresh.
 *
 * Shape IDÉNTICO al legacy `state` de `PublicarApp.tsx:initialState()` — los
 * payload builders + coverage dependen de esto.
 */
export interface PublicarState {
    step: PublicarStepId;
    /** Canal target — si el usuario va a publicar a ML, Falabella, o ambos. */
    channel: PublicarChannel;
    /** SKU interno (input del Step 1). */
    sku: string;
    /** Margen objetivo (fracción 0-1) precargado desde carga-masiva
     *  (mapped_json.margen), para seedear la calculadora. Solo carga-masiva. */
    margen?: number | null;
    /** Datos de SAP (lookup result de `vista-previa`). */
    sap?: ProductoSap | null;
    /** Categoría seleccionada en ML. */
    category?: MarketplaceCategory | null;
    /** Categoría seleccionada en Falabella. */
    categoryFala?: MarketplaceCategory | null;
    /** Imágenes subidas (compartidas ML + Fala). */
    images: UploadedImage[];

    /** Atributos disponibles ML (después de seleccionar categoría). */
    mlAvailableAttrs?: PublicarAttribute[];
    /** Atributos requeridos Falabella (faltantes + package dims promovidos). */
    falaRequiredAttrs?: PublicarAttribute[];
    /** Atributos opcionales Falabella (filtrado por `FALA_HIDDEN_OPTIONALS`,
     *  sin package dims que ya están en `falaRequiredAttrs`). */
    falaOptionalAttrs?: PublicarAttribute[];
    /** Reglas de score Falabella raw (`field/score/min/max`). */
    falaScoreRules?: FalaScoreRule[];
    /** Score actual Falabella si el backend lo expone. */
    falaScoreActual?: number | null;
    /** Meta de campos básicos Falabella (Name/Brand/Description con score). */
    falaBasicMeta?: Record<string, unknown>;

    /** Slot canonical ML — `buildMlPayload(state)` lee de acá. */
    ml: MLChannelData;
    /** Slot canonical Falabella — `buildFalaPayload(state)` lee de acá. */
    fala: FalaChannelData;

    /** Canal de origen de la ficha precargada (para el aviso "datos de tu publicación en X"). */
    fichaOrigen?: string | null;
}

/** Resumen de cobertura (porcentaje obligatorios/recomendados). */
export interface CoverageSummary {
    /** Score combinado 0–100. */
    pct: number;
    /** Atributos obligatorios que faltan (labels human-readable). */
    missing: string[];
    required_total: number;
    required_filled: number;
    recommended_total: number;
    recommended_filled: number;
}

/** Resultado de publicar al backend. */
export interface PublicarResult {
    ok: boolean;
    item_id?: string;
    sku?: string;
    /** URL del producto en el marketplace. */
    permalink?: string;
    /** Feed ID Falabella (async). */
    feed_id?: string;
    /** Errores por atributo, si la publicación parcial falló. */
    errors?: Array<{ field?: string; message: string; code?: string }>;
    /** Causes raw del backend ML (causes[].code, causes[].message). */
    causes?: Array<{ code?: string; message?: string }>;
    /** Payload raw del backend (para drawer detalle técnico). */
    data?: Record<string, unknown>;
    message?: string;
}

/** Ficha maestra neutral devuelta por GET /api/pim/productos/:sku/ficha. */
export interface FichaMaestra {
    sku: string;
    nombre: string | null;
    descripcion: string | null;
    marca: string | null;
    marca_generica: boolean;
    largo_cm: number | null;
    ancho_cm: number | null;
    alto_cm: number | null;
    peso_gr: number | null;
    ean: string | null;
    origen_canal: string | null;
    imagenes: Array<{ url: string; orden: number; es_portada: boolean }>;
}
