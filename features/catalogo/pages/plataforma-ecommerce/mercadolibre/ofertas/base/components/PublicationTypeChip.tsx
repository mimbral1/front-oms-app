// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/PublicationTypeChip.tsx
//
// Chip de tipo de publicación ML (Clásica / Catálogo / Variación), estilo OMS
// (rounded-md border, SIN "pills"). Idiom compartido por el Explorador (3c) y
// el wizard por publicación (3c-bis).

import type { OfferPublication } from "../types/elegibilidad-types";

export type PublicationKind = "clasica" | "catalogo" | "variacion";

/** Deriva el tipo de una publicación. Catálogo > Variación > Clásica. */
export function tipoKindOf(p: OfferPublication): PublicationKind {
    if (p.isCatalogListing) return "catalogo";
    if (p.variationId) return "variacion";
    return "clasica";
}

const KIND_UI: Record<PublicationKind, { label: string; cls: string }> = {
    catalogo: { label: "Catálogo", cls: "bg-white text-emerald-700 border-emerald-200" },
    variacion: { label: "Variación", cls: "bg-white text-orange-700 border-orange-200" },
    clasica: { label: "Clásica", cls: "bg-white text-indigo-700 border-indigo-200" },
};

export interface PublicationTypeChipProps {
    kind: PublicationKind;
    isPrimary?: boolean;
    className?: string;
}

export function PublicationTypeChip({ kind, isPrimary, className }: PublicationTypeChipProps) {
    const ui = KIND_UI[kind];
    return (
        <span
            className={["inline-flex items-center gap-1.5", className]
                .filter(Boolean)
                .join(" ")}
        >
            {isPrimary && (
                <span title="Primaria" className="text-amber-500">
                    ★
                </span>
            )}
            <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ui.cls}`}
            >
                {ui.label}
            </span>
        </span>
    );
}
