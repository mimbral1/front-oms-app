// features/catalogo/pages/plataforma-ecommerce/_shared/janis/Chip.tsx
//
// Pill removable: usado para mostrar valores seleccionados (ej. atributos,
// categorías). Truncate al 180px por default.
//
// Patrón de `publicar.html` (`function Chip(...)`).

"use client";

import type { ReactNode } from "react";

export interface ChipProps {
    children: ReactNode;
    /** Si se pasa, se muestra el botón X y dispara este callback al click. */
    onRemove?: () => void;
    /** Tono visual. Default `neutral`. */
    tone?: "neutral" | "primary" | "success" | "warning";
    /** Max width del label interno. Default `180px`. */
    maxWidth?: string;
    className?: string;
}

const TONE_CLASSES: Record<NonNullable<ChipProps["tone"]>, { wrap: string; closeBg: string }> = {
    neutral: {
        wrap: "bg-gray-100 text-gray-800",
        closeBg: "bg-gray-800",
    },
    primary: {
        wrap: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
        closeBg: "bg-blue-700",
    },
    success: {
        wrap: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
        closeBg: "bg-emerald-700",
    },
    warning: {
        wrap: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
        closeBg: "bg-amber-700",
    },
};

export function Chip({
    children,
    onRemove,
    tone = "neutral",
    maxWidth = "180px",
    className,
}: ChipProps) {
    const t = TONE_CLASSES[tone];
    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 py-0.5 rounded-full text-[12px]",
                onRemove ? "pl-2.5 pr-1" : "px-2.5",
                t.wrap,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <span className="truncate" style={{ maxWidth }}>
                {children}
            </span>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className={[
                        "w-4 h-4 rounded-full grid place-items-center text-white shrink-0",
                        t.closeBg,
                    ].join(" ")}
                    aria-label="Quitar"
                >
                    <svg
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="w-2.5 h-2.5"
                    >
                        <path d="M3 3l4 4M7 3l-4 4" />
                    </svg>
                </button>
            )}
        </span>
    );
}
