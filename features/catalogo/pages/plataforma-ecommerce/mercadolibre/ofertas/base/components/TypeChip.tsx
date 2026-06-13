// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/TypeChip.tsx
//
// Pill compacta para el tipo de promoción ML. Cada tipo tiene un color
// distintivo (consistente con el dashboard.html / mockup campanas-ml.html).

import type { MLPromotionType } from "../types/oferta-types";

export interface TypeChipProps {
    type: MLPromotionType;
    className?: string;
}

const TYPE_LABEL: Record<MLPromotionType, string> = {
    DEAL: "DEAL",
    MARKETPLACE_CAMPAIGN: "MKT",
    VOLUME: "VOLUME",
    DOD: "DOD",
    LIGHTNING: "LIGHTNING",
    PRE_NEGOTIATED: "NEGOCIADA",
    SELLER_CAMPAIGN: "SELLER",
    SMART: "SMART",
    PRICE_MATCHING: "PRICE_MATCH",
    PRICE_MATCHING_MELI_ALL: "PRICE_ALL",
    UNHEALTHY_STOCK: "UNHEALTHY",
    PRICE_DISCOUNT: "PRICE_DISC",
    SELLER_COUPON_CAMPAIGN: "COUPON",
    BANK: "BANK",
};

const TYPE_COLOR: Record<MLPromotionType, string> = {
    DEAL: "bg-amber-100 text-amber-700",
    MARKETPLACE_CAMPAIGN: "bg-blue-100 text-blue-700",
    VOLUME: "bg-emerald-100 text-emerald-700",
    DOD: "bg-rose-100 text-rose-700",
    LIGHTNING: "bg-yellow-100 text-yellow-800",
    PRE_NEGOTIATED: "bg-violet-100 text-violet-700",
    SELLER_CAMPAIGN: "bg-blue-100 text-blue-700",
    SMART: "bg-violet-100 text-violet-700",
    PRICE_MATCHING: "bg-cyan-100 text-cyan-700",
    PRICE_MATCHING_MELI_ALL: "bg-cyan-100 text-cyan-700",
    UNHEALTHY_STOCK: "bg-orange-100 text-orange-700",
    PRICE_DISCOUNT: "bg-emerald-100 text-emerald-700",
    SELLER_COUPON_CAMPAIGN: "bg-pink-100 text-pink-700",
    BANK: "bg-slate-100 text-slate-700",
};

const TYPE_DESCRIPTION: Record<MLPromotionType, string> = {
    DEAL: "Oferta del día o evento de ML (Cyber, Hot Sale). La define ML; tú adhieres tus publicaciones.",
    MARKETPLACE_CAMPAIGN: "Campaña de Mercado Libre con cofinanciamiento entre ML y el vendedor.",
    VOLUME: "Descuento por cantidad: lleva más, paga menos.",
    DOD: "Oferta del día: vigencia de 24 horas.",
    LIGHTNING: "Oferta relámpago: por tiempo muy limitado.",
    PRE_NEGOTIATED: "Oferta negociada con tu ejecutivo de ML (condiciones acordadas).",
    SELLER_CAMPAIGN: "Campaña creada por ti: tú defines el descuento y la vigencia.",
    SMART: "Campaña inteligente: ML elige los ítems y sugiere el descuento.",
    PRICE_MATCHING: "Igualación de precio: ML iguala un precio de la competencia.",
    PRICE_MATCHING_MELI_ALL: "Igualación automática gestionada por ML en todo el catálogo.",
    UNHEALTHY_STOCK: "Liquidación de stock de baja rotación sugerida por ML.",
    PRICE_DISCOUNT: "Descuento directo de precio aplicado por ML.",
    SELLER_COUPON_CAMPAIGN: "Cupón de descuento creado por ti.",
    BANK: "Promoción bancaria o de medios de pago.",
};

export function TypeChip({ type, className }: TypeChipProps) {
    const color = TYPE_COLOR[type] ?? "bg-gray-100 text-gray-700";
    return (
        <span
            className={[
                "inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wide",
                color,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            title={TYPE_DESCRIPTION[type] ?? type}
        >
            {TYPE_LABEL[type] ?? type}
        </span>
    );
}
