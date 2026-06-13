// features/catalogo/pages/plataforma-ecommerce/_shared/janis/Card.tsx
//
// Wrapper de "card" usado uniformemente en las vistas (RESUMEN, panels de
// editor, list views). Aplica el sombreado sutil y el border-radius de Janis.

import type { ReactNode } from "react";

export interface CardProps {
    children: ReactNode;
    /** Padding interno. Default `lg` (24px). */
    padding?: "none" | "sm" | "md" | "lg";
    /** Si true, agrega el border gris en vez de solo sombra. */
    bordered?: boolean;
    className?: string;
}

const PADDING_MAP = {
    none: "p-0",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
} as const;

export function Card({ children, padding = "lg", bordered = false, className }: CardProps) {
    return (
        <div
            className={[
                "bg-white rounded-md",
                bordered ? "border border-gray-200" : "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                PADDING_MAP[padding],
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}
