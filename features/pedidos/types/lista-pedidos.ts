export interface PedidoFilters {
  fechaCreacion: string;
  id?: string;
  cliente?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  pickingPoint?: string;
}

export interface Pedido {
  id: string;
  salesChannelReferenceId: string;
  canal: string;
  seller: string;
  folionum: string;
  cliente: {
    nombre: string;
    direccion: string;
    rut: string;
    email: String;
    telefono: string;
  };
  fechaCreacion: string;
  fechaEntrega: string;
  estado: PedidoStatus;
  picking?: {
    items: number;     // cantidad de ítems
    unidades: number;  // total de unidades
    status?: string;
  };
  pickingAsignado?: boolean;
  pickers?: any[];
  entrega: {
    type: string;
    transportista: string;
    direccion: string;
    almacen: string;
    distance: string;
    //inicio: string;
    //fin: string;
    whscode: string
  };
  totales: {
    total: number;
    metodo: string;
    documento: string;
  };
  prioridad: number;
  direccion: string;
  notas?: string;
  pickingPoint?: string;

  /* NUEVOS */
  docentry: number;
  docnum: number;
  u_ref1: string | null;
  slpname: string | null;
  externalPackageId?: string | null;
  showExternalPackageId?: boolean;

  /* … resto de tu estructura … */

  orderStatusID: number;
  paymentMethodID: number | null;
  tipoDocumento: string;
  deliveryTypeID: number | null;
  salesChannelID: number | null;

  integrationError: string | null;
  INTEGRATION_STATUS: string;
}

export type PedidoStatus =
  | "Pendiente"
  | "En Proceso"
  | "Completado"
  | "Cancelado"
  | "Pedido Recibido"
  | "Asignando Pickers"
  | "En picking"
  | "Picking Completado Parcialmente"
  | "Picking Completado"
  | "En revision"
  | "Listo para despacho"
  | "En reparto"
  | "Entregado"
  | "Pedido recibido"
  | "Pediente de Auditar"
  | "Asignado a Packer"
  | "Recibido en Packing"
  | "En packing"
  | "Pendiente de auditar"
  // === nuevos estados del endpoint ===
  | "Pedido Nuevo"
  | "OV Creada"
  | "Pedido Pagado"
  | "Pedido Facturado"
  | "Listo para Picking"
  | "Pendiente Entrega"
  | "Listo Para Fulfillment"
  | "Pedido Entregado";


export interface PedidosStore {
  pedidos: Pedido[];
  filters: PedidoFilters;
  setPedidos: (pedidos: Pedido[]) => void;
  setFilters: (filters: Partial<PedidoFilters>) => void;
}
