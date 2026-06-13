// features/catalogo/pages/plataforma-ecommerce/_shared/janis/Sel.tsx
//
// Select-like input: muestra valor (o placeholder) con un chevron a la derecha.
// Por sí solo es "presentacional" — el onClick típicamente abre un picker modal
// o un dropdown custom.
//
// Patrón de `publicar.html` (`function Sel(...)`).

"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { JanisIcon } from "./icons/janis-icons";

export interface SelProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "value"> {
    /** Valor mostrado. Si vacío/null/undefined, se muestra el placeholder. */
    value?: ReactNode;
    placeholder?: ReactNode;
    /** Icono extra antes del valor (ej. un dot de color para indicador de canal). */
    leading?: ReactNode;
    /**
     * Si true, en lugar del chevron muestra un botón "clear" (X) + chevron.
     * El click en el clear NO dispara onClick del botón principal.
     */
    clearable?: boolean;
    onClear?: () => void;
}

export function Sel({
    value,
    placeholder = "—",
    leading,
    clearable,
    onClear,
    className,
    ...rest
}: SelProps) {
    const hasValue = value !== undefined && value !== null && value !== "";
    return (
        <button
            type="button"
            className={[
                "flex items-center justify-between gap-2 w-full",
                "border-b border-gray-200 hover:border-gray-300",
                "py-1.5 text-left text-[13.5px] outline-none",
                "focus-visible:border-blue-700 transition-colors",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...rest}
        >
            <span className="flex items-center gap-2 min-w-0">
                {leading}
                <span className={hasValue ? "text-gray-900 truncate" : "text-gray-400 truncate"}>
                    {hasValue ? value : placeholder}
                </span>
            </span>
            <span className="flex items-center gap-3 shrink-0 text-gray-400">
                {clearable && hasValue && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear?.();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                onClear?.();
                            }
                        }}
                        className="w-4 h-4 rounded-full bg-gray-700 text-white grid place-items-center cursor-pointer hover:bg-gray-900"
                        aria-label="Limpiar"
                    >
                        <svg
                            viewBox="0 0 10 10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="w-2.5 h-2.5"
                        >
                            <path d="M3 3l4 4M7 3l-4 4" />
                        </svg>
                    </span>
                )}
                <JanisIcon name="chevronDown" size={16} />
            </span>
        </button>
    );
}
