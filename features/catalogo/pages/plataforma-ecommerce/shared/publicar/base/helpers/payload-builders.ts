// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/helpers/payload-builders.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/payloadBuilders.ts`. Genera el body exacto que ML/Sellercenter
// esperan a partir del state del wizard.
//
// Cambio respecto al legacy: tipado TS estricto (el legacy usa `any`).
// Comportamiento IDÉNTICO — si esto diverge del legacy, ML/Fala rechazan 400.

import {
    canonicalFalaFeedName,
    FALA_TOP_LEVEL_ATTRS,
    ML_PACKAGE_FIELDS,
    toArray,
} from "./constants";
import type {
    FalaChannelData,
    MLChannelData,
    PublicarAttribute,
    PublicarState,
    UploadedImage,
} from "../types/publicar-types";

interface MlPicture {
    source?: string;
    id?: string;
}

interface MlAttributePayload {
    id?: string;
    value_id?: string;
    value_name?: unknown;
}

interface FalaAttributePayload {
    Name?: string;
    FeedName?: string;
    Value?: unknown;
    Target?: string;
}

/**
 * Construye el array `pictures` de ML a partir de las imágenes subidas.
 *
 * Ordén de preferencia por imagen:
 *   1. `pictureId` → `{ id: <pictureId> }` (ID nativo de ML — evita re-descarga y
 *      mantiene el payload ML idéntico al que ya funciona)
 *   2. `secureUrl` → `{ source: <url> }` (URL pública en mlstatic.com)
 *   3. `url` → `{ source: <url> }` (fallback)
 *   4. Si no hay ninguno → `null` y se filtra
 *
 * Nota: `secureUrl` SÍ es necesario para Falabella (ver buildFalaImages); por eso
 * ahora se captura siempre (fix de mlstatic variations). Acá ML lo deja de fallback
 * para no cambiar su payload probado.
 */
export function buildMlPictures(images: UploadedImage[] = []): MlPicture[] {
    return toArray<UploadedImage>(images)
        .map((image): MlPicture | null => {
            if (image?.pictureId) return { id: image.pictureId };
            if (image?.secureUrl) return { source: image.secureUrl };
            if (image?.url) return { source: image.url };
            return null;
        })
        .filter((p): p is MlPicture => p != null);
}

/**
 * Construye el array `Images` de Falabella (lista de URLs HTTPS públicas).
 * Falabella acepta cualquier URL HTTPS — usamos los mismos uploads de ML.
 */
export function buildFalaImages(images: UploadedImage[] = []): string[] {
    return toArray<UploadedImage>(images)
        .map((image) => image?.secureUrl || image?.url || null)
        .filter((url): url is string => url != null);
}

/**
 * Construye el payload completo para `POST /api/pim/canales/mercadolibre/
 * productos/:sku/publicar`. Espejo verbatim del legacy.
 *
 * El backend espera el shape `{site_id, title, category_id, price, currency_id,
 * available_quantity, buying_mode, listing_type_id, condition, status, pictures,
 * attributes, description?, warranty?, family_name?, domain_id?,
 * official_store_id?}`. Sin alguno de los required, ML rechaza 400.
 */
export function buildMlPayload(state: PublicarState): Record<string, unknown> {
    const attrs: MlAttributePayload[] = [];
    const ml: MLChannelData = state.ml || {};

    // Atributos dinámicos de la categoría — para `value_type: 'list'`
    // tenemos que enviar tanto `value_id` como `value_name`.
    toArray<PublicarAttribute>(state.mlAvailableAttrs).forEach((attr) => {
        const value = ml.attrs?.[attr.id || ""];
        if (!value) return;

        if (attr.value_type === "list") {
            const selected = toArray(attr.values).find(
                (option) => String(option.id) === String(value),
            );
            if (selected) {
                attrs.push({
                    id: attr.id,
                    value_id: selected.id,
                    value_name: selected.name,
                });
                return;
            }
        }

        attrs.push({ id: attr.id, value_name: value });
    });

    // ML_PACKAGE_FIELDS — los 4 dims paquete ML que viven en `state.ml.attrs`
    // bajo las keys `seller_package_*`. ML los exige para publicar.
    ML_PACKAGE_FIELDS.forEach((field) => {
        const value = ml.attrs?.[field.id];
        if (value) attrs.push({ id: field.id, value_name: value });
    });

    const payload: Record<string, unknown> = {
        site_id: "MLC",
        title: ml.title || "",
        category_id: state.category?.id || "",
        price: Number(ml.price || 0),
        currency_id: ml.currency_id || "CLP",
        available_quantity: Number(ml.available_quantity || 0),
        buying_mode: ml.buying_mode || "buy_it_now",
        listing_type_id: ml.listing_type_id || "gold_special",
        condition: ml.condition || "new",
        status: ml.status || "paused",
        pictures: buildMlPictures(state.images),
        attributes: attrs,
    };

    if (ml.description && String(ml.description).trim()) {
        payload.description = { plain_text: String(ml.description) };
    }
    if (ml.warranty) payload.warranty = ml.warranty;
    if (ml.family_name) payload.family_name = ml.family_name;
    if (ml.domain_id) payload.domain_id = ml.domain_id;
    if (ml.official_store_id != null && ml.official_store_id !== "") {
        payload.official_store_id = ml.official_store_id;
    }

    return payload;
}

