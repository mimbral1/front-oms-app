// views\Delivery\Rutas\Nuevo\Nuevo.tsx
"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth, useFetchWithAuthDelivery } from "@/lib/http/client";
import { RutasNuevoFields, RutaNuevoRecord, RutaEntrega } from "@/features/delivery/components/rutas/listadorutas/RutasNuevoFields";
import RouteOptimizeModal from "@/features/delivery/components/rutas/listadorutas/RouteOptimizeModal";
import DriverVehicleModal from "@/features/delivery/components/rutas/listadorutas/DriverVehicleModal";

const BASE_URL = String(process.env.NEXT_PUBLIC_URL_BASE ?? "").replace(/\/$/, "");
const WAREHOUSE_PATH = "warehouse?sortBy=referenceId&sortDirection=asc";
const LOCATIONS_PATH = "comerce-service/locations";
const SHIPPINGS_READY_TO_ROUTE_PATH = "shippings-ready-to-route";
const ROUTE_CREATE_PATH = "route";
const ROUTE_INTEGRATION_ID = String(process.env.NEXT_PUBLIC_ROUTE_INTEGRATION_ID ?? "").trim();
const GOOGLE_MAPS_API_KEY = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();

/* ---------- Mocks de entregas ---------- */
const initialEntregas: RutaEntrega[] = [];

const normalizeText = (value: unknown) =>
    String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const extractRows = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const fetchReadyToRouteShippings = async (
    fetchWithAuthDelivery: <T = any>(url: string, options?: RequestInit) => Promise<T>,
    filters?: { agendaDesde?: string; agendaHasta?: string }
): Promise<any[]> => {
    const allRows: any[] = [];
    const seen = new Set<string>();
    let page = 1;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
        const query = new URLSearchParams({ page: String(page), limit: String(limit) });
        const agendaDesde = String(filters?.agendaDesde ?? "").trim();
        const agendaHasta = String(filters?.agendaHasta ?? "").trim();
        if (agendaDesde) query.set("scheduleStart", agendaDesde);
        if (agendaHasta) query.set("scheduleEnd", agendaHasta);
        const payload = await fetchWithAuthDelivery<any>(`${SHIPPINGS_READY_TO_ROUTE_PATH}?${query.toString()}`, {
            method: "GET",
        });
        const rows = extractRows(payload);

        for (const row of rows) {
            const key = String(row?.id ?? row?.refId ?? "").trim();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            allRows.push(row);
        }

        const totalPages = Number(payload?.pagination?.pages ?? 0);
        if (Number.isFinite(totalPages) && totalPages > 0) {
            hasMore = page < totalPages;
        } else {
            hasMore = rows.length === limit;
        }
        page += 1;
    }

    return allRows;
};

const toFiniteNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
};

const toMillis = (value: unknown): number | null => {
    const text = String(value ?? "").trim();
    if (!text) return null;
    const dt = new Date(text);
    const ms = dt.getTime();
    return Number.isNaN(ms) ? null : ms;
};

const toIsoStringOrEmpty = (value: unknown): string => {
    const text = String(value ?? "").trim();
    if (!text) return "";
    const dt = new Date(text);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
};

const toIsoPlusHours = (iso: string, hours: number): string => {
    const baseMs = toMillis(iso);
    if (baseMs === null) return iso;
    return new Date(baseMs + hours * 60 * 60 * 1000).toISOString();
};

const createRouteDisplayId = () => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePart = `${year}${month}${day}`;

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    for (let i = 0; i < 6; i += 1) {
        suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    return `RTE-${datePart}-${suffix}`;
};

const shippingMatchesAgendaFilter = (shipping: any, agendaDesde?: string, agendaHasta?: string) => {
    const fromMs = toMillis(agendaDesde);
    const toMs = toMillis(agendaHasta);
    if (fromMs === null && toMs === null) return true;

    const startMs = toMillis(shipping?.scheduleStart);
    const endMs = toMillis(shipping?.scheduleEnd);
    if (startMs === null && endMs === null) return false;

    const itemStart = startMs ?? endMs!;
    const itemEnd = endMs ?? startMs!;

    if (fromMs !== null && itemEnd < fromMs) return false;
    if (toMs !== null && itemStart > toMs) return false;
    return true;
};

