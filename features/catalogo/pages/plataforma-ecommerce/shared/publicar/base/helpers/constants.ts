// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/helpers/constants.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/constants.ts`. Cualquier cambio acá debería replicarse allá (y al
// revés). Mantenido como port-verbatim para no introducir bugs propios.

import type { PublicarAttribute } from "../types/publicar-types";

/**
 * Campos de dimensiones del paquete ML. Step 2 los renderiza como
 * `SectionCard` con `AttrInput value_type='number_unit'`. ML rechaza items
 * sin estas dimensiones — `coverage.ts` los cuenta como required.
 */
export const ML_PACKAGE_FIELDS = [
    {
        id: "seller_package_length",
        label: "Largo paquete",
        units: ["cm", "mm", "m", "in"],
        default_unit: "cm",
        required: true,
    },
    {
        id: "seller_package_width",
        label: "Ancho paquete",
        units: ["cm", "mm", "m", "in"],
        default_unit: "cm",
        required: true,
    },
    {
        id: "seller_package_height",
        label: "Alto paquete",
        units: ["cm", "mm", "m", "in"],
        default_unit: "cm",
        required: true,
    },
    {
        id: "seller_package_weight",
        label: "Peso paquete",
        units: ["kg", "g", "lb", "oz"],
        default_unit: "kg",
        required: true,
    },
] as const;

/**
 * Campos Falabella que van a NIVEL ROOT del payload (no en `Attributes[]`).
 * Si un atributo dinámico tiene un `feedName` que cae en este Set, se OMITE
 * del array `Attributes[]` en `buildFalaPayload` para evitar duplicación
 * (Sellercenter rechaza con `DuplicateAttribute`).
 */
export const FALA_TOP_LEVEL_ATTRS: ReadonlySet<string> = new Set([
    "SellerSku",
    "PrimaryCategory",
    "Name",
    "Brand",
    "Description",
    "Price",
    "Quantity",
    "Status",
    "Images",
]);

/**
 * Atributos Falabella que NO mostramos al seller en el wizard. Compartido
 * entre Step3Recomendados (filtra del UI) y `coverage.ts` (no cuenta en el %).
 *
 * Análisis sobre 27 productos activos con score≥80 muestra que ningún seller
 * llena estos. Categorías:
 *   - Tax/shipment Colombia-only: TaxClass, ShipmentType
 *   - Logística internacional: NameEn, NameCn (Mimbral CL no exporta)
 *   - Promo (eso es campaña, no atributo): Sale*Falabella
 *   - Duplicados de basic fields del Step 2: PriceFalabella, QuantityFalabella
 *   - Operativos rara vez completados: ConditionTypeNote, ProductWarranty,
 *     SellerWarranty, ProductionCountry, PackageContent, PackagePieces,
 *     ProductosEnCombo
 *   - Variantes (Mimbral usa SKU único, no padres con variantes): ParentSku
 *   - Auto-rellenados desde SAP (sin input visible): SellerSku, ProductId
 */
export const FALA_HIDDEN_OPTIONALS: ReadonlySet<string> = new Set([
    "ConditionType",
    "CONDITIONTYPE",
    "condition_type",
    "Name",
    "Brand",
    "Description",
    "PrimaryCategory",
    "TaxClass",
    "ShipmentType",
    "NameEn",
    "NameCn",
    "SalePriceFalabella",
    "SaleStartDateFalabella",
    "SaleEndDateFalabella",
    "PriceFalabella",
    "QuantityFalabella",
    "ConditionTypeNote",
    "ProductWarranty",
    "SellerWarranty",
    "ProductionCountry",
    "PackageContent",
    "PackagePieces",
    "ProductosEnCombo",
    "ParentSku",
    "SellerSku",
    "ProductId",
]);

/**
 * Dimensiones del paquete Falabella. La API los marca `isMandatory:false`,
 * pero análisis muestra que el 100% de productos con score≥80 los completa.
 * Decisión Mimbral: forzar como obligatorios en Step 2 (`normalizeVistaPrevia`
 * los promueve de `opcionales` → `faltantes` con `required: true`).
 */
export const FALA_PACKAGE_DIMS: ReadonlySet<string> = new Set([
    "PackageHeight",
    "package_height",
    "PackageWidth",
    "package_width",
    "PackageLength",
    "package_length",
    "PackageWeight",
    "package_weight",
]);

