// features/delivery/components/rutas/listadorutas/loadPlan.ts
// ============================================================================
// PLAN DE CARGA DE RUTA — contrato de datos, mock local y acceso a servicio.
//
// Esta capa deja preparada la interfaz para consumir más adelante el endpoint:
//   GET /routes/:routeId/load-plan
// Mientras el backend no exista, `fetchRouteLoadPlan` devuelve un mock local
// determinístico para que la vista sea totalmente funcional sin hardcodear
// datos dentro del componente de UI.
// ============================================================================

/* ─── Tipos del contrato ─── */

export type LoadRuleStatus = "pass" | "warn" | "fail";
export type LoadAlertLevel = "warning" | "info" | "error";

/** Color asociado a cada parada/ruta (usado en leyenda, lista y vista 3D). */
export const STOP_COLORS = [
  "#3b82f6", // Parada 1 — azul
  "#22c55e", // Parada 2 — verde
  "#f97316", // Parada 3 — naranjo
  "#a855f7", // Parada 4 — morado
  "#ef4444", // Parada 5 — rojo
  "#06b6d4", // Parada 6 — cian
  "#eab308", // Parada 7 — amarillo
  "#ec4899", // Parada 8 — rosa
] as const;

/** Devuelve el color de una parada por su número de secuencia (1-based). */
export function stopColor(sequence: number): string {
  if (!sequence || sequence < 1) return "#94a3b8";
  return STOP_COLORS[(sequence - 1) % STOP_COLORS.length];
}

export interface VehicleCapacity {
  /** Volumen máximo del vehículo en m³. */
  maxVolumeM3: number;
  /** Peso máximo admitido en kg. */
  maxWeightKg: number;
  /** Espacios/posiciones totales disponibles. */
  totalSpaces: number;
}

export interface LoadPlanSummary {
  usedVolumeM3: number;
  usedWeightKg: number;
  usedSpaces: number;
  /** La carga cumple todas las restricciones del vehículo y reglas. */
  valid: boolean;
  validationMessage: string;
}

export interface LoadPlanStop {
  id: string;
  /** Orden de la parada en la secuencia (1-based). */
  sequence: number;
  name: string;
  /** Hora estimada de llegada (ETA), formato "HH:mm". */
  eta: string;
}

export interface LoadPlanPackage {
  id: string;
  /** Parada a la que pertenece el bulto (secuencia 1-based). */
  stopSequence: number;
  weightKg: number;
  volumeM3: number;
  /** Bulto frágil → regla visual: debe ir arriba. */
  fragile?: boolean;
  /** Bulto pesado → regla visual: debe ir abajo. */
  heavy?: boolean;
}

export interface LoadPlanAxle {
  label: string;
  weightKg: number;
  /** Porcentaje del peso total soportado por el eje. */
  percentage: number;
}

export interface LoadPlanCenterAxis {
  label: string;
  /** Valor en metros respecto al centro geométrico. */
  valueM: number;
  status: LoadRuleStatus;
  statusLabel: string;
}

export interface LoadPlanRule {
  label: string;
  status: LoadRuleStatus;
  statusLabel: string;
}

export interface LoadPlanAlert {
  level: LoadAlertLevel;
  message: string;
}

/** Estructura completa del plan de carga de una ruta. */
export interface RouteLoadPlan {
  routeId: string;
  vehicle: VehicleCapacity;
  summary: LoadPlanSummary;
  stops: LoadPlanStop[];
  packages: LoadPlanPackage[];
  axles: LoadPlanAxle[];
  centerOfGravity: LoadPlanCenterAxis[];
  rules: LoadPlanRule[];
  alerts: LoadPlanAlert[];
}

/* ─── Mock local (mientras no exista el endpoint) ─── */

