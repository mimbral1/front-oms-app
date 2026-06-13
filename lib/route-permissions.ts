/* // lib/route-permissions.ts
import { Role } from "@/app/context/auth/AuthContext";

export const ROUTE_PERMISSIONS: { pattern: RegExp; allowed: Role[] }[] = [
  { pattern: /^\/pedidos\/\d+(\/|$)/, allowed: ["manager", "user", "admin"] },
  { pattern: /^\/pedidos\/monitores(\/|$)/, allowed: ["manager"] },
  { pattern: /^\/pedidos(\/|$)/, allowed: ["admin", "manager", "user"] },
  { pattern: /^\/picking(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/delivery(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/finanzas(\/|$)/, allowed: ["admin"] },
  {
    pattern: /^\/integraciones-test(\/|$)/,
    allowed: ["admin", "manager", "user"],
  },
  { pattern: /^\/cuenta(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/catalogo(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/almacen(\/|$)/, allowed: ["admin"] },
  { pattern: /^\/monitoreo(\/|$)/, allowed: ["admin"] },
];
 */

// lib/route-permissions.ts
import { Role } from "@/app/context/auth/AuthContext";

export const ROUTE_PERMISSIONS: { pattern: RegExp; allowed: Role[] }[] = [
  // Nueva regla para la raíz (o cualquier ruta no especificada que deba ser protegida por defecto)
  { pattern: /^\/$/, allowed: ["admin", "manager", "user"] }, // Por ejemplo, si '/' requiere autenticación
  // O, si quieres que cualquier ruta no especificada caiga aquí y requiera autenticación:
  // { pattern: /^.*$/, allowed: ["admin", "manager", "user"] }, // Esta sería una regla "catch-all" para rutas protegidas

  { pattern: /^\/pedidos\/\d+(\/|$)/, allowed: ["manager", "user", "admin"] },
  { pattern: /^\/pedidos\/monitores(\/|$)/, allowed: ["manager", "admin"] },
  { pattern: /^\/pedidos(\/|$)/, allowed: ["admin", "manager", "user"] },
  { pattern: /^\/picking(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/delivery(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/finanzas(\/|$)/, allowed: ["admin"] },
  {
    pattern: /^\/integraciones-test(\/|$)/,
    allowed: ["admin", "manager", "user"],
  },
  { pattern: /^\/cuenta(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/catalogo(\/|$)/, allowed: ["admin", "manager"] },
  { pattern: /^\/almacen(\/|$)/, allowed: ["admin"] },
  { pattern: /^\/monitoreo(\/|$)/, allowed: ["admin"] },
];
