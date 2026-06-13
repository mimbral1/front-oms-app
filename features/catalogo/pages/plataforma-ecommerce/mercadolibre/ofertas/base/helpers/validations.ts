// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/validations.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/helpers/validations.ts`. Validaciones client-side antes de mandar
// al backend — evita viajes innecesarios y da feedback inmediato al usuario.
//
// Si una validación pasa client-side pero ML rechaza igual, errorMap.ts mapea
// el código real a un mensaje más específico.

import type {
    CampaignDraft,
    CampaignSku,
    CatalogSku,
    MLPromotionType,
} from "../types/oferta-types";
import { daysBetween } from "./format";
import { topDealMinExtra } from "./pricing";

export interface ValidationError {
    readonly code: string;
    readonly message: string;
    /** Path al campo del draft o SKU (para resaltar en UI). */
    readonly field?: string;
}

// ── Wizard SELLER_CAMPAIGN draft ────────────────────────────────────────────

/**
 * Validaciones del draft completo (Step 1 + Step 2). Llamado por
 * `OfertasWizard.canLaunch` antes de habilitar el botón "Lanzar campaña".
 */
export function validateCampaignDraft(draft: CampaignDraft): ValidationError[] {
    const errs: ValidationError[] = [];

    if (!draft.name?.trim()) {
        errs.push({
            code: "NAME_MISSING",
            message: "Falta el nombre de la campaña.",
            field: "name",
        });
    }
    if (!draft.start_date || !draft.end_date) {
        errs.push({
            code: "DATES_MISSING",
            message: "Faltan las fechas de inicio o fin.",
            field: "dates",
        });
    } else {
        const start =
            draft.start_date instanceof Date ? draft.start_date : new Date(draft.start_date);
        const end =
            draft.end_date instanceof Date ? draft.end_date : new Date(draft.end_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            errs.push({
                code: "DATES_INVALID",
                message: "Formato de fecha inválido.",
                field: "dates",
            });
        } else if (end < start) {
            errs.push({
                code: "DATES_INVERTED",
                message: "La fecha de fin no puede ser anterior al inicio.",
                field: "dates",
            });
        } else {
            const days = daysBetween(start, end);
            if (days > 14) {
                errs.push({
                    code: "CAMPAIGN_TOO_LONG",
                    message: `Duración (${days} días) excede el máximo de 14 días para campañas de vendedor.`,
                    field: "dates",
                });
            }
            if (days < 1) {
                errs.push({
                    code: "PERIOD_TOO_SHORT",
                    message: "La duración mínima es 1 día.",
                    field: "dates",
                });
            }
        }
    }

    if (!draft.skus || draft.skus.length === 0) {
        errs.push({
            code: "NO_SKUS",
            message: "Agrega al menos un SKU a la campaña.",
            field: "skus",
        });
    }

    for (const sku of draft.skus ?? []) {
        errs.push(...validateCampaignSku(sku));
    }

    return errs;
}

function validateCampaignSku(sku: CampaignSku): ValidationError[] {
    const errs: ValidationError[] = [];
    const d = sku.discount;

    if (d < 5 || d > 80) {
        errs.push({
            code: "buyer_discount_not_in_range",
            message: `${sku.sku}: descuento ${d}% fuera de rango (5–80%).`,
            field: `skus.${sku.sku}.discount`,
        });
    }

    if (sku.top_deal && sku.top_deal > 0) {
        const minExtra = topDealMinExtra(d);
        if (sku.top_deal < d + minExtra) {
            errs.push({
                code:
                    d >= 35
                        ? "discount_below_10_percent_difference"
                        : "discount_below_5_percent_difference",
                message: `${sku.sku}: top deal price requiere ≥ ${d + minExtra}% (general + ${minExtra}%).`,
                field: `skus.${sku.sku}.top_deal`,
            });
        }
    }

    if (sku.stock === 0) {
        errs.push({
            code: "STOCK_ZERO",
            message: `${sku.sku} no tiene stock disponible.`,
            field: `skus.${sku.sku}.stock`,
        });
    }

    return errs;
}