export function buildMockLoadPlan(routeId: string): RouteLoadPlan {
  const stops: LoadPlanStop[] = [
    { id: "stop-1", sequence: 1, name: "Palermo", eta: "09:30" },
    { id: "stop-2", sequence: 2, name: "Belgrano", eta: "10:15" },
    { id: "stop-3", sequence: 3, name: "Núñez", eta: "11:00" },
    { id: "stop-4", sequence: 4, name: "Colegiales", eta: "12:00" },
    { id: "stop-5", sequence: 5, name: "Palermo Soho", eta: "12:45" },
  ];

  const packages: LoadPlanPackage[] = [
    {
      id: "BUL-100245-01",
      stopSequence: 1,
      weightKg: 420,
      volumeM3: 1.2,
      heavy: true,
    },
    {
      id: "BUL-100245-02",
      stopSequence: 1,
      weightKg: 380,
      volumeM3: 1.1,
      heavy: true,
    },
    {
      id: "BUL-100246-01",
      stopSequence: 2,
      weightKg: 75,
      volumeM3: 0.3,
      fragile: true,
    },
    {
      id: "BUL-100247-01",
      stopSequence: 3,
      weightKg: 890,
      volumeM3: 2.4,
      heavy: true,
    },
    {
      id: "BUL-100247-02",
      stopSequence: 3,
      weightKg: 650,
      volumeM3: 1.8,
      heavy: true,
    },
    { id: "BUL-100247-03", stopSequence: 3, weightKg: 210, volumeM3: 0.7 },
    { id: "BUL-100248-01", stopSequence: 4, weightKg: 230, volumeM3: 0.8 },
    {
      id: "BUL-100248-02",
      stopSequence: 4,
      weightKg: 120,
      volumeM3: 0.4,
      fragile: true,
    },
    { id: "BUL-100249-01", stopSequence: 5, weightKg: 310, volumeM3: 1.0 },
    { id: "BUL-100249-02", stopSequence: 5, weightKg: 180, volumeM3: 0.6 },
  ];

  // Relleno determinístico hasta 28 bultos para reflejar el total de la ruta.
  let counter = 3;
  while (packages.length < 28) {
    const stopSequence = (packages.length % stops.length) + 1;
    const weightKg = 90 + ((packages.length * 37) % 520);
    const volumeM3 = Number(
      (0.3 + ((packages.length * 7) % 18) / 10).toFixed(2)
    );
    packages.push({
      id: `BUL-1002${50 + Math.floor(counter / 4)}-0${(counter % 4) + 1}`,
      stopSequence,
      weightKg,
      volumeM3,
      heavy: weightKg >= 400,
      fragile: weightKg <= 130,
    });
    counter += 1;
  }

  const usedWeightKg = packages.reduce((acc, p) => acc + p.weightKg, 0);
  const usedVolumeM3 = Number(
    packages.reduce((acc, p) => acc + p.volumeM3, 0).toFixed(2)
  );

  return {
    routeId,
    vehicle: {
      maxVolumeM3: 32,
      maxWeightKg: 12000,
      totalSpaces: 32,
    },
    summary: {
      usedVolumeM3,
      usedWeightKg,
      usedSpaces: packages.length,
      valid: true,
      validationMessage:
        "Cumple con las restricciones del vehículo y las reglas de carga.",
    },
    stops,
    packages,
    axles: [
      { label: "Eje delantero", weightKg: 4120, percentage: 34 },
      { label: "Eje trasero", weightKg: 6420, percentage: 53 },
      {
        label: "Eje de carga",
        weightKg: usedWeightKg - 4120 - 6420,
        percentage: 13,
      },
    ],
    centerOfGravity: [
      { label: "Altura", valueM: 0.92, status: "pass", statusLabel: "Óptimo" },
      { label: "Lateral", valueM: 0.05, status: "pass", statusLabel: "Óptimo" },
      {
        label: "Longitudinal",
        valueM: -0.12,
        status: "pass",
        statusLabel: "Óptimo",
      },
    ],
    rules: [
      { label: "Peso máximo", status: "pass", statusLabel: "Cumple" },
      { label: "Volumen máximo", status: "pass", statusLabel: "Cumple" },
      { label: "Distribución de peso", status: "pass", statusLabel: "Cumple" },
      { label: "Mercancía frágil", status: "pass", statusLabel: "Cumple" },
      {
        label: "Compatibilidad de carga",
        status: "pass",
        statusLabel: "Cumple",
      },
    ],
    alerts: [
      {
        level: "warning",
        message: "2 bultos frágiles ubicados en la parte superior",
      },
      { level: "info", message: "Centro de gravedad dentro de rango óptimo" },
    ],
  };
}

/* ─── Acceso a servicio ─── */

type DeliveryFetcher = <T>(
  path: string,
  init?: RequestInit & { cache?: RequestCache }
) => Promise<T>;

/**
 * Obtiene el plan de carga de una ruta.
 *
 * Intenta el endpoint real `GET /routes/:routeId/load-plan`. Si todavía no
 * está disponible (404 / error de red), cae al mock local para no romper la
 * vista. Cuando el backend exista, basta con que devuelva un `RouteLoadPlan`.
 */
export async function fetchRouteLoadPlan(
  fetcher: DeliveryFetcher,
  routeId: string
): Promise<RouteLoadPlan> {
  if (!routeId) return buildMockLoadPlan("");
  try {
    const response = await fetcher<{ data?: RouteLoadPlan } | RouteLoadPlan>(
      `routes/${encodeURIComponent(routeId)}/load-plan`,
      { method: "GET", cache: "no-store" }
    );
    const plan =
      response &&
      typeof response === "object" &&
      "data" in response &&
      response.data
        ? (response.data as RouteLoadPlan)
        : (response as RouteLoadPlan);
    if (plan && Array.isArray(plan.packages)) {
      return { ...plan, routeId: plan.routeId || routeId };
    }
    return buildMockLoadPlan(routeId);
  } catch {
    // Endpoint aún no implementado → mock local.
    return buildMockLoadPlan(routeId);
  }
}

/* ─── Helpers de formato (es-CL) ─── */

export const fmtNumber = (value: number, decimals = 0) =>
  new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);

export const fmtVolume = (value: number) => `${fmtNumber(value, 2)} m³`;
export const fmtWeight = (value: number) => `${fmtNumber(value, 0)} kg`;
export const fmtMeters = (value: number) => `${fmtNumber(value, 2)} m`;

export const pct = (used: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
