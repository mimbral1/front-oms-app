export interface OlaPicking {
  id: string;
  pickingPoint: string;
  fechaInicio: string;
  fechaFin: string;
  pedidos: {
    actual: number;
    total: number;
  };
  items: {
    actual: number;
    total: number;
  };
  bloqueada: boolean;
  status: "Finalizada" | "En curso" | "Pendiente";
}

export interface OlaPickingFilters {
  displayId: string;
  pickingPoint: string;
  dateRange: string;
}

export interface OlaPickingStore {
  olas: OlaPicking[];
  filters: OlaPickingFilters;
  setOlas: (olas: OlaPicking[]) => void;
  setFilters: (filters: Partial<OlaPickingFilters>) => void;
}

export interface OlasFilters {
  displayId?: string;
  pickingPoint?: string;
  dateRange?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface Ola {
  id: string;
  pickingPoint: string;
  fechaInicio: string;
  fechaFin: string;
  pedidos: {
    actual: number;
    total: number;
  };
  items: {
    actual: number;
    total: number;
  };
  bloqueada: boolean;
  status: string;
}

export type OlaStatus = "Finalizada" | "En curso" | "Pendiente";

// types/orders.ts
export interface ApiOrderProduct {
  orderProductID: number;
  itemcode: number;
  dscription: string;
  price: string;
  quantity: number;
  pickedQuantity: number;
  pickingStatusID: number;
  lineNum: number;
  total: string;
  isAssigned: number;
}

export interface ApiOrder {
  orderID: number;
  docentry: number;
  u_ref1: string;
  cardcode: number;
  products: ApiOrderProduct[];
  isDebugEmpty?: boolean;
}

// Si más adelante necesitas filtros, los defines aquí:
export interface OrderFilters {
  searchTerm: string; // Ejemplo
  // Agrega más campos si lo requieres
}
