"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, Polygon, DrawingManager, useLoadScript } from "@react-google-maps/api";
import { ActionButton } from "@/components/ui/button/action-button";

export type Coverage = [number, number][][][];

type Props = {
    coverage: Coverage | null | undefined;
    onChange: (next: Coverage | null) => void;
    status?: "active" | "inactive";
    defaultCenter?: google.maps.LatLngLiteral;
    editable?: boolean;
    centerAddress?: string;
};

const containerStyle = { width: "100%", height: "700px" };
const centerDefault = { lat: -35.6036296, lng: -71.7348412 };
const LOADER_ID = "google-map-script";
const GMAPS_LIBS: ("places" | "drawing")[] = ["places", "drawing"];

type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord =>
    value && typeof value === "object" ? (value as UnknownRecord) : {};

function pathToCoverage(path: google.maps.LatLngLiteral[]): Coverage | null {
    if (!path?.length) return null;
    const first = path[0];
    const last = path[path.length - 1];
    const closed =
        Math.abs(first.lat - last.lat) < 1e-9 && Math.abs(first.lng - last.lng) < 1e-9
            ? path
            : [...path, first]; // ↍ cierre automático
    const ring: [number, number][] = closed.map((p) => [Number(p.lng), Number(p.lat)]);
    return [[ring]]; // EXACTAMENTE [[[lng, lat], ...]]
}

// 
function coverageToPath(
    coverage: Coverage | null | undefined
): google.maps.LatLngLiteral[] {
    try {
        // El ring es coverage[0][0]
        const ring = coverage?.[0]?.[0] as unknown[] | undefined;
        if (!Array.isArray(ring)) return [];
        // Acepta tanto [lng,lat] como {lat,lng} y lo deja normalizado
        const out: google.maps.LatLngLiteral[] = [];
        for (const p of ring) {
            if (Array.isArray(p) && p.length === 2) {
                const [lng, lat] = p;
                if (Number.isFinite(lat) && Number.isFinite(lng)) out.push({ lat: +lat, lng: +lng });
            } else {
                const point = asRecord(p);
                if (typeof point.lat === "number" && typeof point.lng === "number") {
                    out.push({ lat: +point.lat, lng: +point.lng });
                }
            }
        }
        return out;
    } catch {
        return [];
    }
}