/**
 * Construye el payload completo para `POST /api/pim/canales/falabella/
 * productos/:sku/publicar`. Espejo verbatim del legacy.
 *
 * Sellercenter espera shape `{SellerSku, PrimaryCategory, Name, Brand,
 * Description, Price, Quantity, Status, Images, Attributes}`. Los attrs
 * dinámicos van en `Attributes[]` con shape `{Name, FeedName, Value, Target}`,
 * EXCEPTO los `FALA_TOP_LEVEL_ATTRS` que ya viajan a nivel root del payload
 * (incluirlos duplicados causa `DuplicateAttribute` en Sellercenter).
 */
/** Coerciona un valor de atributo a escalar para Falabella. Los `number_unit`
 *  del wizard se guardan como `{ number, unit }`; las opciones a veces como
 *  `{ id, name }`. Falabella espera el escalar (el número, el id/valor), no el
 *  objeto — sino llega "[object Object]" y rechaza el feed. */
function coerceFalaAttrValue(v: unknown, feedName?: string): unknown {
    if (v == null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.length ? coerceFalaAttrValue(v[0], feedName) : null;
    const o = v as Record<string, unknown>;
    const numeric = o.number ?? o.value ?? o.Value;
    if (feedName === "PackageWeight" && numeric != null && Number.isFinite(Number(numeric))) {
        return String(o.unit ?? "").toLowerCase() === "kg"
            ? Number(numeric) * 1000
            : Number(numeric);
    }
    return numeric ?? o.id ?? o.name ?? o.Name ?? null;
}

export function buildFalaPayload(state: PublicarState): Record<string, unknown> {
    const attrs: FalaAttributePayload[] = [];
    const fala: FalaChannelData = state.fala || {};
    const allAttrs = [
        ...toArray<PublicarAttribute>(state.falaRequiredAttrs),
        ...toArray<PublicarAttribute>(state.falaOptionalAttrs),
    ];

    allAttrs.forEach((attr) => {
        const key = canonicalFalaFeedName(attr.feedName || attr.id || "");
        const raw = fala.attrs?.[key] ?? fala.attrs?.[attr.feedName || attr.id || ""];
        // number_unit se guarda como { number, unit }; Falabella espera el escalar
        // (número para numberfield). Coercionamos antes de mandar — sino llega
        // "[object Object]" y Falabella lo rechaza.
        const value = coerceFalaAttrValue(raw, key);
        if (value == null || value === "" || FALA_TOP_LEVEL_ATTRS.has(key)) return;
        attrs.push({
            Name: attr.label || key,
            FeedName: key,
            Value: value,
            Target: attr.target || "product_data",
        });
    });

    const hasConditionType = attrs.some(
        (attr) => canonicalFalaFeedName(attr.FeedName || attr.Name) === "ConditionType",
    );
    if (!hasConditionType) {
        attrs.unshift({
            Name: "ConditionType",
            FeedName: "ConditionType",
            Value: "Nuevo",
            Target: "product_data",
        });
    }

    // ProductId (EAN/UPC "Código armonizado", SAP OITM.CodeBars) está en
    // FALA_HIDDEN_OPTIONALS — se oculta del wizard pero SÍ debe viajar en el
    // payload (es el código de barras del producto en Falabella). Lo inyectamos
    // acá leyendo del slot fala (poblado por collectFalaBasicData desde el
    // payload_publicacion) con fallback a SAP codeBars. EAN es un string de
    // dígitos plano (EAN-13, etc.): saneamos a solo dígitos, sin separadores.
    const hasProductId = attrs.some(
        (attr) =>
            canonicalFalaFeedName(attr.FeedName || attr.Name) === "ProductId" &&
            attr.Value != null &&
            String(attr.Value) !== "",
    );
    if (!hasProductId) {
        const rawEan = fala.attrs?.ProductId ?? state.sap?.codeBars;
        const eanDigits = String(rawEan ?? "").replace(/\D/g, "");
        if (eanDigits) {
            attrs.push({
                Name: "ProductId",
                FeedName: "ProductId",
                Value: eanDigits,
                // Target "product" (NO "product_data"): el builder XML de fcom
                // (buildProductElement) enruta target==='product' como hijo directo
                // de <Product> (donde Falabella espera ProductId, hermano de <Brand>);
                // cualquier otro valor cae en <ProductData> (sección equivocada).
                Target: "product",
            });
        }
    }

    return {
        SellerSku: fala.SellerSku || state.sku,
        PrimaryCategory: state.categoryFala?.id || fala.PrimaryCategory || "",
        Name: fala.Name || "",
        Brand: fala.Brand || "",
        Description: fala.Description || "",
        Price: Number(fala.Price || 0),
        Quantity: Number(fala.Quantity || 0),
        Status: fala.Status || "active",
        Images: buildFalaImages(state.images),
        Attributes: attrs,
    };
}
