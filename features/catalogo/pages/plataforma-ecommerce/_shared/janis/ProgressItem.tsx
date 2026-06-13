// features/catalogo/pages/plataforma-ecommerce/_shared/janis/ProgressItem.tsx
//
// Item de un checklist vertical de pasos, usado típicamente en el side-panel
// derecho del Step1 de Publicar. Tiene 3 estados:
//
// - `done`    → círculo emerald lleno con check
// - `active`  → círculo blue lleno con número, label en blue-700 + semibold
// - `pending` → círculo gris vacío con número, label en gris
//
// Patrón de `publicar.html` (`function ProgressItem(...)`).

import type { ReactNode } from "react";

export interface ProgressItemProps {
    /** Número a mostrar dentro del círculo cuando no está done. */
    n: number | string;
    /** Label visible al lado del círculo. */
    label: ReactNode;
    state: "done" | "active" | "pending";
    className?: string;
}

interface StateClasses {
    ring: string;
    bg: string;
    text: string;
    fontWeight: string;
    numberColor: string;
}

const STATE_MAP: Record<ProgressItemProps["state"], StateClasses> = {
    done: {
        ring: "ring-emerald-500",
        bg: "bg-emerald-500",
        text: "text-emerald-700",
        fontWeight: "",
        numberColor: "white",
    },
    active: {
        ring: "ring-blue-600",
        bg: "bg-blue-600",
        text: "text-blue-700",
        fontWeight: "font-semibold",
        numberColor: "white",
    },
    pending: {
        ring: "ring-gray-300",
        bg: "bg-white",
        text: "text-gray-500",
        fontWeight: "",
        numberColor: "#9ca3af",
    },
};

export function ProgressItem({ n, label, state, className }: ProgressItemProps) {
    const s = STATE_MAP[state];
    return (
        <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
            <svg
                className={["w-6 h-6 rounded-full ring-1", s.ring, s.bg].join(" ")}
                viewBox="0 0 20 20"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {state === "done" ? (
                    <path d="M5 10l3 3 7-7" />
                ) : (
                    <text
                        x="10"
                        y="13.5"
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill={s.numberColor}
                        stroke="none"
                    >
                        {n}
                    </text>
                )}
            </svg>
            <span className={["text-[13px]", s.text, s.fontWeight].filter(Boolean).join(" ")}>
                {label}
            </span>
        </div>
    );
}
