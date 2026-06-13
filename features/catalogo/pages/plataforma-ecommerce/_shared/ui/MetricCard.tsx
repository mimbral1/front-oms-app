// features/catalogo/pages/plataforma-ecommerce/_shared/ui/MetricCard.tsx
//
// Tarjeta KPI para dashboards. OMS look: rounded-xl + shadow on hover.
// Label uppercase pequeño, valor grande tabular, delta opcional debajo,
// icono opcional (lucide) arriba a la derecha en gris suave.

import type { ReactNode } from "react";

export interface MetricCardProps {
    label: ReactNode;
    value: ReactNode;
    /** Delta opcional debajo del valor. up=emerald, down=rose, flat=gray. */
    delta?: {
        text: ReactNode;
        direction: "up" | "down" | "flat";
    };
    /** Override del color del valor principal. Default `text-gray-900`. */
    valueAccent?: string;
    /** Icono opcional (lucide), arriba a la derecha en gris suave. */
    icon?: ReactNode;
    className?: string;
}

const DELTA_COLOR = {
    up: "text-emerald-600",
    down: "text-rose-600",
    flat: "text-gray-500",
} as const;

export function MetricCard({
    label,
    value,
    delta,
    valueAccent,
    icon,
    className,
}: MetricCardProps) {
    return (
        <div
            className={[
                "bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    {label}
                </div>
                {icon && <div className="text-gray-400 shrink-0">{icon}</div>}
            </div>
            <div
                className={[
                    "mt-2 text-2xl font-semibold tabular-nums",
                    valueAccent || "text-gray-900",
                ].join(" ")}
            >
                {value}
            </div>
            {delta && (
                <div
                    className={[
                        "mt-1 text-xs font-medium tabular-nums",
                        DELTA_COLOR[delta.direction],
                    ].join(" ")}
                >
                    {delta.text}
                </div>
            )}
        </div>
    );
}
