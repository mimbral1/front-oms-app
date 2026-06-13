// views\Delivery\Tms\SimulacionRuta\components\SimRouteMap.tsx
"use client";

import {
    GoogleMap,
    DirectionsRenderer,
    OverlayView,
    useLoadScript,
} from "@react-google-maps/api";
import { useEffect, useMemo } from "react";
import { Warehouse } from "lucide-react";

export type LatLng = { lat: number; lng: number };

export type Stop = {
    id: string;
    title?: string;
    tipo?: "Pickup" | "Entrega";
    lat: number;
    lng: number;
};

export type RouteLayer = {
    id: string;
    color: string;
    directions?: google.maps.DirectionsResult; // ya optimizada
    stops: Stop[]; // para markers
};

const containerStyle = { width: "100%", height: "420px" };
const LIBRARIES: ("places")[] = ["places"];

function Pin({
    position,
    kind,
    index,
    color,
}: {
    position: LatLng;
    kind: "Pickup" | "Entrega";
    index?: number;
    color: string;
}) {
    return (
        <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="-translate-x-1/2 -translate-y-full z-[9999]">
                {kind === "Pickup" ? (
                    <div
                        className="flex items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
                        style={{ width: 34, height: 34 }}
                    >
                        <Warehouse size={18} color="white" />
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
                        style={{ width: 30, height: 30, background: color }}
                    >
                        {index}
                    </div>
                )}
            </div>
        </OverlayView>
    );
}

export default function SimRouteMap({ layers }: { layers: RouteLayer[] }) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: LIBRARIES,
        id: "sim-route-multi-map",
    });

    const center = useMemo(() => {
        const first = layers.find((l) => l.directions)?.directions;
        const c =
            first?.routes?.[0]?.legs?.[0]?.start_location?.toJSON() ??
            layers[0]?.stops?.[0] ??
            { lat: -35.426, lng: -71.655 };
        return c as LatLng;
    }, [layers]);

    useEffect(() => {
        // No-op: evitamos setState aquí para cero flicker.
    }, [layers]);

    if (loadError)
        return (
            <div className="h-[420px] w-full rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                No pudimos cargar Google Maps.
            </div>
        );
    if (!isLoaded)
        return (
            <div className="h-[420px] w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        );

    return (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
            {layers.map((layer) => {
                const color = layer.color || "#2F80ED";
                const legs = layer.directions?.routes?.[0]?.legs ?? [];
                const origin =
                    legs[0]?.start_location?.toJSON() ??
                    (layer.stops?.[0]
                        ? { lat: layer.stops[0].lat, lng: layer.stops[0].lng }
                        : undefined);

                return (
                    <div key={layer.id}>
                        {layer.directions && (
                            <DirectionsRenderer
                                options={{
                                    directions: layer.directions,
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeOpacity: 0.95,
                                        strokeWeight: 5,
                                        strokeColor: color,
                                        zIndex: 500,
                                    },
                                    preserveViewport: true, // evita “saltos”
                                }}
                            />
                        )}

                        {origin && <Pin position={origin} kind="Pickup" color={color} />}

                        {legs.map((leg, i) => {
                            const end = leg.end_location?.toJSON();
                            if (!end) return null;
                            return (
                                <Pin
                                    key={`${layer.id}-leg-${i}`}
                                    position={end}
                                    kind="Entrega"
                                    index={i + 1}
                                    color={color}
                                />
                            );
                        })}
                    </div>
                );
            })}
        </GoogleMap>
    );
}
