// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/wizard-publicaciones.ts
//
// Helpers puros para el Paso 2 del wizard por publicación (Ola 3·3c-bis).
// Derivan el rango creíble (min/max/sug) de una publicación a partir de las
// promos que ML devuelve por ítem, y chequean si un precio cae dentro.

import type { MlItemRange } from "../types/oferta-types";
import type { RawPromotionItem } from "../api/ofertas-api";

/**
 * Deriva el rango creíble (item-level) de una publicación a partir de las
 * entradas de `listItemPromotions(itemId)`. ML repite los campos de rango
 * (original_price + min/max/sug discounted) en cada promo del ítem; tomamos
 * la primera entrada que los traiga completos. `null` si ninguna los tiene.
 */
export function rangeFromPromotions(
    results: ReadonlyArray<RawPromotionItem>,
): MlItemRange | null {
    for (const it of results) {
        if (
            typeof it.original_price === "number" &&
            it.original_price > 0 &&
            typeof it.min_discounted_price === "number" &&
            typeof it.max_discounted_price === "number"
        ) {
            return {
                original_price: it.original_price,
                min_discounted_price: it.min_discounted_price,
                max_discounted_price: it.max_discounted_price,
                suggested_discounted_price:
                    typeof it.suggested_discounted_price === "number"
                        ? it.suggested_discounted_price
                        : null,
            };
        }
    }
    return null;
}

/**
 * Precio base de la publicación para calcular el descuento: `original_price`
 * del rango si lo conocemos, si no el precio del SKU (fallback del catálogo).
 */
export function priceForPublication(
    range: MlItemRange | null,
    fallbackPrice: number,
): number {
    return range && range.original_price > 0 ? range.original_price : fallbackPrice;
}

/**
 * ¿El precio nuevo cae dentro del rango creíble [min, max]?
 * Sin rango → `true` (no marcamos en rojo lo que no podemos verificar; ML valida
 * al inscribir). Función pura, no bloquea el submit (solo alimenta el flag visual).
 */
export function isPriceInRange(
    newPrice: number,
    range: MlItemRange | null,
): boolean {
    if (!range) return true;
    return (
        newPrice >= range.min_discounted_price &&
        newPrice <= range.max_discounted_price
    );
}
