export interface Warehouse {
  id: string;
  nombre: string;
  ubicacion: string;
  items: number | string;
  fechaCreacion: string; // Fecha de creación
  ultimaModificacion: string; // Fecha de última modificación
  usuarioCreacion: {
    name: string;
    email: string;
  }; // Usuario que creó
  usuarioModificacion: { name: string; email: string }; // Usuario que modificó
  imagenUsuarioCreacion: string; // Imagen del usuario que creó
  imagenUsuarioModificacion: string; // Imagen del usuario que modificó
  status: string;
}

export type WarehouseStatus = "Activo" | "Inactivo";

export interface WarehouseFilters {
  nombre: string;
  id: string;
  ubicacion: string;
  fechaCreacion: string; // si quieres filtrar por fecha creación
  status: string; // filtrar por "Active"/"Inactive"
}

export interface WarehouseStore {
  warehouse: Warehouse[];
  filters: WarehouseFilters;
  setWarehouse: (warehouse: Warehouse[]) => void;
  setFilters: (filters: Partial<WarehouseFilters>) => void;
}

export const WAREHOUSES = [
  { label: "Centro Comercial", value: "1" },
  { label: "Devolución", value: "2" },
  { label: "Comercio Electrónico", value: "3" },
  { label: "Control de Pérdida", value: "4" },
  { label: "Envíos FULL - Mercado Libre", value: "5" },
  { label: "Bodega Fábrica", value: "6" },
  { label: "Ferretería Balmaceda", value: "7" },
  { label: "Bodega Lo Ovalle", value: "8" },
  { label: "Reservado Con Abono", value: "10" },
  { label: "Productos con Falla", value: "12" },
  { label: "Reservado FULL", value: "13" },
];
