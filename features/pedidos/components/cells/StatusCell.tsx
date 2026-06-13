import { Clock10Icon } from "lucide-react";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { StatusBadge } from "@/components/ui/badge/status";
import { getStatusVariant, getRemainingTime } from "@/features/pedidos/utils/pedido-status";

export function StatusCell({ pedido: p }: { pedido: Pedido }) {
    const remaining = getRemainingTime(p.fechaEntrega);
    let colorClass = "border-green-600 text-green-800";
    if (remaining && remaining.seconds !== null) {
        if (remaining.seconds === 0 || remaining.seconds <= 86400) {
            colorClass = "border-red-400 text-red-600";
        } else if (remaining.seconds <= 172800) {
            colorClass = "border-yellow-400 text-yellow-700";
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-1 w-full text-center">
            <StatusBadge status={p.estado} variant={getStatusVariant(p.estado)} fixed />

            {remaining && remaining.seconds !== null && (
                <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${colorClass}`}
                >
                    <Clock10Icon className="h-4 w-4" />
                    {remaining.label}
                </span>
            )}
        </div>
    );
}
