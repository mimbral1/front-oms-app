// utils/status.ts
// Helpers genéricos de estado compartidos entre features.

export type Estado = "Activo" | "Inactivo";

/** Color Tailwind para estados activo/inactivo (español o inglés). */
export const getEstadoColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s === "activo" || s === "active") return "bg-green-500";
  return "bg-gray-400";
};

// Función para obtener el color de fondo para estados de pedido
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Entregada":
      return "bg-green-500";
    case "Pendiente":
      return "bg-orange-500";
    case "Listo para facturar":
      return "bg-lime-500";
    case "Cancelado":
      return "bg-red-500";
    default:
      return "bg-blue-500";
  }
};

// Función para obtener el nombre de la sección
export const getSectionName = (section: string): string => {
  switch (section) {
    case "items":
      return "ITEMS";
    case "envios":
      return "ENVÍOS";
    case "historial":
      return "HISTORIAL";
    case "bultos":
      return "BULTOS";
    case "incidencias":
      return "INCIDENCIAS";
    case "archivos":
      return "ARCHIVOS";
    case "comentarios":
      return "COMENTARIOS";
    default:
      return "RESUMEN";
  }
};
