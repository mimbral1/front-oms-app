// components/ui/badge/status-domains.ts
//
// Registros de estado para dominios que NO tienen su propio feature file.
// (Los dominios que SÍ tienen feature file se auto-registran desde ahí:
//   - "pedido" / "pedido-item" → features/pedidos/utils/pedido-status.ts
//   - "ola"                    → features/olas/utils/ola-status.ts
//   - "ruta"                   → features/delivery/utils/delivery-status.ts
// )
//
// Importar este archivo una vez (en layout raíz) para registrar los restantes.

import { registerStatusMap } from "./status-registry";

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * DELIVERY TRACKING (StatusPill)
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
registerStatusMap("delivery-tracking", {
    "Creada": { variant: "pending" },
    "Programada": { variant: "warning" },
    "Iniciado": { variant: "info" },
    "Arribado": { variant: "processing" },
    "Entregado": { variant: "delivered" },
    "Delivered": { variant: "delivered" },
    "Created": { variant: "pending" },
    "Pending": { variant: "pending" },
});

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * CONTROL INSUMOS (traslados y solicitudes)
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
registerStatusMap("traslado", {
    "Completado": { variant: "success" },
    "En tránsito": { variant: "info" },
    "Pendiente": { variant: "pending" },
    "Rechazado": { variant: "error" },
});

registerStatusMap("solicitud", {
    "Aprobada": { variant: "success" },
    "Pendiente": { variant: "pending" },
    "Rechazada": { variant: "error" },
});

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * PICKING
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
registerStatusMap("picking", {
    "Finalizada": { variant: "success" },
    "En curso": { variant: "processing" },
    "Corregir": { variant: "inactive" },
    "Error": { variant: "error" },
    "Pendiente": { variant: "pending" },
    "Pickeado": { variant: "success" },
    "Faltante": { variant: "warning" },
    "Iniciada": { variant: "processing" },
    "Asignada": { variant: "info" },
    "Creada": { variant: "pending" },
});

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * FACTURACIÓN
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
registerStatusMap("facturacion", {
    "Entregada": { variant: "success" },
    "Pendiente": { variant: "pending" },
    "Listo para facturar": { variant: "processing" },
    "Cancelado": { variant: "error" },
});

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * FORMULARIO (sub-dominio de facturación)
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
registerStatusMap("formulario", {
    "pendiente": { variant: "warning" },
    "enviado": { variant: "info" },
    "completado": { variant: "success" },
    "aprobado": { variant: "success" },
});

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * NOTA DE CRÉDITO
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
registerStatusMap("nota-credito", {
    "N.C Creada": { variant: "error" },
    "Nota Crédito Pendiente": { variant: "warning" },
    "Pendiente": { variant: "pending" },
    "Aprobada": { variant: "success" },
    "Rechazada": { variant: "error" },
});
