// features/catalogo/pages/plataforma-ecommerce/_shared/janis/PillBtn.tsx
//
// Botón pill rounded-full usado en TopBars, modales y como CTA inline.
// Mapeado 1:1 con `PillBtn` del mockup `publicar.html`.

"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { PILL_VARIANT_CLASSES, type PillVariant } from "./tokens";

export interface PillBtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Variante visual. Default `ghost`. */
    variant?: PillVariant;
    /** Ícono opcional a la izquierda del label. */
    icon?: ReactNode;
    /** Texto del botón. */
    children: ReactNode;
    /** Si true, oculta el botón (mantiene el hueco). */
    disabled?: boolean;
}

const BASE_CLASSES =
    "h-9 px-4 inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-medium transition";

export function PillBtn({
    variant = "ghost",
    icon,
    children,
    className,
    disabled,
    ...rest
}: PillBtnProps) {
    const variantClasses = PILL_VARIANT_CLASSES[variant];
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

    return (
        <button
            type="button"
            disabled={disabled}
            className={[BASE_CLASSES, variantClasses, disabledClasses, className]
                .filter(Boolean)
                .join(" ")}
            {...rest}
        >
            {icon && <span className="inline-flex shrink-0">{icon}</span>}
            {children}
        </button>
    );
}
