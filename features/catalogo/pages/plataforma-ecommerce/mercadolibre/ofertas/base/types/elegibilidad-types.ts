// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/types/elegibilidad-types.ts
//
// Tipos del Explorador de elegibilidad (Ola 3·3c). Solo lectura.

import type { RawPromotionItem } from "../api/ofertas-api";

export interface OfferPublication {
    itemId: string;
    isPrimary: boolean;
    isCatalogListing: boolean;
    catalogProductId: string | null;
    variationId: string | null;
    inventoryId: string | null;
    userProductId: string | null;
    itemStatus: string | null;
    logisticType: string | null;
}

export interface ProductMatch {
    sku: string;
    titulo: string;
    itemId?: string;
}

export type EligibilityWarning =
    | { kind: "price_discount_standby" }
    | { kind: "raise_price_drops" }
    | { kind: "meli_all_auto" };

export interface PublicationEligibility {
    publication: OfferPublication;
    puedeOptar: RawPromotionItem[];
    participa: RawPromotionItem[];
    programada: RawPromotionItem[];
    warnings: EligibilityWarning[];
}
