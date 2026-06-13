import { PedidoStatus } from "@/features/pedidos/types/lista-pedidos";

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl: string;
  criteria: string;
  storeCode: string;
}
export interface BultosItem {
  id: string;
  type: string;
  reference: {
    name: string;
    sku: string;
  };
  barcode: string;
  items: string;
  results: {
    encontrado: string;
    faltante: string;
    sobrante: string;
  };
  fixed: string;
  estado: string;
}

export interface OrderItemsState {
  items: OrderItem[];
  isLoading: boolean;
  error: string | null;
  setItems: (items: OrderItem[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}
export interface Bulto {
  id: string; // identificador único del bulto
  pedidoId: string; // relación al pedido
  tipoPaquete: string; // "EcoBolsa", "Caja", etc.
  codigoBarras: string; // "YUF2MX3ZTV943"
  refId: string; // "1QHW6Y"
  inventario: string; // "Palermo"
  slot?: string; // "-" u opcional
}
export interface BultosItemsState {
  items: BultosItem[];
  isLoading: boolean;
  error: string | null;
  setItems: (items: BultosItem[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface BultosState {
  bultos: Bulto[];
  isLoading: boolean;
  error: string | null;
  setBultos: (bultos: Bulto[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface Order {
  id: string;
  status: string;
  cliente: {
    name: string;
    phone: string;
    email: string;
    customerType: string;
    nps: string;
    dateCreated: string;
    documento: string;
    tipoDocumento: string;
  };
  picking: {
    items: number;
    tiempoPicking: string;
  };
  entrega: {
    tipoEntrega: string;
    fechaEntrega: string;
    recibe: string;
  };
  totales: {
    items: number;
    envio: number;
    totalCapturado: number;
  };
  pago: {
    metodoPago: string;
    estado: string;
  };
  store?: {
    id: string;
    name: string;
  };
  //bultos?: Bulto[];
}

export interface Shipment {
  id: string;
  reference: string;
  status: "Created" | "Delivered";
  type: string;
  origin: { location: string; area: string };
  destination: { location: string; area: string; phone?: string };
  delivery: { start: string; end: string };
  createdAt: string;
  orders: string[];
  internal?: boolean; // ↍ nuevo campo
}

export interface ShipmentsState {
  /* data */
  shipments: Shipment[];

  /* meta */
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  /* actions */
  setShipments: (
    shipments: Shipment[],
    meta?: { page?: number; totalPages?: number }
  ) => void;
  setPage: (p: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
}

export interface HistoryControl {
  id: string;
  date: string;
  status: "Pendiente" | "En Proceso" | "Finalizado" | "Completado";
  inventoryLocation: string;
  itemsFound: number;
  itemsExpected: number;
  packagesFound: number;
  packagesExpected: number;
  source: string;
}

export interface HistoryEvent {
  status: string;
  date: string;
  isCompleted: boolean;
}

export interface HistoryState {
  controls: HistoryControl[];
  events: HistoryEvent[];
  isLoading: boolean;
  error: string | null;
  setControls: (controls: HistoryControl[]) => void;
  setEvents: (events: HistoryEvent[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface DetallePedido {
  id: string;
  cliente: {
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
  };
  fechas: {
    creacion: string;
    entrega: string;
    procesamiento?: string;
  };
  estado: PedidoStatus;
  items: DetalleItem[];
  prioridad: number;
  notas?: string;
  historial: HistorialPedido[];
}

export type ItemStatus = "Pendiente" | "Procesado" | "Faltante";

export interface DetalleItem {
  id: string;
  producto: string;
  cantidad: number;
  procesados: number;
  estado: ItemStatus;
  ubicacion?: string;
}

export interface HistorialPedido {
  fecha: string;
  estado: PedidoStatus;
  usuario: string;
  comentario?: string;
}

export interface DetallePedidoStore {
  pedido: Order | null;
  setPedido: (pedido: Order | null) => void;
  //clearPedido: () => void;
}
