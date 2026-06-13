// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorPlaceholderTab.tsx
//
// Placeholder reusable para los 8 tabs del editor que todavía no están
// implementados (Imagen, Precios, Stock, Plataformas, Atributos, Relacionado,
// Comentarios, Logs).
//
// Estrategia "híbrida" del MIGRATION_PLAN — algunos serán React nativo
// (Imagen/Precios/Stock), otros iframe del pim-service legacy
// (Plataformas/Atributos/Relacionado/Comentarios/Logs) cuando exponga
// `?embed=1`. Mientras tanto, cada tab tiene este placeholder con su nota.

"use client";

import type { ReactNode } from "react";
import { EmptyTab } from "../../../../_shared/ui";

export interface EditorPlaceholderTabProps {
    /** Nombre del tab (en uppercase, ej. "PLATAFORMAS"). */
    tabName: ReactNode;
    /** Descripción breve de qué va a contener este tab. */
    description?: ReactNode;
    /** Estrategia de implementación: "native" = React puro pendiente,
     *  "iframe" = iframe del pim-service (bloqueado por embed mode). */
    strategy?: "native" | "iframe";
    /** Icono opcional (lucide). */
    icon?: ReactNode;
}

export function EditorPlaceholderTab({
    tabName,
    description,
    strategy = "native",
    icon,
}: EditorPlaceholderTabProps) {
    const ticketLabel =
        strategy === "iframe"
            ? "Pendiente · pim-service ?embed=1"
            : "Pendiente · port nativo React";
    return (
        <EmptyTab
            tabName={tabName}
            icon={icon}
            description={
                description ?? (
                    <>
                        Esta vista está pendiente de migración.
                        {strategy === "iframe" && (
                            <>
                                {" "}
                                Cuando <code>pim-service</code> exponga el sub-route
                                <code className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                    ?embed=1
                                </code>{" "}
                                vamos a embeber el HTML legacy aquí mismo (no se
                                pierde funcionalidad, solo cambia el chrome).
                            </>
                        )}
                    </>
                )
            }
            ticket={ticketLabel}
        />
    );
}
