// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/helpers/pricing.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// ofertas/helpers/pricing.ts`. Helpers de cálculo de precios para el wizard
// y el modal de inscripción.

export function priceFromDiscount(orig: number, pct: number): number {
    const v = Math.round(orig * (1 - pct / 100));
    return Math.max(0, v);
}

export function discountFromPrice(orig: number, newPrice: number): number {
    if (!orig) return 0;
    return Math.round(((orig - newPrice) / orig) * 100);
}

/**
 * Para SELLER_CAMPAIGN con `top_deal_price` (loyalty Mercado Puntos 3–6):
 * - Si descuento general < 35%: top_deal extra mínimo 5%.
 * - Si descuento general ≥ 35%: top_deal extra mínimo 10%.
 *
 * Fuente: pim-service/CLAUDE.md → "Promociones ML / Trampas críticas / 2".
 */
export function topDealMinExtra(generalDiscount: number): number {
    return generalDiscount >= 35 ? 10 : 5;
}
