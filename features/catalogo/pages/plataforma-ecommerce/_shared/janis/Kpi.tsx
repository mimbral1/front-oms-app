// features/catalogo/pages/plataforma-ecommerce/_shared/janis/Kpi.tsx
//
// Tarjeta KPI básica: label UPPERCASE arriba, número grande, delta opcional
// abajo con color (emerald positivo, rose negativo). Para dashboards.
//
// Patrón visual de `dashboard.html` (`function KPI(...)`).

import type { ReactNode } from "react";

export interface KpiProps {
    /** Label UPPERCASE (10.5px). */
    label: ReactNode;
    /** Valor principal (24px semibold tabular). */
    value: ReactNode;
    /**
     * Delta opcional bajo el valor. Si se omite no se renderiza.
     * `direction='up'` => emerald, `'down'` => rose, `'flat'` => gray-500.
     */
    delta?: {
        text: ReactNode;
        direction: "up" | "down" | "flat";
    };
    /**
     * Si se pasa, sobreescribe el color del valor principal (override por sobre
     * el `text-gray-900` default). Ej. `text-blue-700` para destacar.
     */
    valueAccent?: string;
    className?: string;
}

const DELTA_COLOR = {
    up: "text-emerald-600",
    down: "text-rose-600",
    flat: "text-gray-500",
} as const;

export function Kpi({ label, value, delta, valueAccent, className }: KpiProps) {
    return (
        <div
            className={[
                "bg-white rounded-md border border-gray-200 p-4",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-gray-500">
                {label}
            </div>
            <div
                className={[
                    "mt-1.5 text-[24px] font-semibold tabular-nums",
                    valueAccent || "text-gray-900",
                ].join(" ")}
            >
                {value}
            </div>
            {delta && (
                <div
                    className={[
                        "mt-1 text-[11.5px] font-medium tabular-nums",
                        DELTA_COLOR[delta.direction],
                    ].join(" ")}
                >
                    {delta.text}
                </div>
            )}
        </div>
    );
}
