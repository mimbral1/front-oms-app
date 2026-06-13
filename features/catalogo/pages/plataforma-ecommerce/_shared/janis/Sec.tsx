// features/catalogo/pages/plataforma-ecommerce/_shared/janis/Sec.tsx
//
// Divisor "SECCIÓN": icono pequeño + label UPPERCASE tracked + línea horizontal
// que se extiende hasta el final del contenedor.
//
// Uso: divide bloques dentro de una card grande (Detail, Others, Atributos...).
// Patrón visual de `dashboard.html`, `atributos.html`, `publicar.html`.

import type { ReactNode } from "react";

export interface SecProps {
    /** Ícono SVG inline (sin wrapper). Recomendado `<JanisIcon name="..."/>`. */
    icon?: ReactNode;
    /** Label en mayúsculas. Se renderiza tal cual — pasarlo en uppercase. */
    children: ReactNode;
    /** Bloque a la derecha de la línea (ej. un link "Ver todo"). */
    right?: ReactNode;
    /** Margen inferior. Default `mb-5`. */
    spacing?: "tight" | "normal";
    className?: string;
}

export function Sec({ icon, children, right, spacing = "normal", className }: SecProps) {
    const mb = spacing === "tight" ? "mb-3" : "mb-5";
    return (
        <div className={["flex items-center gap-3", mb, className].filter(Boolean).join(" ")}>
            <div className="flex items-center gap-2 text-gray-700">
                {icon && <span className="text-gray-500 inline-flex">{icon}</span>}
                <span className="text-[11.5px] font-semibold tracking-[0.14em] uppercase">
                    {children}
                </span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            {right}
        </div>
    );
}
