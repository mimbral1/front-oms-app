// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/components/DaysLeft.tsx
//
// Muestra "X días restantes" o "Finalizada" basado en `end_date`.

import { daysLeft } from "../types/oferta-types";

export interface DaysLeftProps {
    end: string | Date | null | undefined;
    className?: string;
}

export function DaysLeft({ end, className }: DaysLeftProps) {
    const days = daysLeft(end);
    if (days === null) {
        return (
            <span className={["text-gray-400 text-[11.5px]", className].filter(Boolean).join(" ")}>
                —
            </span>
        );
    }
    const isUrgent = days >= 0 && days <= 3;
    const isEnded = days < 0;

    const tone = isEnded
        ? "text-gray-400"
        : isUrgent
          ? "text-rose-600 font-semibold"
          : "text-gray-700";

    return (
        <span
            className={["text-[11.5px] tabular-nums", tone, className]
                .filter(Boolean)
                .join(" ")}
        >
            {isEnded
                ? "Finalizada"
                : days === 0
                  ? "Termina hoy"
                  : days === 1
                    ? "Falta 1 día"
                    : `Faltan ${days} días`}
        </span>
    );
}
