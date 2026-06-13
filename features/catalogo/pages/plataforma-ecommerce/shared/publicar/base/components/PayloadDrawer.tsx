// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/components/PayloadDrawer.tsx
//
// Drawer lateral derecho con el JSON que se va a enviar al backend. Útil para
// debugging y para que el usuario revise antes de publicar.
//
// Look OMS: ActionButton + lucide icons. Mantiene drawer custom (no es modal
// centrado, slide-in derecho).

"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { ActionButton } from "@/components/ui";
import type { PublicarChannel } from "../types/publicar-types";

export interface PayloadDrawerProps {
    open: boolean;
    onClose: () => void;
    /** Payload pre-construido (wizard via `buildMlPayload`/`buildFalaPayload`, o el
     *  draftPayload del editor). El drawer solo lo serializa con JSON.stringify,
     *  así que acepta cualquier valor — `unknown` evita el choque interface vs
     *  Record<string, unknown> sin perder nada. */
    payload: unknown;
    channel: PublicarChannel | string;
    endpointLabel?: string;
}

export function PayloadDrawer({ open, onClose, payload, channel, endpointLabel }: PayloadDrawerProps) {
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    };

    return (
        <div
            className="fixed inset-0 bg-gray-900/40 z-50 flex justify-end"
            onClick={onClose}
        >
            <aside
                className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">
                            {endpointLabel ?? `Payload · POST /api/pim/canales/${channel}/productos/:sku/publicar`}
                        </p>
                        <h2 className="text-lg font-semibold text-gray-900 mt-0.5">
                            JSON a enviar
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="w-8 h-8 rounded-full hover:bg-gray-100 grid place-items-center text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                    <pre className="text-xs font-mono text-gray-900 bg-white border border-gray-200 rounded-md p-3 overflow-x-auto">
                        {JSON.stringify(payload, null, 2)}
                    </pre>
                </div>

                <footer className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
                    <ActionButton
                        variant="secondary"
                        size="sm"
                        onClick={handleCopy}
                    >
                        <Check className="w-4 h-4" />
                        {copied ? "Copiado" : "Copiar JSON"}
                    </ActionButton>
                    <ActionButton variant="primary" size="sm" onClick={onClose}>
                        Cerrar
                    </ActionButton>
                </footer>
            </aside>
        </div>
    );
}
