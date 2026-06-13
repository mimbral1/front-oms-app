// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/components/BatchesList.tsx

import { Package } from "lucide-react";
import { Card, Sec } from "../../../../_shared/janis";
import type { DashboardBatch } from "../types/dashboard-types";

export interface BatchesListProps {
    batches: DashboardBatch[];
    loading?: boolean;
    onOpen?: (batch: DashboardBatch) => void;
}

export function BatchesList({ batches, loading, onOpen }: BatchesListProps) {
    return (
        <Card padding="lg" bordered>
            <Sec icon={<Package className="w-[18px] h-[18px]" />}>Lotes en proceso</Sec>
            {loading ? (
                <div className="divide-y divide-gray-100">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="py-2.5">
                            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                            <div className="mt-2 h-1 w-full bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : batches.length === 0 ? (
                <div className="py-6 text-center text-[12.5px] text-gray-400">
                    No hay lotes en proceso
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {batches.map((b) => {
                        const pct =
                            b.total > 0
                                ? Math.min(100, Math.round((b.done / b.total) * 100))
                                : 0;
                        return (
                            <div
                                key={b.id}
                                className="py-2.5 flex items-center gap-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-medium text-gray-900 truncate">
                                            {b.name}
                                        </span>
                                        <StatusChip status={b.status} />
                                    </div>
                                    <div className="text-[11px] text-gray-500 tabular-nums mt-0.5">
                                        {b.done.toLocaleString("es-CL")} /{" "}
                                        {b.total.toLocaleString("es-CL")} filas · {pct}%
                                    </div>
                                    <div className="mt-1.5 h-1 bg-gray-100 rounded overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onOpen?.(b)}
                                    className="text-[11.5px] text-blue-700 hover:underline shrink-0"
                                >
                                    Abrir
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

function StatusChip({ status }: { status: string }) {
    const s = status.toLowerCase();
    const colorClass = s.includes("error")
        ? "bg-rose-100 text-rose-700"
        : s.includes("publish")
          ? "bg-blue-100 text-blue-700"
          : s.includes("ready") || s.includes("done")
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700";
    return (
        <span
            className={[
                "inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wide",
                colorClass,
            ].join(" ")}
        >
            {status}
        </span>
    );
}
