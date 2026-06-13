// views\Delivery\Rutas\components\talca.mock.ts
// Mock unificado para Talca: coincide con el usado en Rutas (Talca Centro, Las Rastras, Alameda, La Florida).
// Si luego cambias aquí, lo heredan Rutas y Simulación.

export type TalcaStop = {
    id: string;                  // "Talca Centro" | "Alameda" | ...
    title: string;               // "Origen" | "1" | ...
    tipo: "Pickup" | "Entrega";
    inventario: string;          // mismo texto que se usa como nombre visible
    lat: number;
    lng: number;
    address?: string;            // opcional, para el texto de la fila
};

// Almacenes (coordenadas Talca)
export const TALCA_WAREHOUSES = {
    TALCA_CENTRO: { name: "Talca Centro", lat: -35.4266, lng: -71.6555 },
    ALAMEDA: { name: "Alameda", lat: -35.4325, lng: -71.6490 },
    LA_FLORIDA: { name: "La Florida", lat: -35.4536, lng: -71.6046 },
    LAS_RASTRAS: { name: "Las Rastras", lat: -35.4534, lng: -71.6309 },
} as const;

// Entregas de ejemplo alrededor de cada almacén
const around = (base: { lat: number; lng: number }, dx: number, dy: number) => ({
    lat: base.lat + dx, lng: base.lng + dy
});

export function buildTalcaSimulationRoutes() {

    const r1Stops: TalcaStop[] = [
        { id: "Talca Centro", title: "Origen", tipo: "Pickup", inventario: "Talca Centro", ...TALCA_WAREHOUSES.TALCA_CENTRO },
        { id: "Las Rastras", title: "1", tipo: "Entrega", inventario: "Las Rastras", ...around(TALCA_WAREHOUSES.LAS_RASTRAS, 0.003, -0.002), address: "Ricardo Balbín 1295, CABA (Entrega 1)" },
        { id: "Alameda", title: "2", tipo: "Entrega", inventario: "Alameda", ...around(TALCA_WAREHOUSES.ALAMEDA, -0.002, 0.003), address: "Quesada 1549, CABA (Entrega 2)" },
    ];

    const r2Stops: TalcaStop[] = [
        { id: "Alameda", title: "Origen", tipo: "Pickup", inventario: "Alameda", ...TALCA_WAREHOUSES.ALAMEDA },
        { id: "Talca Centro", title: "1", tipo: "Entrega", inventario: "Talca Centro", ...around(TALCA_WAREHOUSES.TALCA_CENTRO, 0.0015, -0.0012) },
        { id: "Alameda", title: "2", tipo: "Entrega", inventario: "Alameda", ...around(TALCA_WAREHOUSES.ALAMEDA, 0.0010, 0.0010) },
    ];

    const r3Stops: TalcaStop[] = [
        { id: "La Florida", title: "Origen", tipo: "Pickup", inventario: "La Florida", ...TALCA_WAREHOUSES.LA_FLORIDA },
        { id: "Las Rastras", title: "1", tipo: "Entrega", inventario: "Las Rastras", ...around(TALCA_WAREHOUSES.LAS_RASTRAS, -0.0018, 0.0012) },
    ];

    const r4Stops: TalcaStop[] = [
        { id: "Las Rastras", title: "Origen", tipo: "Pickup", inventario: "Las Rastras", ...TALCA_WAREHOUSES.LAS_RASTRAS },
        { id: "La Florida", title: "1", tipo: "Entrega", inventario: "La Florida", ...around(TALCA_WAREHOUSES.LA_FLORIDA, 0.0014, -0.0014) },
        { id: "La Florida", title: "2", tipo: "Entrega", inventario: "La Florida", ...around(TALCA_WAREHOUSES.LA_FLORIDA, -0.0010, 0.0016) },
    ];

    return [
        { id: "R1", nombre: "Las Rastras", color: "#5B33FF", stops: r1Stops, distanciaKm: 4.9, tiempoMin: 15, expanded: true },
        { id: "R2", nombre: "Las Rastras", color: "#F59E0B", stops: r2Stops, distanciaKm: undefined, tiempoMin: undefined, expanded: false },
        { id: "R3", nombre: "La Florida", color: "#DB2777", stops: r3Stops, distanciaKm: undefined, tiempoMin: undefined, expanded: false },
        { id: "R4", nombre: "La Florida", color: "#0EA5E9", stops: r4Stops, distanciaKm: undefined, tiempoMin: undefined, expanded: false },
    ];
}

// ====== helpers neutros para colores por almacén y coordenadas ======
export type Warehouse = { nombre: string; lat: number; lng: number };

export const WAREHOUSES: Warehouse[] = [
    { nombre: TALCA_WAREHOUSES.TALCA_CENTRO.name, lat: TALCA_WAREHOUSES.TALCA_CENTRO.lat, lng: TALCA_WAREHOUSES.TALCA_CENTRO.lng },
    { nombre: TALCA_WAREHOUSES.LAS_RASTRAS.name, lat: TALCA_WAREHOUSES.LAS_RASTRAS.lat, lng: TALCA_WAREHOUSES.LAS_RASTRAS.lng },
    { nombre: TALCA_WAREHOUSES.LA_FLORIDA.name, lat: TALCA_WAREHOUSES.LA_FLORIDA.lat, lng: TALCA_WAREHOUSES.LA_FLORIDA.lng },
    { nombre: TALCA_WAREHOUSES.ALAMEDA.name, lat: TALCA_WAREHOUSES.ALAMEDA.lat, lng: TALCA_WAREHOUSES.ALAMEDA.lng },
];

function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

const PALETTE = [
    "#2F80ED", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#F97316", "#14B8A6", "#6366F1",
];

/** Color estable por nombre de almacén */
export function colorForWarehouse(nombre?: string) {
    const key = nombre || "Talca Centro";
    return PALETTE[hash(key) % PALETTE.length];
}

function normalizeWarehouseName(value?: string) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/** Devuelve lat/lng del almacén (si no existe, cae en Talca Centro) */
export function getWarehouseLatLng(nombre?: string) {
    const normalizedName = normalizeWarehouseName(nombre);

    return (
        WAREHOUSES.find((w) => normalizeWarehouseName(w.nombre) === normalizedName) ||
        WAREHOUSES[0]
    );
}
