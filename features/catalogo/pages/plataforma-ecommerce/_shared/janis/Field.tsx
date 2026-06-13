// features/catalogo/pages/plataforma-ecommerce/_shared/janis/Field.tsx
//
// Fila de label + control: grid `[160px_1fr]`, label a la izquierda en gris,
// control a la derecha. Soporta hint opcional bajo el control.
//
// Patrón de `atributos.html` y `publicar.html`.

import type { ReactNode } from "react";

export interface FieldProps {
    /** Label corto (~1-3 palabras). */
    label: ReactNode;
    /** Control: <UnderlineInput/>, <Sel/>, <Chip/>, texto plano, etc. */
    children: ReactNode;
    /** Texto auxiliar bajo el control (gris pequeño). */
    hint?: ReactNode;
    /** Alineación vertical del label. `top` para inputs multi-line; `center` por default. */
    align?: "center" | "top";
    /**
     * Ancho del label. Default `160px`. Pasar otro valor (ej. "120px") si la
     * sección lo requiere.
     */
    labelWidth?: string;
    className?: string;
}

export function Field({
    label,
    children,
    hint,
    align = "center",
    labelWidth = "160px",
    className,
}: FieldProps) {
    const alignClass = align === "top" ? "items-start" : "items-center";
    const labelPad = align === "top" ? "pt-1.5" : "";
    return (
        <div
            className={["grid gap-6 py-2", alignClass, className].filter(Boolean).join(" ")}
            style={{ gridTemplateColumns: `${labelWidth} 1fr` }}
        >
            <label className={["text-[12.5px] text-gray-600", labelPad].filter(Boolean).join(" ")}>
                {label}
            </label>
            <div className="text-[13.5px] text-gray-900 min-w-0">
                {children}
                {hint && <div className="text-[11px] text-gray-500 mt-1">{hint}</div>}
            </div>
        </div>
    );
}