type ApiLocationItem = {
    id?: string | number | null;
    name?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
};

type Coordinates = { lat: number; lng: number };

const buildLocationCoordsMap = (rows: ApiLocationItem[]): Map<string, Coordinates> => {
    const map = new Map<string, Coordinates>();

    for (const row of rows) {
        const lat = toFiniteNumber(row?.latitude);
        const lng = toFiniteNumber(row?.longitude);
        if (lat === undefined || lng === undefined) continue;

        const id = String(row?.id ?? "").trim();
        const name = String(row?.name ?? "").trim();

        if (id) map.set(normalizeText(id), { lat, lng });
        if (name) map.set(normalizeText(name), { lat, lng });
    }

    return map;
};

const resolveWarehouseCoordinates = (warehouse: any, locationCoordsMap: Map<string, Coordinates>) => {
    const warehouseLat = toFiniteNumber(warehouse?.coordinates?.latitude);
    const warehouseLng = toFiniteNumber(warehouse?.coordinates?.longitude);
    if (warehouseLat !== undefined && warehouseLng !== undefined) {
        return { lat: warehouseLat, lng: warehouseLng };
    }

    const locationLat = toFiniteNumber(warehouse?.location?.latitude);
    const locationLng = toFiniteNumber(warehouse?.location?.longitude);
    if (locationLat !== undefined && locationLng !== undefined) {
        return { lat: locationLat, lng: locationLng };
    }

    const candidates = [
        warehouse?.locationId,
        warehouse?.location?.id,
        warehouse?.location,
        warehouse?.locationName,
        warehouse?.location?.name,
    ]
        .map((value) => normalizeText(value))
        .filter(Boolean);

    for (const key of candidates) {
        const found = locationCoordsMap.get(key);
        if (found) return found;
    }

    return {} as { lat?: number; lng?: number };
};

const buildDropoffAddress = (shipping: any): string => {
    const street = String(shipping?.dropoffStreet ?? "").trim();
    const number = String(shipping?.dropoffNumber ?? "").trim();
    const city = String(shipping?.dropoffCity ?? "").trim();
    const state = String(shipping?.dropoffState ?? "").trim();
    const country = String(shipping?.dropoffCountry ?? "Chile").trim();

    const streetLine = [street, number].filter(Boolean).join(" ").trim();
    const parts = [streetLine, city, state, country].filter(Boolean);
    return parts.join(", ");
};

const geocodeShippingDropoff = async (shipping: any): Promise<{ lat?: number; lng?: number }> => {
    const dropoffLat = toFiniteNumber(shipping?.dropoffLat);
    const dropoffLng = toFiniteNumber(shipping?.dropoffLng);
    if (dropoffLat !== undefined && dropoffLng !== undefined) {
        return { lat: dropoffLat, lng: dropoffLng };
    }

    // Fallback: geocode with dropoffStreet + dropoffNumber + dropoffCity + dropoffState
    const address = buildDropoffAddress(shipping);
    if (!address || !GOOGLE_MAPS_API_KEY) return {};

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:CL&region=cl&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) return {};

        const data = await response.json();
        const result = Array.isArray(data?.results) ? data.results[0] : null;
        const lat = toFiniteNumber(result?.geometry?.location?.lat);
        const lng = toFiniteNumber(result?.geometry?.location?.lng);
        if (lat === undefined || lng === undefined) return {};

        return { lat, lng };
    } catch {
        return {};
    }
};