export default function MapaGeofence({
    coverage,
    onChange,
    status = "active",
    defaultCenter,
    editable = true,
    centerAddress,
}: Props) {
    const { isLoaded, loadError } = useLoadScript({
        id: LOADER_ID,
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: GMAPS_LIBS,
    });

    // helpers
    // Sanitiza cualquier array a [{lat,lng}] con números finitos
    const sanitizePath = useCallback((arr: unknown[]): google.maps.LatLngLiteral[] =>
        (Array.isArray(arr) ? arr : [])
            .map((p) =>
                Array.isArray(p) && p.length === 2
                    ? { lat: +p[1], lng: +p[0] }               // [lng,lat] → {lat,lng}
                    : (() => {
                        const point = asRecord(p);
                        const lat = typeof point.lat === "number" ? point.lat : Number.NaN;
                        const lng = typeof point.lng === "number" ? point.lng : Number.NaN;
                        return { lat, lng };
                    })()            // {lat,lng} → {lat,lng}
            )
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)), []);

    // Emite SIEMPRE con path saneado y cierra anillo antes de propagar
    const emitFromPath = useCallback((p: unknown[]) => {
        const clean = sanitizePath(p);
        onChange(pathToCoverage(clean)); // ↍ cierra el anillo y devuelve [[[...]]]
    }, [onChange, sanitizePath]);

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const initialPath = sanitizePath(coverageToPath(coverage));
    const [path, setPath] = useState<google.maps.LatLngLiteral[]>(initialPath);
    const [center, setCenter] = useState<google.maps.LatLngLiteral>(
        initialPath.length ? initialPath[0] : (defaultCenter || centerDefault)
    );

    const [drawing, setDrawing] = useState(false); // estado local para saber si estamos dibujando


    const polygonRef = useRef<google.maps.Polygon | null>(null);
    const dmRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

    function attachPathListeners(poly: google.maps.Polygon) {
        // limpia listeners previos
        listenersRef.current.forEach((l) => l.remove());
        listenersRef.current = [];

        const mvc = poly.getPath();

        const emitFromMVC = () => {
            const arr = mvc.getArray().map((pt) => ({ lat: pt.lat(), lng: pt.lng() }));
            emitFromPath(arr);
        };

        // Emitir SOLO cuando termina el gesto o se agrega/borra vértice
        listenersRef.current.push(google.maps.event.addListener(mvc, "insert_at", emitFromMVC));
        listenersRef.current.push(google.maps.event.addListener(mvc, "remove_at", emitFromMVC));
        listenersRef.current.push(google.maps.event.addListener(poly, "mouseup", emitFromMVC));
        listenersRef.current.push(google.maps.event.addListener(poly, "dragend", emitFromMVC));

        // Eliminar vértice con clic derecho
        listenersRef.current.push(
            google.maps.event.addListener(poly, "rightclick", (e: unknown) => {
                const eventLike = e as { vertex?: unknown };
                if (typeof eventLike.vertex === "number") mvc.removeAt(eventLike.vertex);
            })
        );
    }

    useEffect(() => {
        const next = sanitizePath(coverageToPath(coverage));
        if (next.length) setPath(next);
    }, [coverage, sanitizePath]);

    useEffect(() => {
        if (!map || path.length < 1) return;
        const b = new google.maps.LatLngBounds();
        for (const p of path) if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) b.extend(p);
        if (!b.isEmpty()) map.fitBounds(b);
    }, [map, path]);

    useEffect(() => {
        const q = (centerAddress || "").trim();
        if (!isLoaded || !q) return;
        if (path.length) return; // si ya hay polígono, no mover el centro
        (async () => {
            try {
                const res = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
                );
                const data = await res.json();
                const loc = data?.results?.[0]?.geometry?.location;
                if (loc?.lat && loc?.lng) setCenter({ lat: loc.lat, lng: loc.lng });
            } catch { }
        })();
    }, [centerAddress, isLoaded, path.length]);

    // Emite la versión final del polígono cuando sales de edición
    useEffect(() => {
        if (!polygonRef.current) return;
        // Asegura que el polígono refleje el modo actual
        polygonRef.current.setEditable(!!editable);

        // Si acabamos de DESACTIVAR edición, emitir una última vez el coverage
        if (!editable) {
            const mvc = polygonRef.current.getPath();
            const arr = mvc.getArray().map((pt) => ({ lat: pt.lat(), lng: pt.lng() }));
            // Mantén tu normalización y cierre de anillo
            emitFromPath(arr);
        }
    }, [editable, emitFromPath]);


    const polyOptions = useMemo<google.maps.PolygonOptions>(
        () => ({
            strokeWeight: 2,
            strokeOpacity: 0.9,
            fillOpacity: 0.12,
            strokeColor: status === "active" ? "#16a34a" : "#6b7280",
            fillColor: status === "active" ? "#16a34a" : "#6b7280",
            clickable: true,
            editable, // ↍ permite mover/agregar/quitar vértices
            draggable: false,
            zIndex: 2,
        }),
        [status, editable]
    );

    if (loadError) {
        return (
            <div className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center">
                <div>
                    <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">!</div>
                    <div className="text-base font-semibold text-gray-900">No pudimos cargar el mapa</div>
                    <div className="mt-1 text-sm text-gray-500">Revisa la clave y restricciones de Google Maps.</div>
                </div>
            </div>
        );
    }
    if (!isLoaded) {
        return <div className="h-[420px] w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50" />;
    }

    // al terminar de dibujar: tomar path, normalizar y desmontar overlay nativo
    const handlePolygonComplete = (poly: google.maps.Polygon) => {
        const googlePath = poly.getPath().getArray().map((p) => ({ lat: p.lat(), lng: p.lng() }));
        emitFromPath(googlePath);
        attachPathListeners(poly);
        poly.setMap(null); // evita ver “dos” figuras (overlay nativo)
        // al completar, salimos del modo dibujo
        dmRef.current?.setDrawingMode(null);
        setDrawing(false);
    };

    const startDrawing = () => {
        dmRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
        setDrawing(true);
    };

    // salir del modo dibujo SIN crear nada
    const stopDrawing = () => {
        dmRef.current?.setDrawingMode(null);
        setDrawing(false);
    };

    const clearPolygon = () => {
        // limpia listeners y figura react
        listenersRef.current.forEach((l) => l.remove());
        listenersRef.current = [];
        if (polygonRef.current) {
            polygonRef.current.setMap(null);
            polygonRef.current = null;
        }
        setPath([]);
        onChange(null);
        dmRef.current?.setDrawingMode(null);
        setDrawing(false);
    };

    const polygon =
        path?.length ? (
            <Polygon
                path={path}
                options={{
                    ...polyOptions,
                }}
                onLoad={(p) => {
                    polygonRef.current = p;
                    attachPathListeners(p); // escuchar ediciones del usuario
                }}
                onUnmount={() => {
                    listenersRef.current.forEach((l) => l.remove());
                    listenersRef.current = [];
                    polygonRef.current = null;
                }}
            />
        ) : null;

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold">Herramientas:</span>
                <span>Dibuja un polígono o edita el existente.</span>
                {!path?.length && (
                    <ActionButton
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={startDrawing}
                        className="ml-auto"
                    >
                        Dibujar polígono
                    </ActionButton>
                )}

                {drawing && (
                    <ActionButton
                        type="button"
                        variant="warning"
                        size="sm"
                        onClick={stopDrawing}
                        className="ml-auto"
                    >
                        Terminar dibujo
                    </ActionButton>
                )}

                {path?.length ? (
                    <ActionButton
                        type="button"
                        variant="error"
                        size="sm"
                        onClick={clearPolygon}
                        className="ml-auto"
                    >
                        Borrar polígono
                    </ActionButton>
                ) : null}
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                // center={path.length ? { lat: path[0].lat, lng: path[0].lng } : center}
                center={center}
                zoom={path?.length ? 14 : 12}
                onLoad={setMap}
            >
                {polygon}

                {/* DrawingManager sin toolbar nativa; lo activamos con el botón */}
                <DrawingManager
                    onLoad={(dm) => {
                        dmRef.current = dm;
                        dm.setDrawingMode(null);
                    }}
                    onUnmount={() => {
                        dmRef.current = null;
                    }}
                    onPolygonComplete={handlePolygonComplete}
                    options={{
                        drawingControl: false,
                        polygonOptions: polyOptions,
                    }}
                />
            </GoogleMap>
        </div>
    );
}
