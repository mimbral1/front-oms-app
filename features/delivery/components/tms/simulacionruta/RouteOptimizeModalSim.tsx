// views\Delivery\Tms\SimulacionRuta\components\RouteOptimizeModalSim.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import SimRouteMap, { Stop, RouteLayer } from "./SimRouteMap";
import { getOptimizedDirections } from "@/features/delivery/services/getOptimizedDirections";
import { ActionButton } from "@/components/ui/button/action-button";

type ResultPayload = {
    ordered: Stop[];
    directions?: google.maps.DirectionsResult;
    metrics?: { distanciaKm: number; tiempoMin: number; paradas: number };
};

function pickOriginAndWaypoints(stops: Stop[]) {
    const originIdx = Math.max(0, stops.findIndex((s) => s.tipo === "Pickup"));
    const origin = stops[originIdx] ?? stops[0];
    const rest = stops.filter((_, i) => i !== originIdx);
    return { origin, waypoints: rest };
}

export default function RouteOptimizeModalSim({
    open,
    onClose,
    stops,
    routeColor = "#2F80ED",
    onApplyOrder,
}: {
    open: boolean;
    onClose: () => void;
    stops: Stop[];
    routeColor?: string;
    onApplyOrder: (result: ResultPayload) => void;
}) {
    const [dir, setDir] = useState<google.maps.DirectionsResult>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (!open) return;
        setDir(undefined);
        setError("");
        setLoading(true);
        (async () => {
            const d = await getOptimizedDirections(stops);
            setLoading(false);
            if (d) setDir(d);
            else setError("No se pudo calcular la ruta (mock).");
        })();
    }, [open, stops]);

    const orderedStops = useMemo(() => {
        if (!dir) return stops;
        const route = dir.routes?.[0];
        const order = route?.waypoint_order || [];
        const { origin, waypoints } = pickOriginAndWaypoints(stops);
        const orderedWp = order.map((i) => waypoints[i]);
        const last = waypoints[waypoints.length - 1];
        const ordered =
            last && orderedWp[orderedWp.length - 1]?.id !== last.id
                ? [origin, ...orderedWp, last]
                : [origin, ...orderedWp];
        return ordered;
    }, [dir, stops]);

    const metrics = useMemo(() => {
        if (!dir) return undefined;
        const r = dir.routes?.[0];
        let meters = 0,
            seconds = 0;
        r?.legs?.forEach((leg) => {
            meters += leg.distance?.value ?? 0;
            seconds += leg.duration?.value ?? 0;
        });
        return {
            distanciaKm: Number((meters / 1000).toFixed(2)),
            tiempoMin: Math.round(seconds / 60),
            paradas: (r?.legs?.length ?? 1) - 1,
        };
    }, [dir]);

    if (!open) return null;

    // Un solo layer para el preview del modal
    const layers: RouteLayer[] = [
        {
            id: "preview",
            color: routeColor,
            directions: dir,
            stops: orderedStops,
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-5xl rounded-2xl bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">Ruta optimizada</div>
                    <button
                        onClick={onClose}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="rounded-xl border border-gray-200">
                    {loading ? (
                        <div className="h-[340px] animate-pulse rounded-xl bg-gray-50" />
                    ) : error ? (
                        <div className="flex h-[340px] items-center justify-center text-sm text-gray-600">
                            {error}
                        </div>
                    ) : (
                        <SimRouteMap layers={layers} />
                    )}
                </div>

                {metrics && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                        <span className="text-sm font-semibold text-gray-600">
                            Total estimado:
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm">
                            ⍱ {metrics.tiempoMin} min
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm">
                            ↔ {metrics.distanciaKm} km
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm">
                            📍 {metrics.paradas}
                        </span>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-3">
                    <ActionButton
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancelar
                    </ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={() =>
                            onApplyOrder({ ordered: orderedStops, directions: dir, metrics })
                        }
                        disabled={!dir}
                    >
                        Usar ruta optimizada
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
