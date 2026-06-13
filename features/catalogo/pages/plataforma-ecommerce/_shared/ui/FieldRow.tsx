// features/catalogo/pages/plataforma-ecommerce/_shared/ui/FieldRow.tsx
//
// Fila estándar de un formulario en el subárbol Plataforma_Marketplace.
// Grid `[160px_1fr]`: label gris a la izquierda + control a la derecha.
// Look OMS — usar con `<Input/>` o `<Textarea/>` del global, sin label prop.

"use client";

import type { ReactNode } from "react";

export interface FieldRowProps {
    label: ReactNode;
    hint?: ReactNode;
    /** `top` cuando el control es multi-línea (textarea). Default `center`. */
    align?: "center" | "top";
    /** Ancho del label. Default `160px`. */
    labelWidth?: string;
    children: ReactNode;
    className?: string;
}

export function FieldRow({
    label,
    hint,
    align = "center",
    labelWidth = "160px",
    children,
    className,
}: FieldRowProps) {
    const alignClass = align === "top" ? "items-start" : "items-center";
    const labelPad = align === "top" ? "pt-2" : "";
    return (
        <div
            className={["grid gap-6 py-2", alignClass, className].filter(Boolean).join(" ")}
            style={{ gridTemplateColumns: `${labelWidth} 1fr` }}
        >
            <label className={["text-sm font-medium text-gray-700", labelPad].filter(Boolean).join(" ")}>
                {label}
            </label>
            <div className="min-w-0">
                {children}
                {hint && <div className="text-xs text-gray-500 mt-1.5">{hint}</div>}
            </div>
        </div>
    );
}