// ── Validaciones para modal de inscripción (con rangos ML por SKU) ──────────

export interface EnrollItemInput {
    readonly sku: CatalogSku;
    readonly selected: boolean;
    readonly discount: number;
    readonly top_deal?: number;
    readonly stock_committed?: number | null;
}

export interface EnrollContext {
    readonly type: MLPromotionType;
    readonly min_discount: number;
    readonly max_discount: number;
    readonly is_dod: boolean;
    readonly is_seller: boolean;
    readonly is_price_disc: boolean;
    readonly supports_top_deal: boolean;
    readonly min_stock_required?: number;
}

/**
 * Validación por SKU dentro del MLEnrollModal. La UI usa este resultado para
 * mostrar errores inline debajo de cada fila de la tabla.
 */
export function validateEnrollItem(
    input: EnrollItemInput,
    ctx: EnrollContext,
): ValidationError[] {
    if (!input.selected) return [];
    const errs: ValidationError[] = [];
    const r = input.sku;
    const d = input.discount;

    if (d < ctx.min_discount || d > ctx.max_discount) {
        errs.push({
            code: "buyer_discount_not_in_range",
            message: `Descuento ${d}% fuera de rango ML (${ctx.min_discount}–${ctx.max_discount}%).`,
            field: "discount",
        });
    }

    const newPrice = Math.round(r.price * (1 - d / 100));
    if (r.min_discounted_price > 0 && newPrice < r.min_discounted_price) {
        errs.push({
            code: "ERROR_CREDIBILITY_DISCOUNTED_PRICE",
            message: `Precio final $${newPrice.toLocaleString("es-CL")} bajo el mínimo permitido por ML ($${r.min_discounted_price.toLocaleString("es-CL")}).`,
            field: "discount",
        });
    }
    if (r.max_discounted_price > 0 && newPrice > r.max_discounted_price) {
        errs.push({
            code: "ERROR_CREDIBILITY_DISCOUNTED_PRICE",
            message: `Precio final $${newPrice.toLocaleString("es-CL")} sobre el máximo permitido por ML ($${r.max_discounted_price.toLocaleString("es-CL")}).`,
            field: "discount",
        });
    }

    if (ctx.is_dod) {
        const required = ctx.min_stock_required ?? 1;
        if ((input.stock_committed ?? 0) < required) {
            errs.push({
                code: "STOCK_INSUFFICIENT",
                message: `Stock comprometido insuficiente (mínimo ${required}).`,
                field: "stock_committed",
            });
        }
        if (r.stock < required) {
            errs.push({
                code: "STOCK_INSUFFICIENT",
                message: `Stock disponible (${r.stock}) menor al mínimo de campaña (${required}).`,
                field: "stock",
            });
        }
    }

    if (ctx.is_seller && ctx.supports_top_deal && (input.top_deal ?? 0) > 0) {
        const minExtra = topDealMinExtra(d);
        const needed = d + minExtra;
        if ((input.top_deal ?? 0) < needed) {
            errs.push({
                code:
                    d >= 35
                        ? "discount_below_10_percent_difference"
                        : "discount_below_5_percent_difference",
                message: `Top deal price requiere ≥ ${needed}% (descuento general + ${minExtra}%).`,
                field: "top_deal",
            });
        }
    }

    if (ctx.is_price_disc && r.has_active_promo) {
        errs.push({
            code: "PROMO_CONFLICT",
            message:
                "SKU ya tiene una promoción activa — quedará en stand-by hasta que termine.",
            field: "sku",
        });
    }

    if (r.reputation !== "green") {
        errs.push({
            code: "REPUTATION_NOT_GREEN",
            message: `Reputación del SKU es ${r.reputation} — no es elegible.`,
            field: "sku",
        });
    }

    return errs;
}
