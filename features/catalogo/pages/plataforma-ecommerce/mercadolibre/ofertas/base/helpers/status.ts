// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/status.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/helpers/status.ts`. Status de campañas + labels visuales para chips
// de tipo.

import type {
    Campaign,
    CampaignStatus,
    MLPromotionType,
} from "../types/oferta-types";
import { asDate } from "../types/oferta-types";
import { today } from "./format";

export function statusOf(camp: Campaign): CampaignStatus {
    if (camp.draft) return "draft";
    if (camp.paused) return "paused";
    const t = today();
    const start = asDate(camp.start_date);
    const end = asDate(camp.end_date);
    if (start && start > t) return "scheduled";
    if (end && end < t) return "ended";
    return "active";
}

/** Labels para el pill de status. */
export const STATUS_LABEL: Readonly<Record<CampaignStatus, string>> = {
    active: "Activa",
    scheduled: "Programada",
    ended: "Finalizada",
    paused: "Pausada",
    draft: "Borrador",
};

export const TYPE_LABEL: Readonly<Record<MLPromotionType, string>> = {
    DEAL: "Invitación oficial",
    MARKETPLACE_CAMPAIGN: "Co-fondeada ML",
    VOLUME: "Por cantidad",
    DOD: "Oferta del día",
    LIGHTNING: "Oferta relámpago",
    PRE_NEGOTIATED: "Pre-acordada",
    SELLER_CAMPAIGN: "Vendedor",
    SMART: "Inteligente",
    PRICE_MATCHING: "Igualación de precios",
    PRICE_MATCHING_MELI_ALL: "Igualación automática",
    UNHEALTHY_STOCK: "Liquidación Full",
    PRICE_DISCOUNT: "Descuento simple",
    SELLER_COUPON_CAMPAIGN: "Cupones",
    BANK: "Por método de pago",
};

export interface TypeChipColor {
    readonly bg: string;
    readonly fg: string;
    readonly bd: string;
}

const PALETTE_ORANGE: TypeChipColor = { bg: "#FFF3E0", fg: "#9E5300", bd: "#FFD9A0" };
const PALETTE_BLUE: TypeChipColor = { bg: "#E8EFFA", fg: "#14365E", bd: "#BDD0EC" };
const PALETTE_RED: TypeChipColor = { bg: "#FDECEE", fg: "#A8121F", bd: "#F4B5BC" };
const PALETTE_GREEN: TypeChipColor = { bg: "#EAF5EE", fg: "#1F5631", bd: "#B8DCC4" };
const PALETTE_PURPLE: TypeChipColor = { bg: "#EEF1FA", fg: "#3F4B85", bd: "#C7CEE9" };
const PALETTE_YELLOW: TypeChipColor = { bg: "#FFF8E1", fg: "#7A5C00", bd: "#FFE39A" };

export const TYPE_COLOR: Readonly<Record<MLPromotionType, TypeChipColor>> = {
    DEAL: PALETTE_ORANGE,
    MARKETPLACE_CAMPAIGN: PALETTE_PURPLE,
    VOLUME: PALETTE_BLUE,
    DOD: PALETTE_RED,
    LIGHTNING: PALETTE_RED,
    PRE_NEGOTIATED: PALETTE_PURPLE,
    SELLER_CAMPAIGN: PALETTE_BLUE,
    SMART: PALETTE_PURPLE,
    PRICE_MATCHING: PALETTE_PURPLE,
    PRICE_MATCHING_MELI_ALL: PALETTE_PURPLE,
    UNHEALTHY_STOCK: PALETTE_ORANGE,
    PRICE_DISCOUNT: PALETTE_GREEN,
    SELLER_COUPON_CAMPAIGN: PALETTE_YELLOW,
    BANK: PALETTE_BLUE,
};