const toWarehousePickup = (warehouse: any, locationCoordsMap: Map<string, Coordinates>): RutaEntrega | null => {
    const warehouseId = String(warehouse?.id ?? warehouse?.warehouseId ?? "").trim();
    const referenceId = String(warehouse?.referenceId ?? warehouse?.code ?? "").trim();
    const name = String(warehouse?.name ?? "").trim();
    const key = warehouseId || referenceId || name;
    const nameHasReference =
        Boolean(referenceId && name) &&
        normalizeText(name).includes(normalizeText(referenceId));
    const title = nameHasReference
        ? name
        : referenceId && name
            ? `${referenceId} ${name}`
            : name || referenceId || warehouseId;
    if (!key || !title) return null;

    const coords = resolveWarehouseCoordinates(warehouse, locationCoordsMap);

    return {
        id: `WH:${key}`,
        tipo: "Pickup",
        inventario: title,
        seleccionado: false,
        warehouseKey: key,
        warehouseId: warehouseId || undefined,
        lat: coords.lat,
        lng: coords.lng,
    };
};

const shippingBelongsToWarehouse = (shipping: any, pickup: RutaEntrega) => {
    const pickupCandidates = [
        pickup.warehouseId,
        pickup.warehouseKey,
        pickup.inventario,
    ]
        .map(normalizeText)
        .filter(Boolean);

    const shippingCandidates = [
        shipping?.senderWarehouseId,
        shipping?.senderLocationId,
        shipping?.warehouseId,
        shipping?.warehouse?.id,
        shipping?.warehouseReferenceId,
        shipping?.warehouseCode,
        shipping?.warehouseName,
        shipping?.warehouse?.name,
        shipping?.inventoryId,
        shipping?.inventoryName,
        shipping?.inventory?.id,
        shipping?.inventory?.name,
    ]
        .map(normalizeText)
        .filter(Boolean);

    if (!shippingCandidates.length) return true;
    return shippingCandidates.some((candidate) => pickupCandidates.includes(candidate));
};

const shippingRowToEntrega = (
    shipping: any,
    pickup: RutaEntrega,
    coords?: { lat?: number; lng?: number }
): RutaEntrega | null => {
    const shippingId = String(
        shipping?.id ??
        shipping?.shippingId ??
        shipping?.refId ??
        shipping?.referenceId ??
        shipping?.code ??
        ""
    ).trim();
    if (!shippingId) return null;

    const externalId = String(
        shipping?.displayId ??
        shipping?.externalId ??
        shipping?.shippingNumber ??
        shipping?.referenceId ??
        shipping?.code ??
        shippingId
    ).trim();

    const containersRaw = Number(
        shipping?.containers ??
        shipping?.containerQty ??
        shipping?.packageQty ??
        shipping?.packages ??
        shipping?.units ??
        0
    );

    const fromRaw =
        shipping?.scheduleStart ??
        shipping?.schedule?.start ??
        shipping?.schedule?.from ??
        shipping?.start ??
        shipping?.scheduleFrom ??
        shipping?.windowStart ??
        shipping?.windowFrom ??
        shipping?.etaFrom ??
        "";
    const toRaw =
        shipping?.scheduleEnd ??
        shipping?.schedule?.end ??
        shipping?.schedule?.to ??
        shipping?.end ??
        shipping?.scheduleTo ??
        shipping?.windowEnd ??
        shipping?.windowTo ??
        shipping?.etaTo ??
        "";
    const from = String(fromRaw ?? "").trim();
    const to = String(toRaw ?? "").trim();
    const fechaVentana = from || to ? `${from || "-"} - ${to || "-"}` : undefined;
    const scheduleStart = toIsoStringOrEmpty(fromRaw);
    const scheduleEnd = toIsoStringOrEmpty(toRaw);

    return {
        id: shippingId,
        externalId,
        tipo: "Entrega",
        inventario: pickup.inventario,
        seleccionado: false,
        contenedores: Number.isFinite(containersRaw) && containersRaw > 0 ? containersRaw : undefined,
        fechaVentana,
        scheduleStart,
        scheduleEnd,
        warehouseKey: pickup.warehouseKey,
        warehouseId: pickup.warehouseId,
        lat: coords?.lat,
        lng: coords?.lng,
    };
};

