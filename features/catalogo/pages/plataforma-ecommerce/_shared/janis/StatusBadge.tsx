// features/catalogo/pages/plataforma-ecommerce/_shared/janis/StatusBadge.tsx
//
// Badge de estado standalone (no acoplado a JanisTopBar). Usable en celdas de
// tablas, listas de campañas, etc.

import type { ReactNode } from "react";
import { STATUS_BADGE_CLASSES, type StatusBadgeTone } from "./tokens";

export interface StatusBadgeProps {
    tone: StatusBadgeTone;
    children: ReactNode;
    /** Si true, usa estilo "soft" (bg tinted + text colored, sin solid). */
    soft?: boolean;
    className?: string;
}

const SOFT_TONES: Record<StatusBadgeTone, string> = {
    live: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    draft: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    paused: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200",
    error: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

export function StatusBadge({ tone, children, soft = false, className }: StatusBadgeProps) {
    return (
        <span
            className={[
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold",
                soft ? SOFT_TONES[tone] : STATUS_BADGE_CLASSES[tone],
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </span>
    );
}
