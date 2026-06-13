// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/elegibilidad.ts
//
// Normalización pura: promos de un ítem → buckets por estado + warnings.
// Warnings SOLO reglas documentadas. NO inventar precedencias.

import type { RawPromotionItem } from "../api/ofertas-api";
import type {
    OfferPublication,
    PublicationEligibility,
    EligibilityWarning,
} from "../types/elegibilidad-types";

const RAISE_PRICE_DROPS = new Set<string>([
    "MARKETPLACE_CAMPAIGN",
    "VOLUME",
    "PRICE_DISCOUNT",
    "SELLER_CAMPAIGN",
]);

export function toEligibility(
    publication: OfferPublication,
    promotions: RawPromotionItem[],
): PublicationEligibility {
    const puedeOptar = promotions.filter((p) => p.status === "candidate");
    const participa = promotions.filter((p) => p.status === "started");
    const programada = promotions.filter((p) => p.status === "pending");

    const warnings: EligibilityWarning[] = [];

    const dealActivo = promotions.some(
        (p) => p.type === "DEAL" && (p.status === "started" || p.status === "pending"),
    );
    const priceDiscountPresente = promotions.some(
        (p) =>
            p.type === "PRICE_DISCOUNT" &&
            (p.status === "candidate" || p.status === "started"),
    );
    if (dealActivo && priceDiscountPresente) {
        warnings.push({ kind: "price_discount_standby" });
    }

    const tieneActivaQueCae = promotions.some(
        (p) => p.status === "started" && p.type != null && RAISE_PRICE_DROPS.has(p.type),
    );
    if (tieneActivaQueCae) warnings.push({ kind: "raise_price_drops" });

    if (promotions.some((p) => p.type === "PRICE_MATCHING_MELI_ALL")) {
        warnings.push({ kind: "meli_all_auto" });
    }

    return { publication, puedeOptar, participa, programada, warnings };
}
