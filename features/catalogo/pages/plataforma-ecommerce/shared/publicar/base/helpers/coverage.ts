// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/helpers/coverage.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/coverage.ts`. Cambio respecto al legacy: tipado estricto.
//
// Cálculo de cobertura — distinto por canal. ML cuenta campos básicos
// (title/description/price/stock/category/condition/listing/images) + atributos
// requeridos categoria + ML_PACKAGE_FIELDS. Falabella cuenta basicMeta del
// preview + falaRequiredAttrs + FALA_PACKAGE_DIMS forzados a required.
//
// Los recomendados Fala solo cuentan los `content_score_impact` que no son
// `system` ni hidden ni package-dims.

import {
    canonicalFalaFeedName,
    FALA_HIDDEN_OPTIONALS,
    FALA_PACKAGE_DIMS,
    ML_PACKAGE_FIELDS,
    toArray,
} from "./constants";
import { buildMlPictures } from "./payload-builders";
import type {
    CoverageSummary,
    PublicarAttribute,
    PublicarChannel,
    PublicarState,
} from "../types/publicar-types";

/**
 * Comprueba si un valor está "lleno" según el campo. Reglas especiales:
 *   - `price` / `Price`: number > 0 (un precio en 0 NO cuenta como filled)
 *   - `available_quantity`: number > 0
 *   - `Quantity`: number >= 0 y no string vacío
 *   - `Status`: debe estar en {'active', 'inactive'}
 *   - Resto: string no vacío después de trim
 */
export function isFilledValue(key: string, value: unknown): boolean {
    if (value && typeof value === "object" && "number" in value) {
        return isFilledValue(key, (value as { number?: unknown }).number);
    }
    if (key === "price" || key === "Price") return Number(value) > 0;
    if (key === "available_quantity") return Number(value) > 0;
    if (key === "Quantity")
        return Number(value) >= 0 && String(value).trim() !== "";
    if (key === "Status")
        return ["active", "inactive"].includes(
            String(value || "")
                .trim()
                .toLowerCase(),
        );
    return String(value ?? "").trim() !== "";
}

export function computeCoverage(
    state: PublicarState,
    channel: PublicarChannel,
): CoverageSummary {
    let requiredTotal = 0;
    let requiredFilled = 0;
    let recommendedTotal = 0;
    let recommendedFilled = 0;
    const missing: string[] = [];

    if (channel === "ml") {
        const requiredBase = [
            { key: "title", label: "Título", value: state.ml?.title },
            { key: "description", label: "Descripción", value: state.ml?.description },
            { key: "price", label: "Precio", value: state.ml?.price },
            {
                key: "available_quantity",
                label: "Stock",
                value: state.ml?.available_quantity,
            },
            { key: "category_id", label: "Categoría", value: state.category?.id },
            { key: "condition", label: "Condición", value: state.ml?.condition },
            {
                key: "listing_type_id",
                label: "Listing",
                value: state.ml?.listing_type_id,
            },
            {
                key: "images",
                label: "Imágenes",
                value: buildMlPictures(state.images).length,
            },
        ];

        requiredBase.forEach((field) => {
            requiredTotal += 1;
            if (isFilledValue(field.key, field.value)) requiredFilled += 1;
            else missing.push(field.label);
        });

        toArray<PublicarAttribute>(state.mlAvailableAttrs).forEach((attr) => {
            const value = state.ml?.attrs?.[attr.id || ""];
            if (attr.required) {
                requiredTotal += 1;
                if (isFilledValue(attr.id || "", value)) requiredFilled += 1;
                else missing.push(attr.label || attr.name || attr.id || "");
                return;
            }

            recommendedTotal += 1;
            if (isFilledValue(attr.id || "", value)) recommendedFilled += 1;
        });

        ML_PACKAGE_FIELDS.forEach((field) => {
            const value = state.ml?.attrs?.[field.id];
            requiredTotal += 1;
            if (isFilledValue(field.id, value)) requiredFilled += 1;
            else missing.push(field.label);
        });
    } else {
        // Falabella
        const basicMeta = (state.falaBasicMeta || {}) as Record<
            string,
            { required?: boolean }
        >;

        Object.entries(basicMeta).forEach(([key, meta]) => {
            const canonicalKey = canonicalFalaFeedName(key);
            const value = state.fala?.[canonicalKey as keyof typeof state.fala];
            if (meta?.required) {
                requiredTotal += 1;
                if (isFilledValue(canonicalKey, value)) requiredFilled += 1;
                else missing.push(canonicalKey);
            } else {
                recommendedTotal += 1;
                if (isFilledValue(canonicalKey, value)) recommendedFilled += 1;
            }
        });

        toArray<PublicarAttribute>(state.falaRequiredAttrs).forEach((attr) => {
            const key = canonicalFalaFeedName(attr.feedName || "");
            if (FALA_HIDDEN_OPTIONALS.has(key)) return;
            const value = state.fala?.attrs?.[key];
            requiredTotal += 1;
            if (isFilledValue(key, value)) requiredFilled += 1;
            else missing.push(attr.label || key);
        });

        // PackageDims (PackageHeight/Width/Length/Weight) son técnicamente
        // opcionales en la API de Sellercenter (isMandatory:false), pero
        // Mimbral los trata como obligatorios — análisis muestra que el 100%
        // de los productos publicados con score≥80 los completa. Se cuentan
        // acá en `requiredTotal` para el cálculo de cobertura.
        toArray<PublicarAttribute>(state.falaOptionalAttrs)
            .filter((attr) =>
                FALA_PACKAGE_DIMS.has(canonicalFalaFeedName(attr.feedName || "")),
            )
            .forEach((attr) => {
                const key = canonicalFalaFeedName(attr.feedName || "");
                const value = state.fala?.attrs?.[key];
                requiredTotal += 1;
                if (isFilledValue(key, value)) requiredFilled += 1;
                else missing.push(attr.label || key);
            });

        // Solo los opcionales que (a) mueven score, (b) no son `system` (ya
        // contados como required en `basicMeta`), (c) no están en la lista de
        // ocultos (TaxClass, NameEn, etc.), (d) no son package-dims (ya
        // contados como required arriba). Los puramente opcionales sin
        // score-impact NO inflan el % de cobertura — el seller no debería
        // sentirse "incompleto" por no llenar `name_en` o `package_pieces`.
        toArray<PublicarAttribute>(state.falaOptionalAttrs)
            .filter(
                (attr) =>
                    attr.content_score_impact &&
                    attr.attributeType !== "system" &&
                    !FALA_HIDDEN_OPTIONALS.has(canonicalFalaFeedName(attr.feedName || "")) &&
                    !FALA_PACKAGE_DIMS.has(canonicalFalaFeedName(attr.feedName || "")),
            )
            .forEach((attr) => {
                const key = canonicalFalaFeedName(attr.feedName || "");
                const value = state.fala?.attrs?.[key];
                recommendedTotal += 1;
                if (isFilledValue(key, value)) recommendedFilled += 1;
            });
    }

    const total = requiredTotal + recommendedTotal;
    const filled = requiredFilled + recommendedFilled;
    return {
        pct: total ? Math.round((filled / total) * 100) : 0,
        missing,
        required_total: requiredTotal,
        required_filled: requiredFilled,
        recommended_total: recommendedTotal,
        recommended_filled: recommendedFilled,
    };
}
