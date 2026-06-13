// features/catalogo/pages/plataforma-ecommerce/_shared/janis/UnderlineInput.tsx
//
// Input borderless con border-b. En focus, la línea sube a blue-700. Hover
// sube a gray-300. Patrón canónico Janis (todos los forms del subárbol).

"use client";

import type { InputHTMLAttributes } from "react";

export interface UnderlineInputProps extends InputHTMLAttributes<HTMLInputElement> {
    /**
     * Si true, aplica `font-variant-numeric: tabular-nums` (para precios, SKUs,
     * cantidades).
     */
    tabular?: boolean;
}

const BASE_CLASSES = [
    "bg-transparent border-0 border-b border-gray-200",
    "outline-none w-full py-1.5",
    "transition-colors",
    "hover:border-gray-300",
    "focus:border-blue-700",
    "placeholder:text-gray-400",
    "text-[13.5px] text-gray-900",
].join(" ");

export function UnderlineInput({ tabular, className, ...rest }: UnderlineInputProps) {
    return (
        <input
            className={[
                BASE_CLASSES,
                tabular ? "tabular-nums" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...rest}
        />
    );
}
