"use client";

import {
    GoogleMap,
    Polyline,
    DirectionsRenderer,
    useLoadScript,
} from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { colorForWarehouse, getWarehouseLatLng } from "./talca.mock";

export type LatLng = { lat: number; lng: number };
export type Stop = {
    id: string;
    title?: string;
    tipo?: "Pickup" | "Entrega";
    inventario?: string;
    lat?: number;
    lng?: number;
};

const DEFAULT_MAP_HEIGHT = "340px";
const LOADER_ID = "mock-route-map";
const LIBRARIES = ["places", "marker"] as any;

/* -------------------------------- Utilities ------------------------------- */

function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/** Proyecta stops a coords. Si no traen lat/lng, los “jittereamos” cerca del almacén. */
export function stopsToCoords(stops: Stop[]): LatLng[] {
    return stops.map((s) => {
        if (typeof s.lat === "number" && typeof s.lng === "number") {
            return { lat: s.lat, lng: s.lng };
        }
        const base = getWarehouseLatLng(s.inventario); // del mock
        const h = hash(`${s.inventario || "Talca Centro"}-${s.id}`);
        const jitterLat = ((h % 200) - 100) / 100000; // ~±0.001°
        const jitterLng = (((h >> 3) % 200) - 100) / 100000;
        return { lat: base.lat + jitterLat, lng: base.lng + jitterLng };
    });
}

/* --------------------------- Iconos SVG por color -------------------------- */

