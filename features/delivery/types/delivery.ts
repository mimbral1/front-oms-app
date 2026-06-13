// Interfaces para Envíos
export interface Envio {
  id: string;
  fechaEnvio: string;
  origen: string;
  destino: string;
  entrega: {
    inicio: string;
    fin: string;
  };
  estado: "Creada" | "En Proceso" | "Finalizada" | "Cancelada";
  tipoEntrega: string;
  cliente: {
    nombre: string;
    direccion: string;
    telefono: string;
  };
}

// Interfaces para Rutas
export type RutaEstado =
  | "Pendiente"
  | "En Proceso"
  | "Finalizada"
  | "Cancelada";

export interface Programacion {
  inicio: string;
  fin: string;
}

export interface Ruta {
  id: string;
  fecha: string;
  inventarios: string[];
  entrega: string;
  infoParadas: string;
  transportista: string;
  operador: string;
  programacion: Programacion;
  estado: RutaEstado;
}

// Interfaces para Transportistas
export interface Transportista {
  ref: string;
  nombre: string;
  descripcion: string;
  tipoEnvio: string;
  ubicaciones: string[];
  diasHabiles: string[];
  restricciones: {
    tiempoMinEntrega: string;
    volumenMinPermitido: string;
    volumenMaxPermitido: string;
    pesoMaxPermitido: string;
  };
  configuracion: {
    estado: "Activo" | "Inactivo";
    generarRuta: boolean;
    metodoSegundoFactor: string;
  };
  creador: {
    nombre: string;
    email: string;
    fechaCreacion: string;
  };
}

// Interfaces para los filtros
export interface DeliveryFilters {
  fechaDesde: string;
  fechaHasta: string;
  estado: string;
  transportista: string;
}

export interface RutasFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  transportista?: string;
}

// Interfaces para el store
export interface DeliveryStore {
  envios: Envio[];
  rutas: Ruta[];
  transportistas: Transportista[];
  filters: DeliveryFilters;
  setEnvios: (envios: Envio[]) => void;
  setRutas: (rutas: Ruta[]) => void;
  setTransportistas: (transportistas: Transportista[]) => void;
  setFilters: (filters: Partial<DeliveryFilters>) => void;
}
