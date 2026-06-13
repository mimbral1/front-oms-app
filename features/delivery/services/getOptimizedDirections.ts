// views\Delivery\Tms\SimulacionRuta\utils\getOptimizedDirections.ts

export type WaypointLike = {
    // cualquiera de estos campos es válido
    position?: google.maps.LatLngLiteral;
    location?: google.maps.LatLngLiteral;
    lat?: number;
    lng?: number;
    // extras opcionales (no usados por la API, pero los toleramos)
    id?: string | number;
    title?: string;
    coords?: google.maps.LatLngLiteral;
    coordinate?: google.maps.LatLngLiteral;
};

/** Espera a que window.google esté listo y soporte importLibrary */
async function waitForGoogle(timeoutMs = 12000, stepMs = 50): Promise<void> {
    if (typeof window === "undefined") return;
    const start = Date.now();
    while (
        !(window as any).google?.maps ||
        typeof (window as any).google.maps.importLibrary !== "function"
    ) {
        if (Date.now() - start > timeoutMs) {
            throw new Error("Google Maps no cargó a tiempo.");
        }
        await new Promise((r) => setTimeout(r, stepMs));
    }
}

/** Normaliza distintas formas de stop a LatLngLiteral */
function toLatLng(s: WaypointLike): google.maps.LatLngLiteral {
    if (s?.position) return s.position as google.maps.LatLngLiteral;
    if (s?.location) return s.location as google.maps.LatLngLiteral;
    if (typeof s?.lat === "number" && typeof s?.lng === "number") {
        return { lat: s.lat, lng: s.lng };
    }
    // toleramos otras propiedades que puedas estar usando en el mock
    const anyS = s as any;
    if (anyS?.coords) return anyS.coords as google.maps.LatLngLiteral;
    if (anyS?.coordinate) return anyS.coordinate as google.maps.LatLngLiteral;

    throw new Error("Stop sin coordenadas válidas");
}

/**
 * Obtiene una ruta optimizada (optimizeWaypoints) para los stops indicados.
 * Devuelve undefined si algo falla. Limita automáticamente a 25 puntos (1 origen, 23 waypoints, 1 destino).
 */
export async function getOptimizedDirections(
    stops: WaypointLike[]
): Promise<google.maps.DirectionsResult | undefined> {
    if (!stops || stops.length < 2) return undefined;
    if (typeof window === "undefined") return undefined;

    await waitForGoogle();

    // Importa la librería de rutas y crea el servicio desde ahí (evita "is not a constructor")
    const routesLib = (await (google.maps as any).importLibrary(
        "routes"
    )) as google.maps.RoutesLibrary;
    const ds = new routesLib.DirectionsService();

    // Respeta límites de waypoints de la API (máx. 25 puntos en total)
    const hardLimited = stops.slice(0, 25);
    const origin = toLatLng(hardLimited[0]);
    const destination = toLatLng(hardLimited[hardLimited.length - 1]);

    const waypoints =
        hardLimited.length > 2
            ? hardLimited.slice(1, -1).map((s) => ({ location: toLatLng(s), stopover: true }))
            : [];

    const req: google.maps.DirectionsRequest = {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    return new Promise((resolve) => {
        ds.route(req, (res, status) => {
            const ok =
                status === (google.maps as any).DirectionsStatus?.OK || status === "OK";
            resolve(ok ? (res as google.maps.DirectionsResult) : undefined);
        });
    });
}
