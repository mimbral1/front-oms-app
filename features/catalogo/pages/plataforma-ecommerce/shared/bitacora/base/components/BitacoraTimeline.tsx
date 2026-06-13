// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/components/BitacoraTimeline.tsx
//
// Timeline vertical del ciclo de vida de publicación de un SKU en Falabella.
// Chrome-agnóstico (sin Card): el host lo envuelve en su propio contenedor
// (Card de @/components/ui en el wizard/detalle).
//
// Honestidad sobre la asincronía: el último estado observable es SINCRONIZADO
// (Falabella lo aceptó). El indexado en el storefront tiene un lag que NO
// trackeamos — se indica explícitamente bajo el evento.

"use client";

import { RefreshCw } from "lucide-react";
import { eventMeta, formatBitacoraDate } from "./bitacora-format";
import { useBitacora } from "../hooks/useBitacora";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";

export interface BitacoraTimelineProps {
    sku: string | null | undefined;
    /** Pollea mientras haya eventos en vuelo (default true). */
    autoPoll?: boolean;
    /** Máximo de eventos a mostrar (default todos los cargados). */
    max?: number;
}

export function BitacoraTimeline({ sku, autoPoll = true, max }: BitacoraTimelineProps) {
    const { entries, loading, pending, refresh } = useBitacora(sku, { autoPoll });
    const platform = useEcommercePlatform();
    const canalNombre = platform?.name || "el marketplace";
    const esFala = canalNombre.toLowerCase().includes("falabella");

    const shown = max ? entries.slice(0, max) : entries;

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                        Bitácora de publicación
                    </span>
                    {pending && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 ring-1 ring-inset ring-blue-200 rounded px-1.5 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            esperando a {canalNombre}…
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={refresh}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                </button>
            </div>

            {loading && entries.length === 0 ? (
                <div className="text-xs text-gray-400 py-6 text-center">Cargando…</div>
            ) : shown.length === 0 ? (
                <div className="text-xs text-gray-400 py-6 text-center">
                    Sin actividad de publicación todavía.
                </div>
            ) : (
                <ol className="relative">
                    {shown.map((e, i) => {
                        const meta = eventMeta(e.event_type, e.action);
                        const isLast = i === shown.length - 1;
                        const isSynced = e.event_type === "SINCRONIZADO";
                        return (
                            <li key={e.id} className="relative flex gap-3 pb-4">
                                {/* Línea vertical */}
                                {!isLast && (
                                    <span className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200" />
                                )}
                                {/* Punto/ícono */}
                                <span
                                    className={`relative z-10 flex-shrink-0 w-[23px] h-[23px] rounded-full bg-white ring-2 ${meta.ring} grid place-items-center`}
                                >
                                    <meta.Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                                </span>
                                {/* Contenido */}
                                <div className="min-w-0 flex-1 -mt-0.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <span className={`text-[13px] font-medium ${meta.text}`}>
                                            {meta.label}
                                        </span>
                                        <time className="text-[11px] text-gray-400 tabular-nums whitespace-nowrap">
                                            {formatBitacoraDate(e.created_at)}
                                        </time>
                                    </div>
                                    {e.fala_feed_id && (
                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                            {esFala ? "Feed" : "Ítem"}{" "}
                                            <code className="text-blue-700 font-medium">
                                                {e.fala_feed_id}
                                            </code>
                                        </div>
                                    )}
                                    {e.fala_error && (
                                        <div className="text-[11px] text-rose-600 mt-0.5 break-words">
                                            {e.fala_error}
                                        </div>
                                    )}
                                    {e.user_name && (
                                        <div className="text-[11px] text-gray-400 mt-0.5">
                                            por {e.user_name}
                                        </div>
                                    )}
                                    {isSynced && i === 0 && (
                                        <div className="text-[11px] text-gray-400 mt-1 italic">
                                            {canalNombre} lo aceptó. La publicación puede tardar en
                                            reflejarse en el sitio.
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </div>
    );
}
