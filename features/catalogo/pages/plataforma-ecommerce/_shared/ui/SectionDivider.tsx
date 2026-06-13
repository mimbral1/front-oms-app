// features/catalogo/pages/plataforma-ecommerce/_shared/ui/SectionDivider.tsx
//
// Subdivisor de sección dentro de una <Card>. Look OMS: h3 + optional border-top.
//
// Diferencia con la <Card title="..."> del global: éste va INSIDE de una Card
// cuando hay varias sub-secciones (ej. Categoría + Dimensiones del paquete).
// Para una nueva tarjeta separada, mejor usar otra <Card>.

import type { ReactNode } from "react";

export interface SectionDividerProps {
    icon?: ReactNode;
    children: ReactNode;
    right?: ReactNode;
    /** Si true, agrega `border-t` arriba (visual separator). Default false. */
    topDivider?: boolean;
    className?: string;
}

export function SectionDivider({
    icon,
    children,
    right,
    topDivider = false,
    className,
}: SectionDividerProps) {
    return (
        <div
            className={[
                topDivider ? "pt-4 mt-4 border-t border-gray-200" : "",
                "flex items-center gap-2 mb-3",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {icon && <span className="text-gray-600 inline-flex">{icon}</span>}
            <h3 className="text-sm font-semibold text-gray-800 flex-1">{children}</h3>
            {right}
        </div>
    );
}