export const FALA_PACKAGE_FIELD_META: Readonly<
    Record<string, { label: string; units: readonly string[]; defaultUnit: string }>
> = {
    PackageLength: { label: "Largo del paquete", units: ["cm"], defaultUnit: "cm" },
    PackageWidth: { label: "Ancho del paquete", units: ["cm"], defaultUnit: "cm" },
    PackageHeight: { label: "Alto del paquete", units: ["cm"], defaultUnit: "cm" },
    PackageWeight: { label: "Peso del paquete", units: ["g", "kg"], defaultUnit: "g" },
};

export function canonicalFalaFeedName(value: string | null | undefined): string {
    const key = String(value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    switch (key) {
        case "PACKAGEHEIGHT":
            return "PackageHeight";
        case "PACKAGEWIDTH":
            return "PackageWidth";
        case "PACKAGELENGTH":
            return "PackageLength";
        case "PACKAGEWEIGHT":
            return "PackageWeight";
        case "CONDITIONTYPE":
            return "ConditionType";
        case "SELLERSKU":
            return "SellerSku";
        case "PRIMARYCATEGORY":
            return "PrimaryCategory";
        case "NAME":
            return "Name";
        case "BRAND":
            return "Brand";
        case "DESCRIPTION":
            return "Description";
        case "PRICE":
            return "Price";
        case "QUANTITY":
            return "Quantity";
        case "STATUS":
            return "Status";
        default:
            return String(value ?? "");
    }
}

/** Helper utilitario para envolver en array. Port verbatim del legacy. */
export function toArray<T = unknown>(value: T | T[] | null | undefined): T[] {
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
}

/** Extrae el identificador canónico (feedName) de un atributo Fala. */
function feedNameOf(attr: PublicarAttribute): string {
    return canonicalFalaFeedName(attr.feedName ?? attr.id ?? attr.name ?? "");
}

/** True si el atributo debe ocultarse al seller (ver `FALA_HIDDEN_OPTIONALS`). */
export function isFalaHidden(attr: PublicarAttribute): boolean {
    return FALA_HIDDEN_OPTIONALS.has(feedNameOf(attr));
}

/** True si el atributo es una dimensión de paquete (ver `FALA_PACKAGE_DIMS`). */
export function isFalaPackageDim(attr: PublicarAttribute): boolean {
    return FALA_PACKAGE_DIMS.has(feedNameOf(attr));
}

/**
 * True si el atributo es de tipo `system` (name/description del producto base
 * que ya están en Step 2 — name/description vienen pre-rellenados desde SAP y
 * NO se duplican en Step 3).
 */
export function isFalaSystemAttribute(attr: PublicarAttribute): boolean {
    return attr.attributeType === "system";
}

/**
 * Particiona los atributos opcionales Falabella en 2 grupos para Step 3:
 *   - `scoreImpact`: atributos que suman al `content_score_falabella` (se
 *     muestran destacados arriba)
 *   - `moreOptional`: resto del rubro (sección "Más opciones" colapsada)
 *
 * Excluye en ambos casos: hidden, package dims (ya viven en Step 2), system
 * (name/description ya en Step 2).
 */
export function partitionFalaOptionalAttrs(
    attrs: ReadonlyArray<PublicarAttribute>,
): {
    scoreImpact: PublicarAttribute[];
    moreOptional: PublicarAttribute[];
} {
    const scoreImpact: PublicarAttribute[] = [];
    const moreOptional: PublicarAttribute[] = [];
    for (const a of attrs) {
        if (isFalaHidden(a) || isFalaPackageDim(a) || isFalaSystemAttribute(a)) {
            continue;
        }
        if (a.content_score_impact) {
            scoreImpact.push(a);
        } else {
            moreOptional.push(a);
        }
    }
    return { scoreImpact, moreOptional };
}

/**
 * Atributos ML recomendados que NO mostramos en Step3 — irrelevantes para
 * Mimbral y solo agregan ruido. Si en el futuro hay que volver a mostrarlos,
 * sacarlos de este Set. Espejo del legacy `Step3Recommended.tsx:12-19`.
 */
export const ML_HIDDEN_RECOMMENDED: ReadonlySet<string> = new Set([
    "WARRANTY_TYPE",
    "WARRANTY_TIME",
    "WARRANTY",
    "SELLER_WARRANTY",
    "MANUFACTURER_WARRANTY",
]);
