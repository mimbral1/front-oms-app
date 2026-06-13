"use client";

import React, { useMemo, useRef, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { CalendarClock } from "lucide-react";
import { ActionButton } from "@/components/ui/button/action-button";
import TimePickerField from "@/components/ui/time-picker/TimePickerField";
import { GoogleMap, Polyline, useLoadScript } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";
import Select from "@/components/ui/select";
import { Toggle } from "@/components/ui/togle";

const mapContainerStyle = { width: "100%", height: "320px" };
const mapDefaultCenter = { lat: -33.4489, lng: -70.6693 };
const MAP_LOADER_ID = "delivery-restrictions-map-loader";
const MAP_LIBRARIES: Libraries = ["places", "geometry"];
const DEFAULT_POSTAL_RADIUS_M = 3000;
const MIN_POSTAL_RADIUS_M = 1000;
const MAX_POSTAL_RADIUS_M = 9000;
const FIXED_COUNTRY = "Chile";

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const sa = Math.sin(dLat / 2) ** 2;
    const sb = Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(sa + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sb), Math.sqrt(1 - (sa + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * sb)));
    return earthRadius * c;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/** Modelo (todo editable) */
export interface DeliveryRestriction {
    id?: string | number;
    // Detalle
    availability: "available" | "notAvailable";
    status: "Activo" | "Inactivo";
    // Intervalos
    timezone: string;
    days: string[];
    windows: Array<{
        day: string;
        from: string;
        to: string;
        maxShippingQty?: number | null;
        maxItems?: number | null;
        maxPackages?: number | null;
    }>;
    // Ubicación
    address: string;
    locationCity?: string;
    locationState?: string;
    locationCountry?: string;
    locationLat?: number | null;
    locationLng?: number | null;
    postalCode?: string;
    numerationStart?: number | null;
    numerationEnd?: number | null;
}

