// features/catalogo/pages/plataforma-ecommerce/_shared/janis/JanisTopBar.tsx
//
// Cabecera estándar del rediseño Janis: eyebrow azul + h1 + status badge
// + cluster de acciones a la derecha.
//
// Patrón visual extraído de `Mimbral Mercadolibre/dashboard.html`,
// `atributos.html`, `publicar.html` (idéntico en los 3).

"use client";

import type { ReactNode } from "react";
import { STATUS_BADGE_CLASSES, type StatusBadgeTone } from "./tokens";

export interface JanisTopBarProps {
    /**
     * Eyebrow (texto pequeño UPPERCASE encima del título). Tracking alto,
     * color blue-700. Ej: "Mimbral · Marketplace".
     */
    eyebrow: ReactNode;

    /** Título principal (h1, semibold, 26px). */
    title: ReactNode;

    /**
     * Badge de estado a la derecha del título (opcional). Tonos predefinidos.
     * Para tonos custom usar `customBadge`.
     */
    badge?: {
        label: ReactNode;
        tone: StatusBadgeTone;
    };

    /** Reemplaza completamente el badge con cualquier nodo. */
    customBadge?: ReactNode;

    /**
     * Cluster de acciones a la derecha. Típicamente un grupo de `<PillBtn/>`.
     * Si se omite, no se renderiza el wrapper.
     */
    actions?: ReactNode;

    /**
     * Padding bottom adicional. Por default el topbar deja un padding mínimo
     * porque después suele venir un `<JanisTabs/>` o `<JanisStepsHeader/>` que
     * pega visualmente. Si la siguiente sección NO es tabs, pasar `withBottom`
     * para que sume aire.
     */
    withBottom?: boolean;

    /** Clases adicionales del wrapper. */
    className?: string;
}

export function JanisTopBar({
    eyebrow,
    title,
    badge,
    customBadge,
    actions,
    withBottom = false,
    className,
}: JanisTopBarProps) {
    return (
        <div
            className={[
                "bg-white px-6 pt-3",
                withBottom ? "pb-4" : "pb-1",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-[0.12em] text-blue-700 uppercase">
                        {eyebrow}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                        <h1 className="text-[26px] leading-tight font-semibold text-gray-900 truncate">
                            {title}
                        </h1>
                        {customBadge
                            ? customBadge
                            : badge && (
                                  <span
                                      className={[
                                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold",
                                          STATUS_BADGE_CLASSES[badge.tone],
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
