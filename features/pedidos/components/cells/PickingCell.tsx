import { useState, useRef, useCallback } from "react";
import TransformIcon from "@mui/icons-material/Transform";
import type { Pedido } from "@/features/pedidos/types/lista-pedidos";
import { useAuth } from "@/app/context/auth/AuthContext";
import { fetchIssueItems } from "@/app/fetchWithAuth/api-pedidos/pedidos";

type PickingItemInfo = { producto: string; cantidad: number };

// Cache global simple para evitar re-fetch mientras la página esté viva
const itemsCache = new Map<string, PickingItemInfo[]>();

export function PickingCell({ pedido: p }: { pedido: Pedido }) {
    const items = Number(p?.picking?.items ?? 0);
    const unidades = Number(p?.picking?.unidades ?? 0);
    const pickingStatus = String(p?.picking?.status ?? "").trim();
    const assigned = Boolean(
        (p as any)?.pickingAsignado ??
        (Array.isArray((p as any)?.pickers) && (p as any).pickers.length > 0),
    );
    const statusLabel = pickingStatus || "Sin asignar";

    const { token } = useAuth();

    const [tooltipItems, setTooltipItems] = useState<PickingItemInfo[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [hovered, setHovered] = useState(false);
    const fetchedRef = useRef(false);

    const orderId = p.folionum;

    const handleMouseEnter = useCallback(() => {
        setHovered(true);
        if (fetchedRef.current || !orderId || !token) return;

        // Check cache first
        const cached = itemsCache.get(orderId);
        if (cached) {
            setTooltipItems(cached);
            fetchedRef.current = true;
            return;
        }

        const numericId = Number(orderId);
        if (!Number.isFinite(numericId)) return;

        fetchedRef.current = true;
        setLoading(true);

        fetchIssueItems<any>(token, numericId)
            .then((data) => {
                const grupos = data?.items?.originales?.grupos ?? [];
                const allItems: PickingItemInfo[] = [];
                for (const g of grupos) {
                    for (const it of g.items ?? []) {
                        allItems.push({
                            producto: it.producto ?? "--",
                            cantidad: Number(it.cantidad ?? 0),
                        });
                    }
                }
                itemsCache.set(orderId, allItems);
                setTooltipItems(allItems);
            })
            .catch(() => {
                fetchedRef.current = false; // allow retry on next hover
            })
            .finally(() => setLoading(false));
    }, [orderId, token]);

    const handleMouseLeave = useCallback(() => {
        setHovered(false);
    }, []);

    const hasItems = Array.isArray(tooltipItems) && tooltipItems.length > 0;

    return (
        <div
            className="relative flex flex-col flex-[0.8] gap-1 min-w-0"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex items-center gap-2">
                <TransformIcon className="h-5 w-5 text-gray-400" />
                <p className="font-medium text-gray-500">
                    {items} <span className="text-xs text-gray-500">{items === 1 ? "item" : "items"}</span>
                    {" / "}
                    {unidades} <span className="text-xs text-gray-500">un</span>
                </p>
            </div>
            <div className="pl-7">
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${assigned ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                >
                    {statusLabel}
                </span>
            </div>

            {/* Tooltip con lista de items (fetch on hover) */}
            {hovered && (
                <div className="pointer-events-none absolute left-0 bottom-full z-50 mb-1 w-max max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
                    <p className="mb-1 text-xs font-semibold text-gray-700">Items del pedido</p>
                    {loading && (
                        <p className="text-xs text-gray-400">Cargando…</p>
                    )}
                    {!loading && hasItems && (
                        <ul className="space-y-0.5">
                            {tooltipItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                                    <span>
                                        {item.producto}
                                        {item.cantidad > 1 && (
                                            <span className="ml-1 text-gray-400">×{item.cantidad}</span>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {!loading && !hasItems && tooltipItems !== null && (
                        <p className="text-xs text-gray-400">Sin items</p>
                    )}
                </div>
            )}
        </div>
    );
}
