export type RondaPickingStatus = "Pickeada" | "Pendiente";

export interface RondaPicking {
  id: string;
  pickingPoint: string;
  ola: string;
  picker: string;
  pickerEmail: string;
  pickeruser: {
    picker: string;
    pickerEmail: string;
  };
  pedidos: number;
  productos: string;
  items: string;
  itemsFaltantes: number | "-";
  completado: string;
  creacion: string;
  modificado: string;
  status: RondaPickingStatus;
}

export interface PickingFilters {
  pickingPoint: string;
  picker: string;
  status: string;
}

export interface RondaPickingDetalle extends RondaPicking {
  itemsRepickeados: boolean;
  usuarioCreador: {
    nombre: string;
    fecha: string;
  };
  ultimaModificacion: {
    fecha: string;
  };
}

export type TabRondaPicking =
  | "resumen"
  | "items"
  | "pedidos"
  | "simular"
  | "comentarios"
  | "logs";
