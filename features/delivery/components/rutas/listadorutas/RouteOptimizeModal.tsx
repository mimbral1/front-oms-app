// views\Delivery\Rutas\components\RouteOptimizeModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import MockRouteMap, { LatLng, stopsToCoords } from "./MockRouteMap";
import { ActionButton } from "@/components/ui/button/action-button";

const formatEstimatedTime = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes < 0) return "0 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;

    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const remMinutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(remMinutes).padStart(2, "0")}`;
};

export type Stop = {
    id: string;
    title?: string;
    tipo?: "Pickup" | "Entrega";
    inventario?: string;
    lat?: number;
    lng?: number;
};

type ResultPayload = {
    ordered: Stop[];
    directions?: google.maps.DirectionsResult;
    snappedPath?: LatLng[];
    snappedMetrics?: { distanciaKm: number; tiempoMin: number; paradas: number };
    metrics?: { distanciaKm: number; tiempoMin: number; paradas: number };
};

type OsrmOptimizedRoute = {
    ordered: Stop[];
    snappedPath: LatLng[];
    metrics: { distanciaKm: number; tiempoMin: number; paradas: number };
};

async function requestOsrmOptimizedRoute(stops: Stop[], destinationStopId?: string): Promise<OsrmOptimizedRoute | undefined> {
    const { origin, waypoints } = pickOriginAndWaypoints(stops);
    if (!origin || !waypoints.length) return undefined;

    const fixedDestination = destinationStopId
        ? waypoints.find((w) => String(w.id) === String(destinationStopId))
        : undefined;

    const stopSequence = fixedDestination
        ? [origin, ...waypoints.filter((w) => String(w.id) !== String(fixedDestination.id)), fixedDestination]
        : [origin, ...waypoints];

    const coords = stopsToCoords(stopSequence);
    if (coords.length < 2) return undefined;

    const path = coords.map((coord) => `${coord.lng},${coord.lat}`).join(";");
    const destinationMode = fixedDestination ? "last" : "any";
    const url = `https://router.project-osrm.org/trip/v1/driving/${path}?source=first&destination=${destinationMode}&roundtrip=false&steps=true&overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);

    const payload = await response.json();
    const trip = payload?.trips?.[0];
    const waypointsPayload = Array.isArray(payload?.waypoints) ? payload.waypoints : [];

    if (!trip || !waypointsPayload.length) return undefined;

    const orderedStops = waypointsPayload
        .map((waypoint: any, idx: number) => ({
            stop: stopSequence[idx],
            order: Number(waypoint?.waypoint_index),
        }))
        .filter((entry: any) => Number.isFinite(entry.order) && entry.stop)
        .sort((a: any, b: any) => a.order - b.order)
        .map((entry: any) => entry.stop);

    const orderedRaw = orderedStops.length === stopSequence.length ? orderedStops : stopSequence;
    const ordered = forceOriginAndDestinationOrder(orderedRaw, origin, fixedDestination);

    const geometry = trip?.geometry?.coordinates;
    const snappedPath: LatLng[] = Array.isArray(geometry)
        ? geometry
            .filter((point: any) => Array.isArray(point) && point.length >= 2)
            .map((point: any) => ({ lat: Number(point[1]), lng: Number(point[0]) }))
            .filter((point: LatLng) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
        : [];

    return {
        ordered,
        snappedPath,
        metrics: {
            distanciaKm: Number(((trip?.distance ?? 0) / 1000).toFixed(2)),
            tiempoMin: Math.round((trip?.duration ?? 0) / 60),
            paradas: ordered.length,
        },
    };
}

function pickOriginAndWaypoints(stops: Stop[]) {
    // origen = primer Pickup si existe; si no, primer stop
    const originIdx = Math.max(0, stops.findIndex((s) => s.tipo === "Pickup"));
    const origin = originIdx >= 0 ? stops[originIdx] : stops[0];
    const rest = stops.filter((_, i) => i !== originIdx);
    return { origin, waypoints: rest };
}

function forceOriginAndDestinationOrder(ordered: Stop[], origin?: Stop, destination?: Stop) {
    if (!ordered.length) return ordered;

    let normalized = [...ordered];

    if (origin) {
        normalized = [origin, ...normalized.filter((s) => String(s.id) !== String(origin.id))];
    }

    if (destination) {
        normalized = [
            ...normalized.filter((s) => String(s.id) !== String(destination.id)),
            destination,
        ];
    }

    return normalized;
}

export default function RouteOptimizeModal({
    open,
    onClose,
    stops,
    destinationStopId,
    onApplyOrder,
}: {
    open: boolean;
    onClose: () => void;
    stops: Stop[];
    destinationStopId?: string;
    onApplyOrder: (result: ResultPayload) => void;
}) {
    const [osrmResult, setOsrmResult] = useState<OsrmOptimizedRoute>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    // calcular ruta al abrir
    useEffect(() => {
        if (!open) return;
        let cancelled = false;

        const run = async () => {
            setOsrmResult(undefined);
            setError("");
            setLoading(true);

            try {
                const osrm = await requestOsrmOptimizedRoute(stops, destinationStopId);
                if (cancelled) return;

                if (!osrm) {
                    setError("No hay suficientes puntos seleccionados para optimizar.");
                    return;
                }

                setOsrmResult(osrm);
                setError("");
            } catch (e) {
                if (!cancelled) {
                    console.error("Error optimizando ruta:", e);
                    setError("Ocurrio un error al calcular la ruta optimizada.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [open, stops, destinationStopId]);

    const renderedStops = useMemo(() => {
        return osrmResult?.ordered ?? stops;
    }, [osrmResult?.ordered, stops]);

    const metrics = useMemo(() => {
        return osrmResult?.metrics;
    }, [osrmResult?.metrics]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-5xl rounded-2xl bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">Ruta optimizada</div>
                    <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">Cerrar</button>
                </div>

                <div className="rounded-xl border border-gray-200">
                    {loading ? (
                        <div className="h-[340px] animate-pulse rounded-xl bg-gray-50" />
                    ) : error ? (
                        <div className="flex h-[340px] items-center justify-center text-sm text-gray-600">{error}</div>
                    ) : (
                        <MockRouteMap
                            stops={renderedStops}
                            snappedPath={osrmResult?.snappedPath}
                            snappedMetrics={osrmResult?.metrics}
                            showPolyline
                            renderCustomMarkersForDirections
                        />
                    )}
                </div>

                {/* métricas bajo el mapa */}
                {metrics && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                        <span className="text-sm font-semibold text-gray-600">Total estimado:</span>
                        <span className="inline-flex items-center gap-1 text-sm">⍱ {formatEstimatedTime(metrics.tiempoMin)}</span>
                        <span className="inline-flex items-center gap-1 text-sm">↔ {metrics.distanciaKm} km</span>
                        <span className="inline-flex items-center gap-1 text-sm">📍 {metrics.paradas}</span>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-3">
                    <ActionButton variant="secondary" onClick={onClose}>Cancelar</ActionButton>
                    <ActionButton
                        variant="primary"
                        onClick={() =>
                            onApplyOrder({
                                ordered: renderedStops,
                                directions: undefined,
                                snappedPath: osrmResult?.snappedPath,
                                snappedMetrics: osrmResult?.metrics,
                                metrics,
                            })
                        }
                        disabled={!osrmResult}
                    >
                        Usar ruta optimizada
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
