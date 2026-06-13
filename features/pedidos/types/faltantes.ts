export interface ItemFaltante {
  id: string;
  pedido: string;
  producto: string;
  cantidad: number;
  cantidadFaltante: number;
  ubicacion: string;
  estado: "Pendiente" | "Procesado" | "Cancelado";
  fechaReporte: string;
  prioridad: number;
}

export interface FaltantesFilters {
  pedido?: string;
  producto?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  prioridad?: string;
}

export interface FaltantesStore {
  faltantes: ItemFaltante[];
  filters: FaltantesFilters;
  setFaltantes: (faltantes: ItemFaltante[]) => void;
  setFilters: (filters: Partial<FaltantesFilters>) => void;
  updateFaltante: (id: string, updates: Partial<ItemFaltante>) => void;
}
