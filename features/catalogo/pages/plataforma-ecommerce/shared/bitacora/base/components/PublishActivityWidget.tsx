// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/components/PublishActivityWidget.tsx
//
// Widget de dashboard "Publicaciones de hoy" (solo Falabella). Dos métricas
// distintas, como se definió:
//   - "En proceso ahora: N"  → estado actual de fal_skus (pending).
//   - "Actividad de hoy"      → eventos del día calendario local (Chile).
// Más un feed de los últimos eventos del día (linkea al detalle del SKU).

"use client";

import type { ComponentType } from "react";
import { Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { usePublishActivity } from "../hooks/usePublishActivity";
import { eventMeta, formatBitacoraDate } from "./bitacora-format";

export interface PublishActivityWidgetProps {
    /** Habilitar (solo Falabella). Si false, no fetchea. */
    enabled?: boolean;
    /** Filtra por cuenta (opcional). */
    accountId?: number;
    /** Click en una fila del feed → abrir el SKU. */
    onOpenSku?: (sku: string) => void;
}

export function PublishActivityWidget({
    enabled = true,
    accountId,
    onOpenSku,
}: PublishActivityWidgetProps) {
    const { activity, loading } = usePublishActivity({ enabled, accountId });

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Publicaciones de hoy</h3>
                {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            </div>

            {/* Línea 1 — estado actual (ahora mismo) */}
            <div className="flex items-center justify-between rounded-md bg-blue-50/60 px-3 py-2 mb-2">
                <span className="text-xs text-gray-600">En proceso ahora</span>
                <span className="text-lg font-semibold tabular-nums text-blue-700">
                    {loading ? "—" : (activity?.en_proceso_ahora ?? 0)}
                </span>
            </div>

            {/* Línea 2 — actividad de hoy (eventos del día) */}
            <div className="grid grid-cols-3 gap-2">
                <ActivityStat
                    label="Enviados"
                    value={activity?.hoy.enviados ?? 0}
                    loading={loading}
                    tone="text-blue-700"
                    Icon={Send}
                />
                <ActivityStat
                    label="Sincronizados"
                    value={activity?.hoy.sincronizados ?? 0}
                    loading={loading}
                    tone="text-emerald-700"
                    Icon={CheckCircle2}
                />
                <ActivityStat
                    label="Con error"
                    value={activity?.hoy.con_error ?? 0}
                    loading={loading}
                    tone="text-rose-700"
                    Icon={XCircle}
                />
            </div>

            {/* Feed reciente del día */}
            <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1.5">
                    Actividad reciente
                </div>
                {!activity || activity.recent.length === 0 ? (
                    <div className="text-xs text-gray-400 py-3 text-center">
                        Sin movimientos hoy.
                    </div>
                ) : (
                    <ul className="space-y-1 max-h-56 overflow-y-auto">
                        {activity.recent.map((r) => {
                            const meta = eventMeta(r.event_type, r.action);
                            return (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        onClick={() => onOpenSku?.(r.sku)}
                                        className="w-full flex items-center gap-2 text-left rounded px-1.5 py-1 hover:bg-gray-50 transition-colors"
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} flex-shrink-0`} />
                                        <span className={`text-[11px] font-medium ${meta.text} flex-shrink-0`}>
                                            {meta.label}
                                        </span>
                                        <code className="text-[11px] text-gray-700 truncate">
                                            {r.sku}
                                        </code>
                                        <time className="ml-auto text-[10.5px] text-gray-400 tabular-nums whitespace-nowrap">
                                            {formatBitacoraDate(r.created_at)}
                                        </time>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ActivityStat({
    label,
    value,
    loading,
    tone,
    Icon,
}: {
    label: string;
    value: number;
    loading: boolean;
    tone: string;
    Icon: ComponentType<{ className?: string }>;
}) {
    return (
        <div className="rounded-md border border-gray-100 px-2 py-2 text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${tone}`} />
            <div className={`text-base font-semibold tabular-nums ${tone}`}>
                {loading ? "—" : value}
            </div>
            <div className="text-[10.5px] text-gray-500">{label}</div>
        </div>
    );
}
