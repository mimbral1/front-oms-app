// Helper de cliente para el servicio de delivery.
//
// En la versión de escritorio/web estas llamadas pasaban por route handlers
// en `app/api/delivery/*` que actuaban de proxy. En el build de App Store
// (output: "export") no existe servidor Node, así que el cliente debe llamar
// directamente al backend usando bases absolutas tomadas del entorno.

const stripTrailingSlash = (value: string): string => value.replace(/\/$/, "");

// Base principal del servicio de delivery (carrier, carrier-group, route,
// shipping, company, time-slot, window-schema, shipping-type, ...).
export const DELIVERY_API_BASE = stripTrailingSlash(
  process.env.NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE || ""
);

// Base del gateway principal (usada por package-service).
export const GATEWAY_API_BASE = stripTrailingSlash(
  process.env.NEXT_PUBLIC_URL_BASE ||
    process.env.NEXT_PUBLIC_URL_BASE_QA ||
    ""
);

// Endpoint de tipos de paquete (antes proxy /api/delivery/package-types).
export const PACKAGE_TYPES_URL = `${GATEWAY_API_BASE}/package-service/package-types`;

// Endpoint de warehouses (antes proxy /api/delivery/warehouse).
export const WAREHOUSE_API_BASE =
  stripTrailingSlash(process.env.NEXT_PUBLIC_URL_BASE_WAREHOUSES || "") ||
  DELIVERY_API_BASE;

// Construye una URL absoluta del servicio de delivery a partir de un path
// relativo, p.ej. deliveryUrl("/carrier?page=1") -> "<base>/carrier?page=1".
export function deliveryUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${DELIVERY_API_BASE}${p}`;
}
