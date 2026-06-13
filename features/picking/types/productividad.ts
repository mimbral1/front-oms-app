export interface Picker {
  name: string;
  activityTime: string;
  round: number;
  avgPerRound: string;
  orders: number;
  avgPerOrder: string;
  items: number;
  performance: string;
  foundRate: string;
  fillRate: string;
}

export interface ProductividadFilters {
  picker?: string;
  fechaInicio?: string;
  fechaFin?: string;
  pickingPoint?: string;
}

export interface Productividad {
  id: string;
  picker: string;
  pickingPoint: string;
  fechaInicio: string;
  fechaFin: string;
  pedidosCompletados: number;
  itemsProcesados: number;
  tiempoPromedio: string;
  eficiencia: number;
}

export interface ProductividadStore {
  productividad: Productividad[];
  filters: ProductividadFilters;
  setProductividad: (productividad: Productividad[]) => void;
  setFilters: (filters: Partial<ProductividadFilters>) => void;
}
