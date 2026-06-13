// views\Delivery\Rutas\components\RutasNuevoFields.tsx
"use client";

/* ==========================================================================
   RUTAS NUEVO
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { ArrowLeft, ChevronDown, ChevronRight, GripVertical, Home, RotateCcw, ShoppingBasket, Trash2 } from "lucide-react";
import MockRouteMap, { LatLng, stopsToCoords } from "./MockRouteMap";
import { getWarehouseLatLng } from "./talca.mock";
import { ActionButton } from "@/components/ui/button/action-button";

/* ---------- Tipos ---------- */

type Stop = { id: string; title?: string; tipo?: "pickup" | "drop"; inventario?: string };

// para usar colores por cada entrega 
function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}
const PALETTE = ["#2F80ED", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#F97316", "#14B8A6", "#6366F1"];
function colorForInventario(inv?: string) {
    const key = inv || "Talca Centro";
    return PALETTE[hash(key) % PALETTE.length];
}

const formatEstimatedTime = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes < 0) return "0 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;

    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const remMinutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(remMinutes).padStart(2, "0")}`;
};

export interface RutaEntrega {
    id: string;
    externalId?: string;
    tipo: "Pickup" | "Entrega";
    inventario: string;
    lat?: number;
    lng?: number;
    fechaVentana?: string;
    scheduleStart?: string;
    scheduleEnd?: string;
    contenedores?: number;
    seleccionado?: boolean;
    warehouseKey?: string;
    warehouseId?: string;
    loading?: boolean;
}

export interface RutaNuevoRecord {
    agendaDesde: string;
    agendaHasta: string;
    inventarioId?: string;
    transportistaId?: string;
    entregas: RutaEntrega[];
    metricas: { tiempoMin: number; distanciaKm: number; paradas: number };
    destinoFinal?: string;
    // driverData se inyecta desde el modal (Nuevo.tsx)
    [k: string]: any;
    directions?: any; // google.maps.DirectionsResult (cuando se confirme optimización)
    snappedPath?: LatLng[];
    snappedMetrics?: { distanciaKm: number; tiempoMin: number; paradas: number };
}

async function getRoadRouteFromOsrm(coords: LatLng[]) {
    if (coords.length < 2) return undefined;

    const path = coords.map((c) => `${c.lng},${c.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson&steps=true&continue_straight=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM HTTP ${response.status}`);

    const payload = await response.json();
    const route = payload?.routes?.[0];
    const geometry = route?.geometry?.coordinates;
    if (!Array.isArray(geometry) || geometry.length < 2) return undefined;

    const snappedPath: LatLng[] = geometry
        .filter((p: any) => Array.isArray(p) && p.length >= 2)
        .map((p: any) => ({ lat: Number(p[1]), lng: Number(p[0]) }))
        .filter((p: LatLng) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (snappedPath.length < 2) return undefined;

    const distanciaKm = Number(((route?.distance ?? 0) / 1000).toFixed(2));
    const tiempoMin = Math.round((route?.duration ?? 0) / 60);

    return {
        snappedPath,
        metrics: {
            distanciaKm,
            tiempoMin,
            paradas: coords.length,
        },
    };
}

export function RutasNuevoFields({
    record,
    readOnly = false,
    onChange,
    onCreate,
    onOptimize,
    onOpenDriverModal,
    onPickupPress,
}: {
    record: RutaNuevoRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof RutaNuevoRecord>(field: K, value: RutaNuevoRecord[K]) => void;
    onCreate?: () => void;
    onOptimize?: () => void;
    onOpenDriverModal?: () => void;
    onPickupPress?: (pickup: RutaEntrega) => void;
}) {
    const [flowStep, setFlowStep] = useState<"selection" | "routing">("selection");
    const canDragGroupedList = record.routingStep === "routing";
    const [focusedShippingId, setFocusedShippingId] = useState<string | null>(null);
    const [buildingRoute, setBuildingRoute] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [mapResetToken, setMapResetToken] = useState(0);
    const directionsRequestRef = useRef(0);
    const isPickupTipo = useCallback((tipo: unknown) => String(tipo || "").toLowerCase() === "pickup", []);

    useEffect(() => {
        const hasRouteOnMap = Boolean(record.directions || (record.snappedPath && record.snappedPath.length > 1));
        if (hasRouteOnMap || record.routingStep === "routing") {
            setFlowStep("routing");
            onChange?.("routingStep", "routing" as any);
        }
    }, [record.directions, record.routingStep, record.snappedPath, onChange]);

    useEffect(() => {
        if (!record.routeOptimized) return;
        // Cancela requests previos para que no sobreescriban la ruta optimizada al resolver tarde.
        directionsRequestRef.current += 1;
        setBuildingRoute(false);
    }, [record.routeOptimized]);

    useEffect(() => {
        const version = Number((record as any).optimizedRouteVersion || 0);
        if (!version) return;
        // Limpia overlays residuales al confirmar una nueva ruta optimizada.
        setMapResetToken((v) => v + 1);
    }, [(record as any).optimizedRouteVersion]);

    const clearOptimizedDirections = useCallback(() => {
        directionsRequestRef.current += 1;
        onChange?.("directions", undefined as any);
        onChange?.("snappedPath", undefined as any);
        onChange?.("snappedMetrics", undefined as any);
        onChange?.("routeOptimized", false as any);
        setBuildingRoute(false);
    }, [onChange]);

    const mapStopsFromEntregas = useCallback((entregas: RutaEntrega[]) => {
        const out: {
            id: string; title?: string; tipo: "Pickup" | "Entrega"; inventario: string; lat?: number; lng?: number;
        }[] = [];

        const routeOrdered = entregas.filter((e) => !!e.seleccionado);

        for (const e of routeOrdered) {
            if (!e.seleccionado) continue;

            if (e.tipo === "Pickup") {
                const w =
                    Number.isFinite(e.lat) && Number.isFinite(e.lng)
                        ? { lat: Number(e.lat), lng: Number(e.lng) }
                        : getWarehouseLatLng(e.inventario);
                out.push({
                    id: String(e.id),
                    title: String(e.id),
                    tipo: "Pickup",
                    inventario: e.inventario,
                    lat: w.lat,
                    lng: w.lng,
                });
                continue;
            }

            out.push({
                id: String(e.id),
                title: e.externalId || e.id,
                tipo: "Entrega",
                inventario: e.inventario,
                lat: Number.isFinite(e.lat) ? Number(e.lat) : undefined,
                lng: Number.isFinite(e.lng) ? Number(e.lng) : undefined,
            });
        }

        return out;
    }, []);

    const calculateDirectionsInOrder = useCallback(
        async (
            orderedStops: {
                id: string; title?: string; tipo: "Pickup" | "Entrega"; inventario: string; lat?: number; lng?: number;
            }[]
        ) => {
            const requestId = ++directionsRequestRef.current;

            if (orderedStops.length < 2) {
                if (directionsRequestRef.current !== requestId) return;
                onChange?.("directions", undefined as any);
                onChange?.("snappedPath", undefined as any);
                onChange?.("snappedMetrics", undefined as any);
                onChange?.("routeOptimized", false as any);
                setBuildingRoute(false);
                return;
            }

            const coords = stopsToCoords(orderedStops as any);

            setBuildingRoute(true);

            try {
                const osrmRoute = await getRoadRouteFromOsrm(coords);
                if (directionsRequestRef.current !== requestId) return;

                if (osrmRoute) {
                    onChange?.("directions", undefined as any);
                    onChange?.("snappedPath", osrmRoute.snappedPath as any);
                    onChange?.("snappedMetrics", osrmRoute.metrics as any);
                    onChange?.("routeOptimized", false as any);
                    return;
                }

                onChange?.("directions", undefined as any);
                onChange?.("snappedPath", undefined as any);
                onChange?.("snappedMetrics", undefined as any);
                onChange?.("routeOptimized", false as any);
            } catch (error) {
                if (directionsRequestRef.current !== requestId) return;
                console.error("Error calculando ruta vial (OSRM):", error);

                onChange?.("directions", undefined as any);
                onChange?.("snappedPath", undefined as any);
                onChange?.("snappedMetrics", undefined as any);
                onChange?.("routeOptimized", false as any);
            } finally {
                if (directionsRequestRef.current === requestId) setBuildingRoute(false);
            }
        },
        [onChange]
    );

    const toggleEntrega = (index: number) => {
        const current = record.entregas;
        if (index < 0 || index >= current.length) return;
        const target = current[index];
        if (!target) return;
        if (isPickupTipo(target.tipo)) {
            onPickupPress?.(target);
            return;
        }

        const willSelect = !target.seleccionado;
        if (willSelect) {
            setFocusedShippingId(String(target.id));
        } else if (focusedShippingId === String(target.id)) {
            setFocusedShippingId(null);
        }
        const next = current.map((item, i) => (i === index ? { ...item, seleccionado: willSelect } : item));

        onChange?.("entregas", next);
        const paradas = next.filter((e) => e.seleccionado).length;
        onChange?.("metricas", { ...record.metricas, paradas });

        if (canDragGroupedList) {
            clearOptimizedDirections();
            void calculateDirectionsInOrder(mapStopsFromEntregas(next));
        }
    };

    const reorderEntregas = useCallback(
        (fromId: string, toId: string) => {
            if (!fromId || !toId || fromId === toId) return;

            const selected = record.entregas.filter((e) => !!e.seleccionado);
            const fromSelectedIndex = selected.findIndex((e) => String(e.id) === String(fromId));
            const toSelectedIndex = selected.findIndex((e) => String(e.id) === String(toId));
            if (fromSelectedIndex < 0 || toSelectedIndex < 0) return;

            const reorderedSelected = [...selected];
            const [moving] = reorderedSelected.splice(fromSelectedIndex, 1);
            reorderedSelected.splice(toSelectedIndex, 0, moving);

            let selectedPointer = 0;
            const next = record.entregas.map((item) => {
                if (!item.seleccionado) return item;
                const replacement = reorderedSelected[selectedPointer];
                selectedPointer += 1;
                return replacement;
            });

            onChange?.("entregas", next as any);

            if (canDragGroupedList) {
                clearOptimizedDirections();
                void calculateDirectionsInOrder(mapStopsFromEntregas(next));
            }
        },
        [calculateDirectionsInOrder, canDragGroupedList, clearOptimizedDirections, mapStopsFromEntregas, onChange, record.entregas]
    );

    const stops = useMemo(() => mapStopsFromEntregas(record.entregas), [mapStopsFromEntregas, record.entregas]);

    const selectedDeliveries = useMemo(
        () => record.entregas.filter((e) => e.seleccionado && !isPickupTipo(e.tipo)),
        [isPickupTipo, record.entregas]
    );
    const selectedOrderMap = useMemo(() => {
        const map = new Map<string, number>();
        const selectedInOrder = record.entregas.filter((e) => !!e.seleccionado);
        selectedInOrder.forEach((e, idx) => {
            map.set(String(e.id), idx + 1);
        });
        return map;
    }, [record.entregas]);
    const selectedShippingCount = selectedDeliveries.length;
    const isShippingFromPickup = useCallback((shipping: RutaEntrega, pickup: RutaEntrega) => {
        const pickupCandidates = [pickup.warehouseId, pickup.warehouseKey, pickup.inventario]
            .map((value) => String(value ?? "").trim().toLowerCase())
            .filter(Boolean);

        const shippingCandidates = [shipping.warehouseId, shipping.warehouseKey, shipping.inventario]
            .map((value) => String(value ?? "").trim().toLowerCase())
            .filter(Boolean);

        if (!shippingCandidates.length || !pickupCandidates.length) return false;
        return shippingCandidates.some((candidate) => pickupCandidates.includes(candidate));
    }, []);

    const groupedEntregas = useMemo(() => {
        const entries = record.entregas.map((e, idx) => ({ e, idx }));
        const pickupEntries = entries.filter((entry) => isPickupTipo(entry.e.tipo));
        const shippingEntries = entries.filter((entry) => !isPickupTipo(entry.e.tipo));

        const usedShippingIndexes = new Set<number>();

        const pickupGroups = pickupEntries.map((pickupEntry) => {
            const children = shippingEntries
                .filter((shippingEntry) => isShippingFromPickup(shippingEntry.e, pickupEntry.e))
                .sort((a, b) => Number(Boolean(b.e.seleccionado)) - Number(Boolean(a.e.seleccionado)));

            children.forEach((child) => usedShippingIndexes.add(child.idx));

            return {
                pickup: pickupEntry,
                children,
            };
        });

        const orphanShippings = shippingEntries.filter((entry) => !usedShippingIndexes.has(entry.idx));

        return { pickupGroups, orphanShippings };
    }, [isPickupTipo, isShippingFromPickup, record.entregas]);
    const routingEntries = useMemo(
        () => record.entregas.map((e, idx) => ({ e, idx })).filter(({ e }) => !!e.seleccionado),
        [record.entregas]
    );
    const hasAnySelected = useMemo(() => record.entregas.some((e) => !!e.seleccionado), [record.entregas]);
    const hasSelectedDropoffs = useMemo(
        () => record.entregas.some((e) => !!e.seleccionado && !isPickupTipo(e.tipo)),
        [isPickupTipo, record.entregas]
    );
    const directionsRenderKey = useMemo(() => {
        const selectedIds = record.entregas
            .filter((e) => e.seleccionado)
            .map((e) => String(e.id))
            .join("|");
        const routeKind = record.directions ? "dir" : record.snappedPath?.length ? `snapped-${record.snappedPath.length}` : "none";
        const optimized = record.routeOptimized ? "opt" : "base";
        const metricSig = `${record.metricas?.distanciaKm ?? ""}-${record.metricas?.tiempoMin ?? ""}-${record.metricas?.paradas ?? ""}`;
        return `${routeKind}:${optimized}:${selectedIds}:${metricSig}`;
    }, [record.directions, record.entregas, record.metricas, record.routeOptimized, record.snappedPath]);

    useEffect(() => {
        if (!record.destinoFinal) return;
        const exists = selectedDeliveries.some((e) => String(e.id) === String(record.destinoFinal));
        if (!exists) onChange?.("destinoFinal", "");
    }, [record.destinoFinal, selectedDeliveries, onChange]);

    const handleNext = useCallback(() => {
        if (selectedDeliveries.length === 0) return;

        setFlowStep("routing");
        onChange?.("routingStep", "routing" as any);

        // Calcula ruta real por calles manteniendo el orden visual 1 -> 2 -> 3.
        void calculateDirectionsInOrder(stops);
    }, [calculateDirectionsInOrder, onChange, selectedDeliveries.length, stops]);

    const handleRestoreSelection = useCallback(() => {
        const firstPickupId = record.entregas.find((e) => e.tipo === "Pickup")?.id;
        const restoredEntregas = record.entregas.map((e) => {
            if (e.tipo === "Pickup") {
                return { ...e, seleccionado: e.id === firstPickupId };
            }
            return { ...e, seleccionado: false };
        });

        onChange?.("entregas", restoredEntregas);
        onChange?.("destinoFinal", "" as any);
        onChange?.("directions", undefined as any);
        onChange?.("snappedPath", undefined as any);
        onChange?.("snappedMetrics", undefined as any);
        onChange?.("routeOptimized", false as any);
        onChange?.("metricas", { ...record.metricas, paradas: firstPickupId ? 1 : 0 });
        onChange?.("routingStep", "selection" as any);
        setFlowStep("selection");
    }, [onChange, record.entregas, record.metricas]);

    const handleBackToSelection = useCallback(() => {
        onChange?.("destinoFinal", "" as any);
        onChange?.("directions", undefined as any);
        onChange?.("snappedPath", undefined as any);
        onChange?.("snappedMetrics", undefined as any);
        onChange?.("routeOptimized", false as any);
        onChange?.("routingStep", "selection" as any);
        setFlowStep("selection");
    }, [onChange]);

    const handleMetrics = useCallback(
        (m: any) => {
            // Solo actualiza si realmente cambian las métricas
            const next = { ...record.metricas, ...m };
            const prev = record.metricas;
            if (
                next.tiempoMin !== prev.tiempoMin ||
                next.distanciaKm !== prev.distanciaKm ||
                next.paradas !== prev.paradas
            ) {
                onChange?.("metricas", next);
            }
        },
        [onChange, record.metricas]
    );

    return (
        <div className="flex h-full flex-col overflow-hidden pt-2">
            <div className="grid flex-1 min-h-0 overflow-hidden grid-cols-1 gap-0 lg:grid-cols-[38%_62%]">
                <div className="min-h-0 overflow-y-auto px-2 pb-3 pt-6">
                    <div className="mb-3 grid grid-cols-[24px_1fr_120px] items-center gap-3 px-2">
                        <input type="checkbox" disabled className="h-4 w-4" aria-label="Seleccionar todos" />
                        <span className="text-xs uppercase tracking-wide text-gray-500">ID</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500">Contenedores</span>
                    </div>

                    <div className="grid grid-cols-6 gap-3">

                        {canDragGroupedList && routingEntries.map(({ e, idx }) => {
                            const colorHex = colorForInventario(e.inventario);
                            const isDropTarget = dragOverId === String(e.id) && draggedId !== String(e.id);
                            const isPickup = e.tipo === "Pickup";

                            return (
                                <div
                                    key={`${e.id}-${idx}`}
                                    className="col-span-6"
                                    onDragOver={(ev) => {
                                        ev.preventDefault();
                                        setDragOverId(String(e.id));
                                    }}
                                    onDragLeave={() => setDragOverId(null)}
                                    onDrop={(ev) => {
                                        ev.preventDefault();
                                        if (draggedId) reorderEntregas(draggedId, String(e.id));
                                        setDraggedId(null);
                                        setDragOverId(null);
                                    }}
                                >
                                    <div className={`relative rounded-lg bg-white shadow-sm ring-1 ${isDropTarget ? "ring-blue-400" : "ring-gray-200"}`}>
                                        <div className="absolute left-0 top-0 h-full w-1 rounded-l" style={{ background: colorHex }} />

                                        <div className="flex items-stretch justify-between">
                                            <div className="flex flex-1 items-center gap-3 p-3">
                                                <button
                                                    type="button"
                                                    draggable
                                                    onDragStart={() => {
                                                        setDraggedId(String(e.id));
                                                    }}
                                                    onDragEnd={() => {
                                                        setDraggedId(null);
                                                        setDragOverId(null);
                                                    }}
                                                    className="rounded p-0.5 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600"
                                                    aria-label="Mover entrega"
                                                    title="Arrastrar para reordenar"
                                                >
                                                    <GripVertical className="h-4 w-4" />
                                                </button>

                                                <div className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                                                    {selectedOrderMap.get(String(e.id))}
                                                </div>

                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        {isPickup ? (
                                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                                                                <Home className="h-4 w-4" /> {e.inventario}
                                                            </span>
                                                        ) : (
                                                            <a className="text-sm font-semibold text-gray-700">{e.externalId || e.id}</a>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-600">{isPickup ? "Pickup" : "Entrega"}</div>
                                                    {!isPickup && e.fechaVentana && <div className="text-xs text-gray-500">{e.fechaVentana}</div>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 p-3">
                                                {!isPickup && (
                                                    <div className="inline-flex items-center gap-1 text-sm text-gray-600">
                                                        <ShoppingBasket className="h-4 w-4 text-gray-500" />
                                                        {e.contenedores ?? "-"}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEntrega(idx)}
                                                    className="rounded p-1 text-red-500 opacity-70 hover:bg-red-50 hover:opacity-100"
                                                    aria-label={isPickup ? "Quitar pickup" : "Quitar entrega"}
                                                    title={isPickup ? "Quitar pickup" : "Quitar entrega"}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {!canDragGroupedList && (
                            <>

                                {groupedEntregas.pickupGroups.map(({ pickup, children }) => {
                                    const e = pickup.e;
                                    const idx = pickup.idx;
                                    const colorHex = colorForInventario(e.inventario);
                                    const isDropTarget = dragOverId === String(e.id) && draggedId !== String(e.id);
                                    return (
                                        <div
                                            key={`${e.id}-${idx}`}
                                            className="col-span-6"
                                            onDragOver={(ev) => {
                                                if (!canDragGroupedList) return;
                                                ev.preventDefault();
                                                if (e.tipo !== "Pickup") setDragOverId(String(e.id));
                                            }}
                                            onDragLeave={() => setDragOverId(null)}
                                            onDrop={(ev) => {
                                                if (!canDragGroupedList) return;
                                                ev.preventDefault();
                                                if (draggedId) reorderEntregas(draggedId, String(e.id));
                                                setDraggedId(null);
                                                setDragOverId(null);
                                            }}
                                        >
                                            <div className={`relative rounded-lg bg-white shadow-sm ring-1 ${isDropTarget ? "ring-blue-400" : "ring-gray-200"}`}>
                                                <div
                                                    className="absolute left-0 top-0 h-full w-1 rounded-l"
                                                    style={{ background: colorHex }}
                                                />
                                                <div className="flex items-stretch justify-between">
                                                    <div className="flex flex-1 items-center gap-3 p-3">
                                                        <button
                                                            type="button"
                                                            draggable={canDragGroupedList && e.tipo !== "Pickup"}
                                                            onDragStart={() => {
                                                                if (!canDragGroupedList || e.tipo === "Pickup") return;
                                                                setDraggedId(String(e.id));
                                                            }}
                                                            onDragEnd={() => {
                                                                setDraggedId(null);
                                                                setDragOverId(null);
                                                            }}
                                                            className={`rounded p-0.5 text-gray-400 ${!canDragGroupedList || e.tipo === "Pickup" ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing hover:text-gray-600"}`}
                                                            aria-label="Mover entrega"
                                                            title={
                                                                !canDragGroupedList
                                                                    ? "Disponible después de presionar Siguiente"
                                                                    : e.tipo === "Pickup"
                                                                        ? "El pickup no se puede mover"
                                                                        : "Arrastrar para reordenar"
                                                            }
                                                        >
                                                            <GripVertical className="h-4 w-4" />
                                                        </button>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!e.seleccionado}
                                                            onChange={() => toggleEntrega(idx)}
                                                            className="h-4 w-4"
                                                        />
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                {e.tipo === "Pickup" ? (
                                                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                                                                        {canDragGroupedList && e.seleccionado && selectedOrderMap.has(String(e.id)) && (
                                                                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                                                                                {selectedOrderMap.get(String(e.id))}
                                                                            </span>
                                                                        )}
                                                                        <Home className="h-4 w-4" /> {e.inventario}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-2">
                                                                        {canDragGroupedList && e.seleccionado && (
                                                                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                                                                                {selectedOrderMap.get(String(e.id))}
                                                                            </span>
                                                                        )}
                                                                        <a className="text-sm font-semibold text-gray-700">{e.externalId || e.id}</a>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-600">{e.tipo === "Pickup" ? "Pickup" : "Dropoff"}</div>
                                                            {e.tipo === "Pickup" && e.loading && (
                                                                <div className="text-xs text-blue-600">Cargando shippings...</div>
                                                            )}
                                                            {e.fechaVentana && <div className="text-xs text-gray-500">{e.fechaVentana}</div>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 p-3">
                                                        {e.tipo !== "Pickup" && (
                                                            <div className="inline-flex items-center gap-1 text-sm text-gray-600">
                                                                <ShoppingBasket className="h-4 w-4 text-gray-500" />
                                                                {e.contenedores ?? "-"}
                                                            </div>
                                                        )}
                                                        {e.tipo === "Pickup" ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleEntrega(idx)}
                                                                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                                aria-label={e.seleccionado ? "Ocultar shippings" : "Mostrar shippings"}
                                                                title={e.seleccionado ? "Ocultar shippings" : "Mostrar shippings"}
                                                            >
                                                                {e.seleccionado ? (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <Trash2 className="h-4 w-4 text-red-500 opacity-50" />
                                                        )}
                                                    </div>
                                                </div>

                                                {e.seleccionado && children.length > 0 && (
                                                    <div className="ml-6 mr-3 mb-3 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
                                                        <div className="space-y-2">
                                                            {children.map((childEntry) => {
                                                                const child = childEntry.e;
                                                                const childIdx = childEntry.idx;
                                                                const childDropTarget = dragOverId === String(child.id) && draggedId !== String(child.id);
                                                                return (
                                                                    <div
                                                                        key={`${child.id}-${childIdx}`}
                                                                        onDragOver={(ev) => {
                                                                            if (!canDragGroupedList) return;
                                                                            ev.preventDefault();
                                                                            setDragOverId(String(child.id));
                                                                        }}
                                                                        onDragLeave={() => setDragOverId(null)}
                                                                        onDrop={(ev) => {
                                                                            if (!canDragGroupedList) return;
                                                                            ev.preventDefault();
                                                                            if (draggedId) reorderEntregas(draggedId, String(child.id));
                                                                            setDraggedId(null);
                                                                            setDragOverId(null);
                                                                        }}
                                                                        className={`relative rounded-lg bg-white shadow-sm ring-1 ${childDropTarget ? "ring-blue-400" : "ring-gray-200"}`}
                                                                    >
                                                                        <div
                                                                            className="absolute left-0 top-0 h-full w-1 rounded-l"
                                                                            style={{ background: colorHex }}
                                                                        />
                                                                        <div className="flex items-stretch justify-between">
                                                                            <div className="flex flex-1 items-center gap-3 p-3">
                                                                                <button
                                                                                    type="button"
                                                                                    draggable={canDragGroupedList}
                                                                                    onDragStart={() => {
                                                                                        if (!canDragGroupedList) return;
                                                                                        setDraggedId(String(child.id));
                                                                                    }}
                                                                                    onDragEnd={() => {
                                                                                        setDraggedId(null);
                                                                                        setDragOverId(null);
                                                                                    }}
                                                                                    className={`rounded p-0.5 text-gray-400 ${!canDragGroupedList ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing hover:text-gray-600"}`}
                                                                                    aria-label="Mover entrega"
                                                                                    title={!canDragGroupedList ? "Disponible después de presionar Siguiente" : "Arrastrar para reordenar"}
                                                                                >
                                                                                    <GripVertical className="h-4 w-4" />
                                                                                </button>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={!!child.seleccionado}
                                                                                    onChange={() => toggleEntrega(childIdx)}
                                                                                    className="h-4 w-4"
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="inline-flex items-center gap-2">
                                                                                            {canDragGroupedList && child.seleccionado && (
                                                                                                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                                                                                                    {selectedOrderMap.get(String(child.id))}
                                                                                                </span>
                                                                                            )}
                                                                                            <a className="text-sm font-semibold text-gray-700">{child.externalId || child.id}</a>
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-600">Dropoff</div>
                                                                                    {child.fechaVentana && <div className="text-xs text-gray-500">{child.fechaVentana}</div>}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center gap-2 p-3">
                                                                                <div className="inline-flex items-center gap-1 text-sm text-gray-600">
                                                                                    <ShoppingBasket className="h-4 w-4 text-gray-500" />
                                                                                    {child.contenedores ?? "-"}
                                                                                </div>
                                                                                <Trash2 className="h-4 w-4 text-red-500 opacity-50" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {groupedEntregas.orphanShippings.map(({ e, idx }) => {
                                    const colorHex = colorForInventario(e.inventario);
                                    const isDropTarget = dragOverId === String(e.id) && draggedId !== String(e.id);
                                    return (
                                        <div
                                            key={`${e.id}-${idx}`}
                                            className="col-span-6"
                                            onDragOver={(ev) => {
                                                if (!canDragGroupedList) return;
                                                ev.preventDefault();
                                                setDragOverId(String(e.id));
                                            }}
                                            onDragLeave={() => setDragOverId(null)}
                                            onDrop={(ev) => {
                                                if (!canDragGroupedList) return;
                                                ev.preventDefault();
                                                if (draggedId) reorderEntregas(draggedId, String(e.id));
                                                setDraggedId(null);
                                                setDragOverId(null);
                                            }}
                                        >
                                            <div className={`relative rounded-lg bg-white shadow-sm ring-1 ${isDropTarget ? "ring-blue-400" : "ring-gray-200"}`}>
                                                <div
                                                    className="absolute left-0 top-0 h-full w-1 rounded-l"
                                                    style={{ background: colorHex }}
                                                />
                                                <div className="flex items-stretch justify-between">
                                                    <div className="flex flex-1 items-center gap-3 p-3">
                                                        <button
                                                            type="button"
                                                            draggable={canDragGroupedList}
                                                            onDragStart={() => {
                                                                if (!canDragGroupedList) return;
                                                                setDraggedId(String(e.id));
                                                            }}
                                                            onDragEnd={() => {
                                                                setDraggedId(null);
                                                                setDragOverId(null);
                                                            }}
                                                            className={`rounded p-0.5 text-gray-400 ${!canDragGroupedList ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing hover:text-gray-600"}`}
                                                            aria-label="Mover entrega"
                                                        >
                                                            <GripVertical className="h-4 w-4" />
                                                        </button>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!e.seleccionado}
                                                            onChange={() => toggleEntrega(idx)}
                                                            className="h-4 w-4"
                                                        />
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-2">
                                                                    {canDragGroupedList && e.seleccionado && (
                                                                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                                                                            {selectedOrderMap.get(String(e.id))}
                                                                        </span>
                                                                    )}
                                                                    <a className="text-sm font-semibold text-gray-700">{e.externalId || e.id}</a>
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-600">Dropoff</div>
                                                            {e.fechaVentana && <div className="text-xs text-gray-500">{e.fechaVentana}</div>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-3">
                                                        <div className="inline-flex items-center gap-1 text-sm text-gray-600">
                                                            <ShoppingBasket className="h-4 w-4 text-gray-500" />
                                                            {e.contenedores ?? "-"}
                                                        </div>
                                                        <Trash2 className="h-4 w-4 text-red-500 opacity-50" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex min-h-0 h-full overflow-hidden border-l border-gray-300 pl-2 pt-1">
                    <MockRouteMap
                        key={`main-route-map-${mapResetToken}`}
                        stops={stops}
                        focusStopId={focusedShippingId}
                        directions={record.directions as any}
                        directionsRenderKey={directionsRenderKey}
                        snappedPath={record.snappedPath}
                        snappedMetrics={record.snappedMetrics}
                        onMetrics={handleMetrics}
                        showPolyline={canDragGroupedList}
                        renderCustomMarkersForDirections
                        height="100%"
                    />

                </div>
            </div>

            {hasSelectedDropoffs && (
                <div className="z-10 mt-2 shrink-0 flex items-center justify-between rounded-t-xl bg-white px-4 py-3 ring-1 ring-gray-200">
                    {flowStep === "selection" ? (
                        <>
                            <ActionButton
                                type="button"
                                variant="secondary"
                                onClick={handleRestoreSelection}
                                disabled={!hasAnySelected}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Restaurar
                            </ActionButton>

                            <ActionButton
                                type="button"
                                variant="primary"
                                onClick={handleNext}
                                disabled={buildingRoute || selectedShippingCount === 0}
                            >
                                {buildingRoute ? "Calculando..." : "Siguiente"}
                            </ActionButton>
                        </>
                    ) : (
                        <>
                            <ActionButton
                                type="button"
                                variant="secondary"
                                onClick={handleBackToSelection}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver
                            </ActionButton>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="font-semibold text-gray-600">Total estimado:</span>
                                <span className="inline-flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4" /> {formatEstimatedTime(record.metricas.tiempoMin)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded border text-[10px]">↔</span>
                                    {record.metricas.distanciaKm} km
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded border text-[10px]">📍</span>
                                    {record.metricas.paradas}
                                </span>
                            </div>

                            <ActionButton
                                type="button"
                                variant="primary"
                                onClick={onCreate}
                            >
                                Crear Ruta
                            </ActionButton>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