function makeWarehouseIcon(color: string) {
    const svg = `
<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2"/>
  <path d="M10 19l8-6 8 6v7h-5v-5h-6v5h-5v-7z" fill="white"/>
</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function makeDeliveryIcon(color: string) {
    const svg = `
<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2"/>
  <path d="M18 11a3 3 0 110 6 3 3 0 010-6zm0 7c-3.314 0-6 1.79-6 4v2h12v-2c0-2.21-2.686-4-6-4z" fill="white"/>
</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* ----------------------------- Métricas mock ------------------------------ */

function haversine(a: LatLng, b: LatLng) {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
function calcMetricsFromCoords(path: LatLng[]) {
    const speedKmH = 20;
    const stopPenaltyMin = 2;
    let dist = 0;
    for (let i = 1; i < path.length; i++) dist += haversine(path[i - 1], path[i]);
    const tiempoMin =
        (dist / speedKmH) * 60 + (path.length > 1 ? (path.length - 1) * stopPenaltyMin : 0);
    return {
        distanciaKm: Number(dist.toFixed(2)),
        tiempoMin: Math.round(tiempoMin),
        paradas: path.length,
    };
}
function calcMetricsFromDirections(dir: google.maps.DirectionsResult) {
    const route = dir.routes?.[0];
    let meters = 0;
    let seconds = 0;
    route?.legs?.forEach((leg) => {
        meters += leg.distance?.value ?? 0;
        seconds += leg.duration?.value ?? 0;
    });
    const legsCount = route?.legs?.length ?? 0;
    return {
        distanciaKm: Number((meters / 1000).toFixed(2)),
        tiempoMin: Math.round(seconds / 60),
        paradas: legsCount > 0 ? legsCount + 1 : 0,
    };
}

/* -------------------------------- Component -------------------------------- */

export default function MockRouteMap({
    stops,
    focusStopId,
    directions,
    directionsRenderKey,
    snappedPath,
    snappedMetrics,
    onMetrics,
    showPolyline = false,
    renderCustomMarkersForDirections = false,
    height = DEFAULT_MAP_HEIGHT,
}: {
    stops: Stop[];
    focusStopId?: string | null;
    directions?: google.maps.DirectionsResult;
    directionsRenderKey?: string;
    snappedPath?: LatLng[];
    snappedMetrics?: { distanciaKm: number; tiempoMin: number; paradas: number };
    onMetrics?: (m: { distanciaKm: number; tiempoMin: number; paradas: number }) => void;
    showPolyline?: boolean;
    renderCustomMarkersForDirections?: boolean;
    height?: string;
}) {
    const containerStyle = useMemo(() => ({ width: "100%", height }), [height]);
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const advancedMarkersRef = useRef<any[]>([]);
    const [mapReady, setMapReady] = useState(false);

    const { isLoaded, loadError } = useLoadScript({
        id: LOADER_ID,
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: LIBRARIES,
    });

    const coords = useMemo(() => stopsToCoords(stops), [stops]);
    useEffect(() => {
        if (!focusStopId) return;
        const map = mapRef.current;
        if (!map || !coords.length) return;

        const index = stops.findIndex((stop) => String(stop?.id) === String(focusStopId));
        if (index < 0) return;

        const target = coords[index];
        if (!target) return;

        map.panTo(target);
        if ((map.getZoom() ?? 0) < 15) map.setZoom(15);
    }, [coords, focusStopId, mapReady, stops]);

    const shouldRenderCustomMarkers = !directions || renderCustomMarkersForDirections;
    const hasSnappedPath = Boolean(snappedPath?.length && snappedPath.length > 1);

    // Emitir métricas cuando cambian coords o directions
    useEffect(() => {
        if (!onMetrics) return;
        if (directions) onMetrics(calcMetricsFromDirections(directions));
        else if (snappedMetrics) onMetrics(snappedMetrics);
        else if (snappedPath?.length) onMetrics(calcMetricsFromCoords(snappedPath));
        else if (coords.length) onMetrics(calcMetricsFromCoords(coords));
    }, [coords, directions, onMetrics, snappedMetrics, snappedPath]);

    useEffect(() => {
        if (!directions && directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
            directionsRendererRef.current = null;
        }
    }, [directions]);

    useEffect(() => {
        const clearAdvancedMarkers = () => {
            for (const marker of advancedMarkersRef.current) {
                marker.map = null;
            }
            advancedMarkersRef.current = [];
        };

        const map = mapRef.current;
        const canRenderMarkers = isLoaded && mapReady && map && shouldRenderCustomMarkers;
        if (!canRenderMarkers) {
            clearAdvancedMarkers();
            return;
        }

        const AdvancedMarkerElement = (window as any)?.google?.maps?.marker?.AdvancedMarkerElement;
        if (!AdvancedMarkerElement) {
            clearAdvancedMarkers();
            return;
        }

        clearAdvancedMarkers();

        advancedMarkersRef.current = coords.map((position, i) => {
            const stop = stops[i];
            const tipo = (stop?.tipo || "Entrega") as "Pickup" | "Entrega";
            const color = colorForWarehouse(stop?.inventario);
            const iconUrl = tipo === "Pickup" ? makeWarehouseIcon(color) : makeDeliveryIcon(color);

            const content = document.createElement("div");
            content.style.width = "36px";
            content.style.height = "36px";

            const img = document.createElement("img");
            img.src = iconUrl;
            img.alt = stop?.title || stop?.id || "marker";
            img.width = 36;
            img.height = 36;
            img.style.display = "block";

            content.appendChild(img);

            return new AdvancedMarkerElement({
                map,
                position,
                zIndex: tipo === "Pickup" ? 1000 : 900,
                title: stop?.title || stop?.id,
                content,
            });
        });

        return clearAdvancedMarkers;
    }, [coords, isLoaded, mapReady, shouldRenderCustomMarkers, stops]);

    if (loadError) {
        return (
            <div className="flex h-[340px] w-full items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                No pudimos cargar Google Maps (mock).
            </div>
        );
    }
    if (!isLoaded)
        return (
            <div className="h-[340px] w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        );

    const center = directions
        ? directions.routes?.[0]?.legs?.[0]?.start_location?.toJSON() ?? {
            lat: -35.426,
            lng: -71.655,
        }
        : snappedPath?.[0] ?? coords[0] ?? { lat: -35.426, lng: -71.655 };

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            options={{ mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID" }}
            onLoad={(map) => {
                mapRef.current = map;
                setMapReady(true);
            }}
            onUnmount={() => {
                mapRef.current = null;
                setMapReady(false);
                for (const marker of advancedMarkersRef.current) {
                    marker.map = null;
                }
                advancedMarkersRef.current = [];
            }}
        >
            {directions ? (
                <>
                    <DirectionsRenderer
                        key={directionsRenderKey || "directions"}
                        onLoad={(renderer) => {
                            directionsRendererRef.current = renderer;
                        }}
                        onUnmount={(renderer) => {
                            renderer.setMap(null);
                            if (directionsRendererRef.current === renderer) {
                                directionsRendererRef.current = null;
                            }
                        }}
                        options={{
                            directions,
                            suppressMarkers: renderCustomMarkersForDirections,
                            polylineOptions: { strokeOpacity: 0.9, strokeWeight: 4, strokeColor: "#2563EB" },
                            preserveViewport: true,
                        }}
                    />
                </>
            ) : (
                <>
                    {showPolyline && hasSnappedPath && (
                        <Polyline
                            key={`snapped-${snappedPath!.length}`}
                            path={snappedPath!}
                            options={{ strokeOpacity: 0.9, strokeWeight: 4, strokeColor: "#2563EB" }}
                        />
                    )}
                </>
            )}
        </GoogleMap>
    );
}
