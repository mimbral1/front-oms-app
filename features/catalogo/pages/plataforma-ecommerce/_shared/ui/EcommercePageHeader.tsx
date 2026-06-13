// features/catalogo/pages/plataforma-ecommerce/_shared/ui/EcommercePageHeader.tsx
//
// Header estándar del subárbol Plataforma_Marketplace.
// OMS look: eyebrow blue-700 uppercase + h1 + badge inline + cluster de acciones.
//
// Pensado para usarse junto con `<Tabs>` global cuando hay sub-pestañas.

"use client";

import type { ReactNode } from "react";

export type EcommercePageHeaderBadgeTone =
    | "live"
    | "active"
    | "draft"
    | "paused"
    | "error";

export interface EcommercePageHeaderProps {
    /** Eyebrow uppercase tracked en azul. Ej: "Publicar producto". */
    eyebrow: ReactNode;
    /** Título principal (h1, semibold, text-2xl). */
    title: ReactNode;
    /** Badge a la derecha del título. Usar tonos predefinidos. */
    badge?: { label: ReactNode; tone: EcommercePageHeaderBadgeTone };
    /** Reemplaza completamente el badge con cualquier nodo. */
    customBadge?: ReactNode;
    /** Cluster de acciones a la derecha (típicamente ActionButtons). */
    actions?: ReactNode;
    className?: string;
}

const BADGE_TONES: Record<EcommercePageHeaderBadgeTone, string> = {
    live: "bg-emerald-100 text-emerald-800 border-emerald-200",
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    paused: "bg-gray-100 text-gray-700 border-gray-200",
    error: "bg-rose-100 text-rose-700 border-rose-200",
};

export function EcommercePageHeader({
    eyebrow,
    title,
    badge,
    customBadge,
    actions,
    className,
}: EcommercePageHeaderProps) {
    return (
        <div
            className={[
                "bg-white px-6 pt-4 pb-4 border-b border-gray-200",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-wider text-blue-700 uppercase">
                        {eyebrow}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <h1 className="text-2xl leading-tight font-semibold text-gray-900 truncate">
                            {title}
                        </h1>
                        {customBadge
                            ? customBadge
                            : badge && (
                                  <span
                                      className={[
                                          "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border",
                                          BADGE_TONES[badge.tone],
                                      ].join(" ")}
                                  >
                                      {badge.label}
                                  </span>
                              )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">{actions}</div>
                )}
            </div>
        </div>
    );
}