export function RestriccionesEntregaFields({
    record,
    readOnly = false,
    onChange,
    isCreate = false,
}: {
    record: DeliveryRestriction;
    readOnly?: boolean;
    onChange?: (field: keyof DeliveryRestriction, value: any) => void;
    isCreate?: boolean;
}): React.JSX.Element {
    const handle =
        (field: keyof DeliveryRestriction) =>
            (v: any) =>
                onChange?.(field, v);

    // Mocks compañías para SelectSearchInline
    const companies = useMemo(
        () => [
            { label: "Mimbral S.A.", value: "1" },
            { label: "Acme Retail", value: "2" },
            { label: "Distribuciones Romero", value: "3" },
            { label: "LogiMex", value: "4" },
            { label: "Q-Express", value: "5" },
        ],
        []
    );
    const [companySearch, setCompanySearch] = useState("");
    const companyOptions = useMemo(() => {
        const q = companySearch.toLowerCase();
        const base = [{ label: "Seleccione compañía…", value: "" }, ...companies];
        return q ? base.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q)) : base;
    }, [companies, companySearch]);

    // Ventanas de tiempo
    const syncWindows = (next: Array<{ day: string; from: string; to: string; maxShippingQty?: number | null; maxItems?: number | null; maxPackages?: number | null }>) => {
        handle("windows")(next);
        const uniqueDays = Array.from(new Set(next.map((w) => String(w.day || "").trim()).filter(Boolean)));
        handle("days")(uniqueDays);
    };

    const updateWindow = (
        idx: number,
        key: "day" | "from" | "to" | "maxShippingQty" | "maxItems" | "maxPackages",
        val: string | number | null
    ) => {
        const next = [...record.windows];
        next[idx] = { ...next[idx], [key]: val };
        syncWindows(next);
    };
    const removeWindow = (idx: number) => syncWindows(record.windows.filter((_, i) => i !== idx));
    const addWindow = () => {
        const defaultDay = record.days[0] || "Lunes";
        syncWindows([...(record.windows || []), { day: defaultDay, from: "08:00", to: "19:00", maxShippingQty: 50, maxItems: 0, maxPackages: 0 }]);
    };

    const DAYS_OPTIONS = [
        "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
    ];

    const AVAILABILITY_OPTIONS = [
        { label: "Disponible", value: "available" },
        { label: "No disponible", value: "notAvailable" },
    ];

    const TZ_OPTIONS = [
        { label: "America/Santiago", value: "America/Santiago" },
        { label: "America/Mexico_City", value: "America/Mexico_City" },
        { label: "America/Bogota", value: "America/Bogota" },
        { label: "America/Lima", value: "America/Lima" },
        { label: "America/Buenos_Aires", value: "America/Buenos_Aires" },
    ];

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded: isMapLoaded, loadError: mapLoadError } = useLoadScript({
        id: MAP_LOADER_ID,
        googleMapsApiKey,
        libraries: MAP_LIBRARIES,
    });

    const isBillingError = String((mapLoadError as any)?.message ?? "").toLowerCase().includes("billing");

    const [mapCenter, setMapCenter] = useState(mapDefaultCenter);
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBoundsLiteral | null>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [shouldAutoFitBounds, setShouldAutoFitBounds] = useState(false);
    const [numerationPath, setNumerationPath] = useState<Array<{ lat: number; lng: number }>>([]);
    const [debouncedNumerationStart, setDebouncedNumerationStart] = useState<number | null>(record.numerationStart ?? null);
    const [debouncedNumerationEnd, setDebouncedNumerationEnd] = useState<number | null>(record.numerationEnd ?? null);
    const [postalEstimatedRadiusM, setPostalEstimatedRadiusM] = useState<number>(DEFAULT_POSTAL_RADIUS_M);
    const [postalZoneAvailable, setPostalZoneAvailable] = useState(true);
    const [geocodeDeniedMessage, setGeocodeDeniedMessage] = useState<string | null>(null);
    const numerationStartRaw = String(record.numerationStart ?? "").trim();
    const numerationEndRaw = String(record.numerationEnd ?? "").trim();
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedNumerationStart(record.numerationStart ?? null);
            setDebouncedNumerationEnd(record.numerationEnd ?? null);
        }, 500);

        return () => clearTimeout(timer);
    }, [record.numerationStart, record.numerationEnd]);

    const numerationStartValue = Number(debouncedNumerationStart);
    const numerationEndValue = Number(debouncedNumerationEnd);
    const hasAnyNumerationInput = numerationStartRaw !== "" || numerationEndRaw !== "";
    const hasNumerationRange =
        Number.isFinite(numerationStartValue) &&
        Number.isFinite(numerationEndValue) &&
        numerationStartValue > 0 &&
        numerationEndValue > 0;
    const showPostalRange = !hasAnyNumerationInput && Boolean(String(record.postalCode ?? "").trim());

    const postalCodeClean = useMemo(
        () => String(record.postalCode ?? "").trim().replace(/\s+/g, ""),
        [record.postalCode]
    );

    const geocodeAutofillSeqRef = useRef(0);
    const mapDemarcationSeqRef = useRef(0);
    const geocodeResponseCacheRef = useRef<Map<string, any>>(new Map());
    const userMovedMapRef = useRef(false);

    const mapQuery = useMemo(() => {
        const baseAddress = String(record.address ?? "").trim();
        const postalCode = postalCodeClean;
        const city = String(record.locationCity ?? "").trim();
        const state = String(record.locationState ?? "").trim();
        const country = FIXED_COUNTRY;
        const locationHint = [city, state, country].filter(Boolean).join(", ");

        if (hasNumerationRange) {
            const start = String(debouncedNumerationStart ?? "").trim();
            if (baseAddress && start) return `${start} ${baseAddress}`;
            if (baseAddress) return baseAddress;
            return [postalCode].filter(Boolean).join(" ");
        }

        // Sin numeración: priorizar zona postal y evitar sesgo por calle/avenida
        if (postalCode && locationHint) return `${postalCode}, ${locationHint}`;
        if (postalCode) return `${postalCode}, Chile`;
        if (postalCode) return postalCode;
        return baseAddress;
    }, [
        record.address,
        record.locationCity,
        record.locationState,
        record.locationCountry,
        postalCodeClean,
        debouncedNumerationStart,
        hasNumerationRange,
    ]);

    React.useEffect(() => {
        if (readOnly || !onChange) return;
        if (record.locationCountry === FIXED_COUNTRY) return;
        onChange("locationCountry", FIXED_COUNTRY);
    }, [readOnly, onChange, record.locationCountry]);

    React.useEffect(() => {
        if (readOnly || !onChange || !googleMapsApiKey) return;

        const address = String(record.address ?? "").trim();
        if (!address) return;

        const seq = ++geocodeAutofillSeqRef.current;
        const timer = setTimeout(async () => {
            try {
                const query = [address, FIXED_COUNTRY].filter(Boolean).join(", ");
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:CL&region=cl&key=${googleMapsApiKey}`;
                const cachedData = geocodeResponseCacheRef.current.get(url);
                const data = cachedData ?? await (async () => {
                    const response = await fetch(url);
                    const json = await response.json();
                    geocodeResponseCacheRef.current.set(url, json);
                    return json;
                })();

                if (seq !== geocodeAutofillSeqRef.current) return;
                if (String(data?.status ?? "") === "REQUEST_DENIED") return;

                const result = Array.isArray(data?.results) ? data.results[0] : null;
                if (!result) return;

                const geometry = result?.geometry;
                const loc = geometry?.location;
                const lat = Number(loc?.lat);
                const lng = Number(loc?.lng);

                const postalComponent = Array.isArray(result?.address_components)
                    ? result.address_components.find(
                        (c: any) =>
                            Array.isArray(c?.types) &&
                            (c.types.includes("postal_code") || c.types.includes("postal_code_prefix"))
                    )
                    : null;

                const cityComponent = Array.isArray(result?.address_components)
                    ? result.address_components.find(
                        (c: any) =>
                            Array.isArray(c?.types) &&
                            (c.types.includes("locality") || c.types.includes("administrative_area_level_2"))
                    )
                    : null;

                const stateComponent = Array.isArray(result?.address_components)
                    ? result.address_components.find(
                        (c: any) =>
                            Array.isArray(c?.types) && c.types.includes("administrative_area_level_1")
                    )
                    : null;

                const postalRaw = String(postalComponent?.long_name ?? postalComponent?.short_name ?? "").trim();
                let postalClean = postalRaw.replace(/\s+/g, "");
                const cityText = String(cityComponent?.long_name ?? cityComponent?.short_name ?? "").trim();
                const stateText = String(stateComponent?.long_name ?? stateComponent?.short_name ?? "").trim();

                if (!postalClean) {
                    const formatted = String(result?.formatted_address ?? "");
                    const fromFormatted = formatted.match(/\b\d{7}\b/);
                    if (fromFormatted?.[0]) {
                        postalClean = fromFormatted[0];
                    }
                }

                if (!postalClean && Number.isFinite(lat) && Number.isFinite(lng)) {
                    const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(`${lat},${lng}`)}&result_type=postal_code&key=${googleMapsApiKey}`;
                    const reverseResponse = await fetch(reverseUrl);
                    const reverseData = await reverseResponse.json();
                    const reverseResult = Array.isArray(reverseData?.results) ? reverseData.results[0] : null;
                    const reversePostalComponent = Array.isArray(reverseResult?.address_components)
                        ? reverseResult.address_components.find((c: any) => Array.isArray(c?.types) && c.types.includes("postal_code"))
                        : null;
                    const reversePostal = String(reversePostalComponent?.long_name ?? reversePostalComponent?.short_name ?? "").trim();
                    postalClean = reversePostal.replace(/\s+/g, "");
                }

                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    if (!userMovedMapRef.current) {
                        setMapCenter({ lat, lng });
                    }

                    const currentLat = Number(record.locationLat);
                    const currentLng = Number(record.locationLng);
                    const latChanged = !Number.isFinite(currentLat) || Math.abs(currentLat - lat) > 0.000001;
                    const lngChanged = !Number.isFinite(currentLng) || Math.abs(currentLng - lng) > 0.000001;
                    if (latChanged) onChange("locationLat", lat);
                    if (lngChanged) onChange("locationLng", lng);
                }

                if (postalClean && postalClean !== String(record.postalCode ?? "").trim()) {
                    onChange("postalCode", postalClean);
                }
                if (cityText && cityText !== String(record.locationCity ?? "").trim()) {
                    onChange("locationCity", cityText);
                }
                if (stateText && stateText !== String(record.locationState ?? "").trim()) {
                    onChange("locationState", stateText);
                }
            } catch {
                // No bloquea la edición si falla el autocompletado.
            }
        }, 450);

        return () => {
            clearTimeout(timer);
        };
    }, [
        readOnly,
        onChange,
        googleMapsApiKey,
        record.address,
    ]);

    React.useEffect(() => {
        // Evita que persista la demarcación anterior mientras se resuelve el nuevo geocoding.
        userMovedMapRef.current = false;
        setNumerationPath([]);
        setMapBounds(null);
        setShouldAutoFitBounds(false);
        if (hasAnyNumerationInput) {
            // En modo numeración nunca debe mostrarse área postal.
            setPostalZoneAvailable(false);
        }
    }, [
        hasAnyNumerationInput,
        record.address,
        record.numerationStart,
        record.numerationEnd,
        record.postalCode,
        record.locationCity,
        record.locationState,
    ]);

    React.useEffect(() => {
        let mounted = true;
        const seq = ++mapDemarcationSeqRef.current;
        const isCurrentRun = () => mounted && seq === mapDemarcationSeqRef.current;

        const run = async () => {
            if (!mapQuery || !googleMapsApiKey) return;
            try {
                let requestDenied = false;
                const country = FIXED_COUNTRY;
                const countryCode = "CL";
                const city = String(record.locationCity ?? "").trim();
                const state = String(record.locationState ?? "").trim();
                const normalizePostal = (value: unknown) => String(value ?? "").replace(/\D+/g, "");
                const normalizeText = (value: unknown) =>
                    String(value ?? "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .trim()
                        .toLowerCase();

                const expectedPostal = normalizePostal(postalCodeClean);
                const expectedCity = normalizeText(city);
                const expectedState = normalizeText(state);

                const componentMatchesPostal = (component: any) => {
                    const value = normalizePostal(component?.long_name ?? component?.short_name ?? "");
                    if (!value || !expectedPostal) return false;
                    return value === expectedPostal || value.startsWith(expectedPostal) || expectedPostal.startsWith(value);
                };

                const hasLocationHintMatch = (result: any) => {
                    if (!Array.isArray(result?.address_components)) return false;

                    const locality = result.address_components.find((c: any) => Array.isArray(c?.types) && c.types.includes("locality"));
                    const admin = result.address_components.find((c: any) => Array.isArray(c?.types) && c.types.includes("administrative_area_level_1"));

                    const localityText = normalizeText(locality?.long_name ?? locality?.short_name ?? "");
                    const adminText = normalizeText(admin?.long_name ?? admin?.short_name ?? "");

                    const cityOk = expectedCity ? localityText.includes(expectedCity) || expectedCity.includes(localityText) : true;
                    const stateOk = expectedState ? adminText.includes(expectedState) || expectedState.includes(adminText) : true;

                    return cityOk && stateOk;
                };

                const mapOrNull = (results: any[], requireExactPostal: boolean) => {
                    if (!Array.isArray(results) || results.length === 0) return null;

                    const resultWithExactPostal =
                        expectedPostal &&
                        results.find((r: any) =>
                            Array.isArray(r?.address_components) &&
                            r.address_components.some(
                                (component: any) =>
                                    Array.isArray(component?.types) &&
                                    (component.types.includes("postal_code") || component.types.includes("postal_code_prefix")) &&
                                    componentMatchesPostal(component)
                            )
                        );

                    const resultByLocationHint =
                        (expectedCity || expectedState) &&
                        results.find((r: any) => hasLocationHintMatch(r));

                    if (requireExactPostal && expectedPostal) {
                        return resultWithExactPostal ?? resultByLocationHint ?? null;
                    }

                    return (
                        resultWithExactPostal ??
                        resultByLocationHint ??
                        results.find((r: any) => Array.isArray(r?.types) && r.types.includes("postal_code")) ??
                        results[0]
                    );
                };

                const fetchCandidate = async (url: string, requireExactPostal: boolean) => {
                    const cachedData = geocodeResponseCacheRef.current.get(url);
                    const data = cachedData ?? await (async () => {
                        const response = await fetch(url);
                        const json = await response.json();
                        geocodeResponseCacheRef.current.set(url, json);
                        return json;
                    })();

                    if (String(data?.status ?? "") === "REQUEST_DENIED") {
                        requestDenied = true;
                        setGeocodeDeniedMessage(
                            String(data?.error_message ?? "Google Geocoding rechazó la solicitud (REQUEST_DENIED).")
                        );
                        return null;
                    }

                    const results = Array.isArray(data?.results) ? data.results : [];
                    return mapOrNull(results, requireExactPostal);
                };

                const buildAddressUrl = () =>
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                        mapQuery
                    )}&components=country:${countryCode}&region=cl&key=${googleMapsApiKey}`;

                const buildPostalUrl = () => {
                    const parts = [`postal_code:${encodeURIComponent(postalCodeClean)}`];
                    if (city) parts.push(`locality:${encodeURIComponent(city)}`);
                    if (state) parts.push(`administrative_area:${encodeURIComponent(state)}`);
                    parts.push(`country:${encodeURIComponent(countryCode)}`);
                    return `https://maps.googleapis.com/maps/api/geocode/json?components=${parts.join("|")}&region=cl&key=${googleMapsApiKey}`;
                };

                const buildPostalTextUrl = (text: string) =>
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&region=cl&key=${googleMapsApiKey}`;

                const buildNumberedAddressUrl = (numberValue: number) => {
                    const fullAddress = String(record.address ?? "").trim();
                    const segments = fullAddress.split(",").map((s) => s.trim()).filter(Boolean);
                    const primarySegment = segments[0] ?? "";
                    const inferredCity = city || segments[1] || "";
                    const inferredState = state || segments[2] || "";
                    // Preserva números que son parte del nombre de calle (ej: "Calle 1 Norte")
                    // y elimina solo la numeración de domicilio al final del segmento principal.
                    const streetNameOnly = primarySegment
                        .replace(/\s+\d+[a-zA-Z-]*\s*$/, "")
                        .replace(/\s+/g, " ")
                        .trim();

                    const baseStreet = streetNameOnly || primarySegment || fullAddress;
                    const locationParts = [inferredCity, inferredState, country || FIXED_COUNTRY].filter(Boolean).join(", ");
                    const query = [`${baseStreet} ${numberValue}`, locationParts].filter(Boolean).join(", ");
                    return `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:${countryCode}&region=cl&key=${googleMapsApiKey}`;
                };

                const extractRouteText = (result: any) => {
                    const routeComponent = Array.isArray(result?.address_components)
                        ? result.address_components.find((c: any) => Array.isArray(c?.types) && c.types.includes("route"))
                        : null;
                    return normalizeText(routeComponent?.long_name ?? routeComponent?.short_name ?? "");
                };

                const fetchNumberedPointOnStreet = async (numberValue: number) => {
                    const url = buildNumberedAddressUrl(numberValue);
                    const cachedData = geocodeResponseCacheRef.current.get(url);
                    const data = cachedData ?? await (async () => {
                        const response = await fetch(url);
                        const json = await response.json();
                        geocodeResponseCacheRef.current.set(url, json);
                        return json;
                    })();

                    if (String(data?.status ?? "") === "REQUEST_DENIED") {
                        requestDenied = true;
                        setGeocodeDeniedMessage(
                            String(data?.error_message ?? "Google Geocoding rechazó la solicitud (REQUEST_DENIED).")
                        );
                        return null;
                    }

                    const results = Array.isArray(data?.results) ? data.results : [];
                    if (!results.length) return null;

                    const fullAddress = String(record.address ?? "").trim();
                    const primarySegment = fullAddress.split(",")[0]?.trim() ?? "";
                    const expectedStreet = normalizeText(
                        primarySegment
                            .replace(/\s+\d+[a-zA-Z-]*\s*$/, "")
                            .replace(/\s+/g, " ")
                            .trim()
                    );
                    if (!expectedStreet) return null;

                    const byRoute = results.find((result: any) => {
                        const routeText = extractRouteText(result);
                        if (!routeText) return false;
                        return routeText.includes(expectedStreet) || expectedStreet.includes(routeText);
                    });

                    if (byRoute) return byRoute;

                    const expectedTokens = expectedStreet.split(" ").filter((t) => t.length > 2);
                    const byTokenOverlap = results.find((result: any) => {
                        const routeText = extractRouteText(result);
                        if (!routeText) return false;
                        return expectedTokens.some((token) => routeText.includes(token));
                    });

                    // Fallback: usa el primer resultado geocodificado para poder trazar el tramo
                    // entre numeración inicio/fin incluso cuando Google no informa route consistente.
                    return byTokenOverlap ?? results[0] ?? null;
                };

                const toPoint = (result: any) => {
                    const loc = result?.geometry?.location;
                    if (!loc?.lat || !loc?.lng) return null;
                    return { lat: Number(loc.lat), lng: Number(loc.lng) };
                };

                const midpoint = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => ({
                    lat: (a.lat + b.lat) / 2,
                    lng: (a.lng + b.lng) / 2,
                });

                const getOppositeSideNumber = (value: number, min: number, max: number) => {
                    const plus = value + 1;
                    const minus = value - 1;
                    if (plus <= max) return plus;
                    if (minus >= min) return minus;
                    return value;
                };

                let bestResult: any = null;

                if (hasNumerationRange && String(record.address ?? "").trim()) {
                    const startNum = Math.min(numerationStartValue, numerationEndValue);
                    const endNum = Math.max(numerationStartValue, numerationEndValue);

                    setGeocodeDeniedMessage(null);

                    const span = Math.max(0, endNum - startNum);
                    const targetSegments = 8;
                    const step = Math.max(1, Math.floor(span / targetSegments));

                    const baseNumbers = [startNum];
                    for (let value = startNum + step; value < endNum; value += step) {
                        baseNumbers.push(value);
                    }
                    baseNumbers.push(endNum);

                    const uniqueBaseNumbers = Array.from(new Set(baseNumbers)).sort((a, b) => a - b);
                    const queryNumbers = new Set<number>();
                    for (const value of uniqueBaseNumbers) {
                        queryNumbers.add(value);
                        queryNumbers.add(getOppositeSideNumber(value, startNum, endNum));
                    }

                    const uniqueNumbers = Array.from(queryNumbers).sort((a, b) => a - b);
                    const sampledResults = await Promise.all(
                        uniqueNumbers.map(async (numberValue) => ({
                            numberValue,
                            result: await fetchNumberedPointOnStreet(numberValue),
                        }))
                    );
                    if (!isCurrentRun()) return;

                    const resultByNumber = new Map<number, any>();
                    for (const sampled of sampledResults) {
                        resultByNumber.set(sampled.numberValue, sampled.result);
                    }

                    const centerlinePathRaw = uniqueBaseNumbers
                        .map((value) => {
                            const pointA = toPoint(resultByNumber.get(value));
                            const oppositeValue = getOppositeSideNumber(value, startNum, endNum);
                            const pointB = toPoint(resultByNumber.get(oppositeValue));

                            if (pointA && pointB && value !== oppositeValue) {
                                return midpoint(pointA, pointB);
                            }
                            return pointA ?? pointB ?? null;
                        })
                        .filter((point): point is { lat: number; lng: number } => point !== null);

                    const routePath: Array<{ lat: number; lng: number }> = [];
                    for (const point of centerlinePathRaw) {
                        const previous = routePath[routePath.length - 1];
                        if (!previous) {
                            routePath.push(point);
                            continue;
                        }
                        const isDuplicate =
                            Math.abs(previous.lat - point.lat) < 0.00001 &&
                            Math.abs(previous.lng - point.lng) < 0.00001;
                        if (!isDuplicate) {
                            routePath.push(point);
                        }
                    }

                    if (routePath.length >= 2) {
                        if (!isCurrentRun()) return;
                        const startPoint = routePath[0];
                        const endPoint = routePath[routePath.length - 1];

                        setNumerationPath(routePath);

                        // Ajusta bounds segun la ruta real para encuadrar exactamente el tramo de calle.
                        const pad = 0.00008;
                        const lats = routePath.map((p) => p.lat);
                        const lngs = routePath.map((p) => p.lng);
                        const north = Math.max(...lats) + pad;
                        const south = Math.min(...lats) - pad;
                        const east = Math.max(...lngs) + pad;
                        const west = Math.min(...lngs) - pad;
                        setMapBounds({ north, east, south, west });
                        setShouldAutoFitBounds(true);

                        const midPoint = {
                            lat: (startPoint.lat + endPoint.lat) / 2,
                            lng: (startPoint.lng + endPoint.lng) / 2,
                        };
                        if (!userMovedMapRef.current) {
                            setMapCenter(midPoint);
                        }

                        if (!readOnly) {
                            const currentLat = Number(record.locationLat);
                            const currentLng = Number(record.locationLng);
                            const latChanged = !Number.isFinite(currentLat) || Math.abs(currentLat - midPoint.lat) > 0.000001;
                            const lngChanged = !Number.isFinite(currentLng) || Math.abs(currentLng - midPoint.lng) > 0.000001;
                            if (latChanged) onChange?.("locationLat", midPoint.lat);
                            if (lngChanged) onChange?.("locationLng", midPoint.lng);
                        }

                        setPostalZoneAvailable(false);
                        return;
                    }

                    setNumerationPath([]);
                    setMapBounds(null);
                    setShouldAutoFitBounds(false);
                    setPostalZoneAvailable(false);
                    setGeocodeDeniedMessage("No fue posible geocodificar el tramo con precisión sobre la calle ingresada.");
                    return;
                } else if (!hasAnyNumerationInput && showPostalRange && postalCodeClean) {
                    setPostalZoneAvailable(true);
                    setGeocodeDeniedMessage(null);
                    bestResult = await fetchCandidate(buildPostalUrl(), true);
                    if (!bestResult) {
                        bestResult = await fetchCandidate(buildPostalTextUrl(`${postalCodeClean}, Chile`), true);
                    }
                    if (!bestResult && (city || state)) {
                        bestResult = await fetchCandidate(
                            buildPostalTextUrl([postalCodeClean, city, state, "Chile"].filter(Boolean).join(", ")),
                            true
                        );
                    }
                    if (!bestResult) {
                        bestResult = await fetchCandidate(buildAddressUrl(), true);
                    }
                    if (!bestResult) {
                        // Último fallback no estricto: evita bloquear el render cuando geocoding no expone postal exacto.
                        bestResult = await fetchCandidate(buildAddressUrl(), false);
                    }
                } else {
                    if (hasAnyNumerationInput) {
                        setPostalZoneAvailable(false);
                    }
                    setGeocodeDeniedMessage(null);
                    bestResult = await fetchCandidate(buildAddressUrl(), false);
                }

                setNumerationPath([]);

                if (requestDenied) {
                    if (!isCurrentRun()) return;
                    setPostalZoneAvailable(false);
                    setMapBounds(null);
                    return;
                }

                if (!hasAnyNumerationInput && showPostalRange && !bestResult) {
                    if (!isCurrentRun()) return;
                    setPostalZoneAvailable(false);
                    setMapBounds(null);
                    return;
                }

                if (!hasAnyNumerationInput && showPostalRange) {
                    setPostalZoneAvailable(true);
                }

                const geometry = bestResult?.geometry;
                const loc = geometry?.location;
                if (!isCurrentRun() || !loc?.lat || !loc?.lng) return;
                const resolvedLat = Number(loc.lat);
                const resolvedLng = Number(loc.lng);
                if (!userMovedMapRef.current) {
                    setMapCenter({ lat: resolvedLat, lng: resolvedLng });
                }

                // Sincroniza coordenadas geocodificadas con el formulario para enviarlas en el payload.
                if (!readOnly) {
                    const currentLat = Number(record.locationLat);
                    const currentLng = Number(record.locationLng);
                    const latChanged = !Number.isFinite(currentLat) || Math.abs(currentLat - resolvedLat) > 0.000001;
                    const lngChanged = !Number.isFinite(currentLng) || Math.abs(currentLng - resolvedLng) > 0.000001;

                    if (latChanged) onChange?.("locationLat", resolvedLat);
                    if (lngChanged) onChange?.("locationLng", resolvedLng);
                }

                const bounds = geometry?.bounds;
                const viewport = geometry?.viewport;
                const box = (bounds?.northeast && bounds?.southwest)
                    ? bounds
                    : (viewport?.northeast && viewport?.southwest ? viewport : null);

                if (box?.northeast && box?.southwest) {
                    const north = Number(box.northeast.lat);
                    const east = Number(box.northeast.lng);
                    const south = Number(box.southwest.lat);
                    const west = Number(box.southwest.lng);
                    setMapBounds({
                        north,
                        east,
                        south,
                        west,
                    });
                    setShouldAutoFitBounds(true);

                    const centerLat = Number(loc.lat);
                    const centerLng = Number(loc.lng);
                    const radiusToNE = haversineMeters(centerLat, centerLng, north, east);
                    const radiusToSW = haversineMeters(centerLat, centerLng, south, west);
                    const estimated = clamp(Math.max(radiusToNE, radiusToSW), MIN_POSTAL_RADIUS_M, MAX_POSTAL_RADIUS_M);
                    setPostalEstimatedRadiusM(estimated);
                } else {
                    setMapBounds(null);
                    setShouldAutoFitBounds(false);
                    setPostalEstimatedRadiusM(DEFAULT_POSTAL_RADIUS_M);
                }
            } catch {
                // mantenemos centro por defecto
                if (isCurrentRun()) {
                    setPostalZoneAvailable(false);
                    setMapBounds(null);
                    setShouldAutoFitBounds(false);
                    setPostalEstimatedRadiusM(DEFAULT_POSTAL_RADIUS_M);
                }
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [
        mapQuery,
        googleMapsApiKey,
        hasAnyNumerationInput,
        hasNumerationRange,
        showPostalRange,
        postalCodeClean,
        record.address,
        debouncedNumerationStart,
        debouncedNumerationEnd,
        record.locationCity,
        record.locationState,
        readOnly,
    ]);

    React.useEffect(() => {
        if (!mapBounds || !mapInstance || typeof google === "undefined") return;
        if (!showPostalRange && !hasNumerationRange) return;
        if (!shouldAutoFitBounds) return;

        const bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(mapBounds.south, mapBounds.west),
            new google.maps.LatLng(mapBounds.north, mapBounds.east)
        );
        mapInstance.fitBounds(bounds, 24);
        setShouldAutoFitBounds(false);
    }, [showPostalRange, hasNumerationRange, mapBounds, mapInstance, shouldAutoFitBounds]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA */}
                <div className="lg:col-span-4 space-y-6">
                    {/* DETALLE */}
                    <Card title="DETALLE" icon={ClipboardDocumentListIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* Disponibilidad */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Disponibilidad</span>
                            <div className="col-span-5">
                                <Select
                                    value={record.availability}
                                    options={AVAILABILITY_OPTIONS}
                                    onValueChange={(value) => handle("availability")(value as DeliveryRestriction["availability"])}
                                    disabled={readOnly}
                                    placeholder="Seleccionar disponibilidad"
                                />
                            </div>

                            {/* Estado */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
                            <div className="col-span-5 flex items-center">
                                <Toggle
                                    checked={record.status === "Activo"}
                                    onCheckedChange={(checked) => handle("status")(checked ? "Activo" : "Inactivo")}
                                    disabled={readOnly}
                                    aria-label="Estado"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* INTERVALOS */}
                    <Card title="INTERVALOS" icon={CalendarClock} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* Zona horaria */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Zona horaria</span>
                            <div className="col-span-5">
                                <Select
                                    value={record.timezone}
                                    options={TZ_OPTIONS}
                                    onValueChange={(value) => handle("timezone")(value)}
                                    disabled={readOnly}
                                    placeholder="Seleccionar zona horaria"
                                />
                            </div>

                            {/* Horarios (ventanas) */}
                            <span className="col-span-1 text-sm text-gray-600 font-bold">Horarios</span>
                            <div className="col-span-5 space-y-3">
                                {record.windows.map((w, i) => (
                                    <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                                        <div className="mb-3 text-xl font-semibold text-gray-700">
                                            Ventana {i + 1}
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-x-4">
                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <span className="col-span-1 text-sm font-semibold text-gray-600">Día</span>
                                                <select
                                                    className="col-span-2 border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                                    value={w.day || ""}
                                                    onChange={(e) => updateWindow(i, "day", e.target.value)}
                                                    disabled={readOnly}
                                                >
                                                    <option value="" disabled>Seleccionar día</option>
                                                    {DAYS_OPTIONS.map((d) => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <span className="col-span-1 text-sm font-semibold text-gray-600">Inicio</span>
                                                <div className="col-span-2">
                                                    <TimePickerField
                                                        value={w.from}
                                                        onChange={(value) => updateWindow(i, "from", value)}
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <span className="col-span-1 text-sm font-semibold text-gray-600">Término</span>
                                                <div className="col-span-2">
                                                    <TimePickerField
                                                        value={w.to}
                                                        onChange={(value) => updateWindow(i, "to", value)}
                                                        disabled={readOnly}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <span className="col-span-1 text-sm font-semibold text-gray-600">Máx. envíos</span>
                                                <input
                                                    type="number"
                                                    className="col-span-2 border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                                    value={w.maxShippingQty ?? ""}
                                                    onChange={(e) => updateWindow(i, "maxShippingQty", e.target.value === "" ? null : Number(e.target.value))}
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <span className="col-span-1 text-sm font-semibold text-gray-600">Paquetes (máx.)</span>
                                                <input
                                                    type="number"
                                                    className="col-span-2 border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                                    value={w.maxPackages ?? ""}
                                                    onChange={(e) => updateWindow(i, "maxPackages", e.target.value === "" ? null : Number(e.target.value))}
                                                    disabled={readOnly}
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 items-center">
                                                <span className="col-span-1 text-sm font-semibold text-gray-600">Máx. ítems</span>
                                                <input
                                                    type="number"
                                                    className="col-span-2 border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                                    value={w.maxItems ?? ""}
                                                    onChange={(e) => updateWindow(i, "maxItems", e.target.value === "" ? null : Number(e.target.value))}
                                                    disabled={readOnly}
                                                />
                                            </div>
                                        </div>

                                        {!readOnly && (
                                            <div className="mt-4 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    className="rounded-full border border-blue-300 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                                                    onClick={addWindow}
                                                >
                                                    + Agregar esquema
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50"
                                                    onClick={() => removeWindow(i)}
                                                >
                                                    Eliminar esquema
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!readOnly && record.windows.length === 0 && (
                                    <ActionButton type="button" variant="primary" size="sm" onClick={addWindow}>
                                        <ClockIcon className="h-4 w-4" /> Agregar ventana
                                    </ActionButton>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DERECHA */}
                <div className="lg:col-span-3 space-y-6">
                    <Card title="UBICACIÓN" icon={MapPinIcon} noDefaultStyles hasTitleDivider className="rounded-xl p-6">
                        <div className="grid grid-cols-6 gap-4">
                            {/* Placeholder de mapa (mock) */}
                            <div className="col-span-6">
                                {!googleMapsApiKey ? (
                                    <div className="h-64 w-full rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
                                        <span className="text-gray-500 text-sm">Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para visualizar el mapa.</span>
                                    </div>
                                ) : mapLoadError ? (
                                    <div className="h-64 w-full rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
                                        <span className="text-red-600 text-sm">
                                            {isBillingError
                                                ? "Google Maps no disponible: la cuenta del proyecto no tiene billing habilitado."
                                                : "No se pudo cargar Google Maps."}
                                        </span>
                                    </div>
                                ) : !isMapLoaded ? (
                                    <div className="h-64 w-full animate-pulse rounded-lg border border-gray-300 bg-gray-100" />
                                ) : (
                                    <div className="overflow-hidden rounded-lg border border-gray-300">
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={mapCenter}
                                            zoom={showPostalRange ? 13 : 16}
                                            onLoad={(map) => setMapInstance(map)}
                                            onUnmount={() => setMapInstance(null)}
                                            onDragStart={() => {
                                                userMovedMapRef.current = true;
                                                setShouldAutoFitBounds(false);
                                            }}
                                            onZoomChanged={() => {
                                                userMovedMapRef.current = true;
                                                setShouldAutoFitBounds(false);
                                            }}
                                        >
                                            {hasNumerationRange && numerationPath.length >= 2 ? (
                                                <Polyline
                                                    path={numerationPath}
                                                    options={{
                                                        strokeColor: "#2563eb",
                                                        strokeOpacity: 0.75,
                                                        strokeWeight: 12,
                                                    }}
                                                />
                                            ) : null}
                                        </GoogleMap>
                                    </div>
                                )}
                                {hasNumerationRange && numerationPath.length < 2 && geocodeDeniedMessage && (
                                    <div className="mt-1 text-xs text-amber-700">
                                        {geocodeDeniedMessage}
                                    </div>
                                )}
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Dirección</span>
                            <div className="col-span-5">
                                <input
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.address}
                                    onChange={(e) => handle("address")(e.target.value)}
                                    disabled={readOnly}
                                    placeholder="Calle, ciudad y región (ej: Calle 1 Nte. 1485, Talca, Maule)"
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Numeración (inicio)</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.numerationStart ?? ""}
                                    onChange={(e) => handle("numerationStart")(e.target.value ? Number(e.target.value) : null)}
                                    disabled={readOnly}
                                    placeholder=""
                                />
                            </div>

                            <span className="col-span-1 text-sm text-gray-600 font-bold">Numeración (fin)</span>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={record.numerationEnd ?? ""}
                                    onChange={(e) => handle("numerationEnd")(e.target.value ? Number(e.target.value) : null)}
                                    disabled={readOnly}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
