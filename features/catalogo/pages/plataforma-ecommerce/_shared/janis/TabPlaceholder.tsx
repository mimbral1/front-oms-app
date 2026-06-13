// features/catalogo/pages/plataforma-ecommerce/_shared/janis/TabPlaceholder.tsx
//
// Placeholder visual para tabs que están "Próximamente · backlog" en M1.
// Tipografía consistente con el resto del subárbol Janis.

import type { ReactNode } from "react";

export interface TabPlaceholderProps {
    /** Nombre del tab (en mayúsculas, ej. "PLATFORMS"). */
    tabName: ReactNode;
    /** Descripción corta de lo que va a contener el tab. */
    description?: ReactNode;
    /** Si se pasa, muestra el ticket o link de seguimiento. */
    ticket?: ReactNode;
    /** Ícono SVG inline opcional. */
    icon?: ReactNode;
}

export function TabPlaceholder({ tabName, description, ticket, icon }: TabPlaceholderProps) {
    return (
        <div className="m-6">
            <div className="bg-white rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-10 text-center">
                {icon && (
                    <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-blue-50 grid place-items-center text-blue-700">
                        {icon}
                    </div>
                )}
                <div className="text-[11px] font-semibold tracking-[0.12em] text-gray-500 uppercase">
                    Próximamente
                </div>
                <h2 className="mt-1 text-[18px] font-semibold text-gray-900">{tabName}</h2>
                {description && (
                    <p className="mt-2 text-[13px] text-gray-500 max-w-md mx-auto">
                        {description}
                    </p>
                )}
                {ticket && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11.5px]">
                        {ticket}
                    </div>
                )}
            </div>
        </div>
    );
}
