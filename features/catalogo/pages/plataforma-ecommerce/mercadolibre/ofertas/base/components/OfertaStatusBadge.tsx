// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/OfertaStatusBadge.tsx
//
// Badge de estado de una campaña. Reusa la paleta Janis (live/draft/paused/error)
// del StatusBadge global pero agrega 'scheduled' y 'ended'.

import type { CampaignStatus } from "../types/oferta-types";

export interface OfertaStatusBadgeProps {
    status: CampaignStatus;
    className?: string;
}

const STATUS_MAP: Record<
    CampaignStatus,
    { label: string; solid: string; soft: string }
> = {
    active: {
        label: "Activa",
        solid: "bg-emerald-500 text-white",
        soft: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    },
    scheduled: {
        label: "Programada",
        solid: "bg-blue-500 text-white",
        soft: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
    },
    paused: {
        label: "Pausada",
        solid: "bg-gray-400 text-white",
        soft: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200",
    },
    ended: {
        label: "Finalizada",
        solid: "bg-slate-500 text-white",
        soft: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200",
    },
    draft: {
        label: "Borrador",
        solid: "bg-amber-500 text-white",
        soft: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    },
};

export function OfertaStatusBadge({ status, className }: OfertaStatusBadgeProps) {
    const meta = STATUS_MAP[status];
    return (
        <span
            className={[
                "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold",
                meta.soft,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {meta.label}
        </span>
    );
}

/** Versión solid (para el TopBar). */
export function OfertaStatusBadgeSolid({
    status,
    className,
}: OfertaStatusBadgeProps) {
    const meta = STATUS_MAP[status];
    return (
        <span
            className={[
                "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11.5px] font-semibold",
                meta.solid,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {meta.label}
        </span>
    );
}