const initialRecord: RutaNuevoRecord = {
    agendaDesde: "",
    agendaHasta: "",
    inventarioId: "",
    transportistaId: "",
    routingStep: "selection",
    entregas: initialEntregas,
    metricas: { tiempoMin: 21, distanciaKm: 6, paradas: initialEntregas.filter((e) => e.seleccionado).length },
    destinoFinal: "",
};

export default function RutasNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();

    const [record, setRecord] = useState<RutaNuevoRecord>({ ...initialRecord });

    // Mantener un ref con el record actual para evitar meter "record" como dependencia de callbacks
    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    // ===== Modal Optimización =====
    const [optOpen, setOptOpen] = useState(false);

    const handleRequestOptimize = useCallback(() => {
        setOptOpen(true);
    }, []);
    // Reordenar entregas según la lista optimizada
    const applyOptimizedOrder = useCallback((result: {
        ordered: { id: string }[];
        directions?: any;
        snappedPath?: any;
        snappedMetrics?: any;
        metrics?: any;
    }) => {
        setRecord((r) => {
            const orderIndex = new Map(result.ordered.map((s, i) => [String(s.id), i]));
            const sorted = r.entregas.slice().sort((a, b) => {
                const ia = orderIndex.get(String(a.id)) ?? 9999;
                const ib = orderIndex.get(String(b.id)) ?? 9999;
                return ia - ib;
            });
            const pickups = sorted.filter((e) => e.tipo === "Pickup");
            const nonPickups = sorted.filter((e) => e.tipo !== "Pickup");
            const normalizedEntregas = [...pickups, ...nonPickups];
            const hasDirections = Boolean(result.directions);
            const next = {
                ...r,
                entregas: normalizedEntregas,
                directions: hasDirections ? result.directions : undefined,
                snappedPath: hasDirections ? undefined : result.snappedPath,
                snappedMetrics: hasDirections ? undefined : result.snappedMetrics,
                routeOptimized: true,
                optimizedRouteVersion: (Number((r as any).optimizedRouteVersion) || 0) + 1,
            };
            if (result.metrics) {
                next.metricas = {
                    ...next.metricas,
                    distanciaKm: result.metrics.distanciaKm ?? next.metricas.distanciaKm,
                    tiempoMin: result.metrics.tiempoMin ?? next.metricas.tiempoMin,
                    paradas: result.metrics.paradas ?? next.metricas.paradas,
                };
            }
            return next;
        });
        setOptOpen(false);
    }, []);
    // =============================

    // onChange ESTABLE (evita recrearse en cada render)
    const onChange = useCallback(
        <K extends keyof RutaNuevoRecord>(field: K, value: RutaNuevoRecord[K]) => {
            setRecord((r) => ({ ...r, [field]: value }));
        },
        []
    );

    // Guardado (mock) — usa recordRef para no depender de "record"
    const doPost = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = user;

        const selectedPickup = current.entregas.find((e) => e.seleccionado && e.tipo === "Pickup");
        const selectedShippings = current.entregas.filter((e) => e.seleccionado && e.tipo !== "Pickup");

        const parseWindowDate = (windowValue?: string, side: "from" | "to" = "from") => {
            const text = String(windowValue ?? "").trim();
            if (!text) return null;
            const parts = text.split(" - ");
            const candidate = side === "from" ? parts[0] : parts[1] ?? parts[0];
            const dt = new Date(String(candidate ?? "").trim());
            return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
        };

        const parseScheduleDate = (value?: string) => toIsoStringOrEmpty(value);

        const normalizeRange = (start?: string, end?: string) => {
            const startIso = toIsoStringOrEmpty(start);
            const endIso = toIsoStringOrEmpty(end);

            if (!startIso && !endIso) return { start: "", end: "" };
            if (startIso && !endIso) return { start: startIso, end: startIso };
            if (!startIso && endIso) return { start: endIso, end: endIso };

            const startMs = toMillis(startIso);
            const endMs = toMillis(endIso);
            if (startMs !== null && endMs !== null && endMs < startMs) {
                return { start: endIso, end: startIso };
            }

            return { start: startIso, end: endIso };
        };

        const ensureNonEmptyRange = (
            start: string | undefined,
            end: string | undefined,
            fallbackStart: string,
            fallbackEnd: string
        ) => {
            const normalized = normalizeRange(start, end);
            const safeStart = normalized.start || fallbackStart;
            const safeEnd = normalized.end || fallbackEnd || safeStart;
            return normalizeRange(safeStart, safeEnd);
        };

        const routeRefId = `ROUTE-${Date.now()}`;
        const routeDisplayId = createRouteDisplayId();

        const routeStartFromFilter = parseScheduleDate(current.agendaDesde);
        const routeEndFromFilter = parseScheduleDate(current.agendaHasta);
        const nowIso = new Date().toISOString();
        const nowPlusOneHourIso = toIsoPlusHours(nowIso, 1);

        const perShippingRanges = selectedShippings.map((e) => {
            const fromWindow = parseWindowDate(e.fechaVentana, "from") ?? "";
            const toWindow = parseWindowDate(e.fechaVentana, "to") ?? "";
            return normalizeRange(e.scheduleStart || fromWindow, e.scheduleEnd || toWindow);
        });

        const allStartMs = perShippingRanges.map((r) => toMillis(r.start)).filter((v): v is number => v !== null);
        const allEndMs = perShippingRanges.map((r) => toMillis(r.end)).filter((v): v is number => v !== null);

        const minStartMs = allStartMs.length ? Math.min(...allStartMs) : null;
        const maxEndMs = allEndMs.length ? Math.max(...allEndMs) : null;

        const defaultRouteStart = routeStartFromFilter || (minStartMs !== null ? new Date(minStartMs).toISOString() : "");
        const defaultRouteEnd = routeEndFromFilter || (maxEndMs !== null ? new Date(maxEndMs).toISOString() : "");

        const routeRangeNormalized = normalizeRange(defaultRouteStart, defaultRouteEnd);
        let routeStart = routeRangeNormalized.start;
        let routeEnd = routeRangeNormalized.end;

        const routeStartMs = toMillis(routeStart);
        const routeEndMs = toMillis(routeEnd);
        if (minStartMs !== null && (routeStartMs === null || routeStartMs > minStartMs)) {
            routeStart = new Date(minStartMs).toISOString();
        }
        if (maxEndMs !== null && (routeEndMs === null || routeEndMs < maxEndMs)) {
            routeEnd = new Date(maxEndMs).toISOString();
        }

        const routeCoveringRange = ensureNonEmptyRange(
            routeStart,
            routeEnd,
            defaultRouteStart || nowIso,
            defaultRouteEnd || nowPlusOneHourIso
        );

        const shippingsPayload = selectedShippings.map((e, i) => {
            const shippingRange = ensureNonEmptyRange(
                perShippingRanges[i]?.start || routeCoveringRange.start,
                perShippingRanges[i]?.end || routeCoveringRange.end,
                routeCoveringRange.start,
                routeCoveringRange.end
            );

            const shippingDisplayId = String(e.externalId ?? e.id).trim();

            return {
                id: e.id,
                displayId: shippingDisplayId,
                index: i + 1,
                start: shippingRange.start,
                end: shippingRange.end,
                lat: e.lat ?? null,
                lng: e.lng ?? null,
                coordinates: {
                    source: {
                        lat: selectedPickup?.lat ?? null,
                        lng: selectedPickup?.lng ?? null,
                    },
                    target: {
                        lat: e.lat ?? null,
                        lng: e.lng ?? null,
                    },
                },
                orders: [],
                warehouseId: e.warehouseId ?? selectedPickup?.warehouseId ?? null,
            };
        });

        const normalizedExpectedDistance = Number.isFinite(Number(current.metricas?.distanciaKm))
            ? Number(current.metricas?.distanciaKm)
            : 0;

        const originWarehouseId = String(
            selectedPickup?.warehouseId ??
            selectedPickup?.warehouseKey ??
            ""
        ).trim();

        const shippingCount = shippingsPayload.length;

        const vehicleId = String((current as any)?.driverData?.vehicleId ?? "").trim();
        const driverId = String((current as any)?.driverData?.driverId ?? "").trim();
        const deliveryManId = String((current as any)?.driverData?.helperId ?? "").trim();

        const payload: any = {
            refId: routeRefId,
            displayId: routeDisplayId,
            origin: "OMS",
            originWarehouseId,
            shippingQuantity: shippingCount,
            totalShippings: shippingCount,
            expectedDistance: normalizedExpectedDistance,
            shippings: shippingsPayload,
            schedule: {
                start: routeCoveringRange.start,
                end: routeCoveringRange.end,
            },
            userCreated: String(currentUser?.id ?? "").trim(),
        };

        if (vehicleId) payload.vehicleId = vehicleId;
        if (driverId) payload.driverId = driverId;
        if (deliveryManId) payload.deliveryManId = deliveryManId;

        if (ROUTE_INTEGRATION_ID) {
            payload.integrationId = ROUTE_INTEGRATION_ID;
            payload.integrationComplements = {};
        }

        const errs: string[] = [];
        if (!payload.shippings?.length) errs.push("Debes seleccionar al menos una entrega.");
        if (errs.length) {
            console.warn("Validación:", errs);
            return;
        }

        try {
            await fetchWithAuthDelivery(ROUTE_CREATE_PATH, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            console.log("POST Ruta OK:", payload);
            router.push("/delivery/rutas/listado-rutas");
        } catch (err) {
            console.error("Error creando ruta:", (err as any)?.payload ?? err);
        }
    }, [fetchWithAuthDelivery, router, user]); // <- sin "record"

    // Filtros del header (estáticos)
    const [invSearch, setInvSearch] = useState("");
    const [inventoryOptions, setInventoryOptions] = useState<Array<{ label: string; value: string }>>([]);

    const handlePickupPress = useCallback(async (pickup: RutaEntrega) => {
        setRecord((prev) => {
            const nextEntregas = prev.entregas.map((e) => {
                if (e.tipo !== "Pickup") return e;
                if (e.id !== pickup.id) return e;
                return {
                    ...e,
                    seleccionado: true,
                    loading: true,
                };
            });

            const paradas = nextEntregas.filter((e) => e.seleccionado).length;

            return {
                ...prev,
                entregas: nextEntregas,
                directions: undefined,
                snappedPath: undefined,
                snappedMetrics: undefined,
                routeOptimized: false,
                routingStep: "selection",
                metricas: { ...prev.metricas, paradas },
            };
        });

        try {
            const current = recordRef.current;
            const agendaDesde = String(current?.agendaDesde ?? "").trim();
            const agendaHasta = String(current?.agendaHasta ?? "").trim();

            const rows = await fetchReadyToRouteShippings(fetchWithAuthDelivery, { agendaDesde, agendaHasta });
            const filteredRows = rows.filter(
                (row) => shippingBelongsToWarehouse(row, pickup) && shippingMatchesAgendaFilter(row, agendaDesde, agendaHasta)
            );
            const shippingsWithCoords = await Promise.all(
                filteredRows.map(async (row) => {
                    const coords = await geocodeShippingDropoff(row);
                    return shippingRowToEntrega(row, pickup, coords);
                })
            );
            const shippings = shippingsWithCoords.filter(Boolean) as RutaEntrega[];

            setRecord((prev) => {
                const pickups = prev.entregas
                    .filter((e) => e.tipo === "Pickup")
                    .map((e) => {
                        if (e.id !== pickup.id) return e;
                        return {
                            ...e,
                            seleccionado: true,
                            loading: false,
                        };
                    });

                const existingShippings = prev.entregas.filter((e) => e.tipo !== "Pickup");
                const shippingsFromOtherWarehouses = existingShippings.filter((e) => !shippingBelongsToWarehouse(e, pickup));
                const shippingsFromThisWarehouse = existingShippings.filter((e) => shippingBelongsToWarehouse(e, pickup));

                const mergedCurrentWarehouseShippings = shippings.map((incoming) => {
                    const previous = shippingsFromThisWarehouse.find((existing) => String(existing.id) === String(incoming.id));
                    if (!previous) return incoming;
                    return {
                        ...incoming,
                        seleccionado: previous.seleccionado,
                    };
                });

                const nextEntregas = [...pickups, ...shippingsFromOtherWarehouses, ...mergedCurrentWarehouseShippings];
                const paradas = nextEntregas.filter((e) => e.seleccionado).length;

                return {
                    ...prev,
                    entregas: nextEntregas,
                    directions: undefined,
                    snappedPath: undefined,
                    snappedMetrics: undefined,
                    routeOptimized: false,
                    routingStep: "selection",
                    metricas: { ...prev.metricas, paradas },
                };
            });
        } catch (error) {
            console.error("Error cargando shippings por warehouse:", error);
            setRecord((prev) => ({
                ...prev,
                entregas: prev.entregas.map((e) => ({
                    ...e,
                    loading: e.id === pickup.id ? false : e.loading,
                    seleccionado: e.id === pickup.id ? true : e.seleccionado,
                })),
            }));
        }
    }, [fetchWithAuthDelivery]);

    useEffect(() => {
        let mounted = true;

        const loadInventories = async () => {
            try {
                const [warehouseResponse, locationsResponse] = await Promise.all([
                    fetchWithAuth(WAREHOUSE_PATH, { method: "GET" }),
                    fetchWithAuth(LOCATIONS_PATH, { method: "GET" }),
                ]);
                const warehousePayload = warehouseResponse;
                const locationsPayload = locationsResponse;
                const rows = extractRows(warehousePayload);
                const locationRows = extractRows(locationsPayload) as ApiLocationItem[];
                const locationCoordsMap = buildLocationCoordsMap(locationRows);

                const optionsMap = new Map<string, { label: string; value: string }>();

                for (const w of rows as any[]) {
                    const id = String(w?.id ?? w?.warehouseId ?? "").trim();
                    const referenceId = String(w?.referenceId ?? w?.code ?? "").trim();
                    const name = String(w?.name ?? "").trim();
                    const value = id || referenceId;
                    if (!value) continue;

                    const nameHasReference =
                        Boolean(referenceId && name) &&
                        normalizeText(name).includes(normalizeText(referenceId));

                    const label = nameHasReference
                        ? name
                        : referenceId && name
                            ? `${referenceId} ${name}`
                            : referenceId || name || value;

                    optionsMap.set(value, { label, value });
                }

                const options = Array.from(optionsMap.values());
                const pickups = rows
                    .map((w: any) => toWarehousePickup(w, locationCoordsMap))
                    .filter(Boolean) as RutaEntrega[];

                if (!mounted) return;
                setInventoryOptions(options);
                setRecord((prev) => ({
                    ...prev,
                    entregas: pickups,
                    metricas: { ...prev.metricas, paradas: 0 },
                    directions: undefined,
                    snappedPath: undefined,
                    snappedMetrics: undefined,
                    routeOptimized: false,
                    routingStep: "selection",
                }));
            } catch (error) {
                if (!mounted) return;
                console.error("Error cargando inventarios:", error);
                setInventoryOptions([]);
                setRecord((prev) => ({ ...prev, entregas: [] }));
            }
        };

        loadInventories();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    const invVisible = useMemo(() => {
        const q = invSearch.trim().toLowerCase();
        if (!q) return inventoryOptions;

        return inventoryOptions.filter((option) =>
            `${option.label} ${option.value}`.toLowerCase().includes(q)
        );
    }, [inventoryOptions, invSearch]);

    const handleHeaderFilterChange = useCallback(
        (id: string, value: string) => {
            onChange(id as keyof RutaNuevoRecord, value as any);

            if (id === "inventarioId") {
                const pickup = record.entregas.find(
                    (e) =>
                        e.tipo === "Pickup" &&
                        (String(e.warehouseId || "") === String(value || "") || String(e.warehouseKey || "") === String(value || ""))
                );
                if (pickup) void handlePickupPress(pickup);
            }

            if (id === "agendaDesde" || id === "agendaHasta") {
                const selectedPickups = record.entregas.filter((e) => e.tipo === "Pickup" && e.seleccionado);
                selectedPickups.forEach((selectedPickup) => {
                    void handlePickupPress(selectedPickup);
                });
            }
        },
        [handlePickupPress, onChange, record.entregas]
    );

    // modal conductor 
    const [driverOpen, setDriverOpen] = useState(false);
    const handleOpenDriver = useCallback(() => setDriverOpen(true), []);
    const handleApplyDriver = useCallback((data: any) => {
        setRecord((r) => ({ ...r, driverData: data }));
        setDriverOpen(false);
    }, []);

    const selectedShippingCount = useMemo(
        () => record.entregas.filter((e) => e.seleccionado && e.tipo !== "Pickup").length,
        [record.entregas]
    );

    const optimizationStops = useMemo(
        () =>
            record.entregas
                .filter((e) => e.seleccionado)
                .map((e) => ({
                    id: String(e.id),
                    title: e.externalId || e.id,
                    tipo: e.tipo as any,
                    inventario: e.inventario,
                    lat: e.lat,
                    lng: e.lng,
                })),
        [record.entregas]
    );

    const isRoutingStep = record.routingStep === "routing";

    const headerActions = useMemo<Action[]>(() => {
        const baseActions: Action[] = [
            {
                label: "Volver a la lista",
                variant: "secondary",
                onClick: () => router.push("/delivery/rutas/listado-rutas"),
            },
        ];

        if (!isRoutingStep) return baseActions;

        return [
            ...baseActions,
            {
                label: "Optimizar",
                variant: "primary",
                onClick: handleRequestOptimize,
                disabled: selectedShippingCount < 2,
            },
            {
                label: "Datos del Transportista",
                variant: "secondary",
                onClick: handleOpenDriver,
            },
        ];
    }, [handleOpenDriver, handleRequestOptimize, isRoutingStep, router, selectedShippingCount]);

    usePageHeader(
        () =>
        ({
            title: "Ruta",
            action: headerActions.length ? headerActions : undefined,
            filters: [
                { id: "agendaDesde", label: "Agendamiento (desde)", type: "datetime" as const, value: record.agendaDesde },
                { id: "agendaHasta", label: "Agendamiento (hasta)", type: "datetime" as const, value: record.agendaHasta },
                {
                    id: "inventarioId",
                    label: "Inventario",
                    type: "select-search" as const,
                    value: record.inventarioId ?? "",
                    options: invVisible,
                    onSearch: setInvSearch,
                    searchQuery: invSearch,
                },
            ],
            filterTitle: false,
            onFilterChange: handleHeaderFilterChange,
        } as PageHeaderProps),
        [record.agendaDesde, record.agendaHasta, record.inventarioId, invVisible, invSearch, handleHeaderFilterChange, headerActions]
    );

    return (
        <div className="h-full overflow-hidden">
            <RutasNuevoFields
                record={record}
                onChange={onChange}
                onCreate={doPost}
                onOptimize={handleRequestOptimize} // abre modal
                onOpenDriverModal={handleOpenDriver}
                onPickupPress={handlePickupPress}
            />

            {/* Modal Optimización */}
            <RouteOptimizeModal
                open={optOpen}
                onClose={() => setOptOpen(false)}
                destinationStopId={record.destinoFinal}
                stops={optimizationStops}
                onApplyOrder={applyOptimizedOrder}
            />
            {/* Modal conductor */}
            <DriverVehicleModal
                open={driverOpen}
                onClose={() => setDriverOpen(false)}
                initial={record.driverData}
                onApply={handleApplyDriver}
            />

        </div>
    );
}
