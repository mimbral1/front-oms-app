// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/components/RecentProductsList.tsx

import { List } from "lucide-react";
import { Card, Sec } from "../../../../_shared/janis";
import type { DashboardProduct } from "../types/dashboard-types";

export interface RecentProductsListProps {
    products: DashboardProduct[];
    loading?: boolean;
    /** Si se pasa, solo muestra productos de ese canal. */
    filterCanal?: "ml" | "fala" | "vtex";
    onOpen?: (product: DashboardProduct) => void;
}

const CANAL_LABEL: Record<string, string> = {
    ml: "ML",
    fala: "Falabella",
    vtex: "VTEX",
};

const CANAL_COLOR: Record<string, string> = {
    ml: "bg-yellow-100 text-yellow-800",
    fala: "bg-emerald-100 text-emerald-700",
    vtex: "bg-pink-100 text-pink-700",
};

export function RecentProductsList({
    products,
    loading,
    filterCanal,
    onOpen,
}: RecentProductsListProps) {
    const filtered = filterCanal
        ? products.filter((p) => p.canal === filterCanal)
        : products;

    return (
        <Card padding="lg" bordered>
            <Sec icon={<List className="w-[18px] h-[18px]" />}>Últimas publicaciones</Sec>
            {loading ? (
                <div className="divide-y divide-gray-100">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="py-2.5 flex items-center gap-3">
                            <div className="h-4 w-10 bg-gray-100 rounded animate-pulse" />
                            <div className="flex-1 h-3 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-[12.5px] text-gray-400">
                    Sin publicaciones recientes
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {filtered.map((p) => (
                        <div
                            key={`${p.canal}-${p.sku}`}
                            className="py-2.5 flex items-start gap-3"
                        >
                            <span
                                className={[
                                    "shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wide",
                                    CANAL_COLOR[p.canal] ?? "bg-gray-100 text-gray-700",
                                ].join(" ")}
                            >
                                {CANAL_LABEL[p.canal] ?? p.canal}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-[12.5px] font-medium text-gray-900 truncate">
                                    {p.title}
                                </div>
                                <div className="text-[11px] text-gray-500 tabular-nums">
                                    {p.sku}
                                    {p.when ? ` · ${formatRelative(p.when)}` : ""}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpen?.(p)}
                                className="text-[11.5px] text-blue-700 hover:underline shrink-0"
                            >
                                Abrir
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

function formatRelative(iso: string): string {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return iso;
    const diffMin = Math.max(0, Math.floor((Date.now() - t) / 60_000));
    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    return `hace ${diffD} d`;
}
