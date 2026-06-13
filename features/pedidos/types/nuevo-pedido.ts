import { z } from "zod";

export type PedidoStatus =
  | "Pendiente"
  | "En Proceso"
  | "Completado"
  | "Cancelado";

export const clienteSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  telefono: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
});

export const itemSchema = z.object({
  producto: z.string().min(1, "Seleccione un producto"),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  precio: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

export const metodoEntregaSchema = z.object({
  tipo: z.enum(["delivery", "pickup"], {
    required_error: "Seleccione un método de entrega",
  }),
  direccion: z.string().optional().nullable(),
  transportista: z.string().min(1, "Seleccione un transportista"),
  shippingCost: z
    .number()
    .min(0, "El costo de envío debe ser mayor o igual a 0"),
  fechaEntrega: z.object({
    inicio: z.string().min(1, "Seleccione una fecha de inicio"),
    fin: z.string().min(1, "Seleccione una fecha de fin"),
  }),
});

export const metodoPagoItemSchema = z.object({
  tipo: z.enum(["efectivo", "tarjeta", "transferencia"], {
    required_error: "Seleccione un método de pago",
  }),
  monto: z.number().min(0, "El monto debe ser mayor o igual a 0"),
});

export const metodoPagoSchema = z.object({
  metodos: z
    .array(metodoPagoItemSchema)
    .min(1, "Debe seleccionar al menos un método de pago"),
});

export const pedidoSchema = z.object({
  cliente: clienteSchema,
  items: z.array(itemSchema).min(1, "Debe agregar al menos un item"),
  metodoEntrega: metodoEntregaSchema,
  metodoPago: metodoPagoSchema,
});

export type Cliente = z.infer<typeof clienteSchema>;
export type Item = z.infer<typeof itemSchema>;
export type MetodoEntrega = z.infer<typeof metodoEntregaSchema>;
export type MetodoPagoItem = z.infer<typeof metodoPagoItemSchema>;
export type MetodoPago = z.infer<typeof metodoPagoSchema>;
export type Pedido = z.infer<typeof pedidoSchema>;

export interface NuevoPedidoItem {
  id: string;
  producto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface NuevoPedidoCliente {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface NuevoPedidoEntrega {
  fecha: string;
  horario: string;
  instrucciones?: string;
}

export interface NuevoPedido {
  cliente: NuevoPedidoCliente;
  items: NuevoPedidoItem[];
  entrega: NuevoPedidoEntrega;
  estado: PedidoStatus;
  prioridad: number;
  notas?: string;
}

export interface NuevoPedidoStore {
  pedido: NuevoPedido | null;
  setPedido: (pedido: NuevoPedido | null) => void;
  setCliente: (cliente: NuevoPedidoCliente) => void;
  addItem: (item: NuevoPedidoItem) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<NuevoPedidoItem>) => void;
  setEntrega: (entrega: NuevoPedidoEntrega) => void;
  setPrioridad: (prioridad: number) => void;
  setNotas: (notas: string) => void;
  reset: () => void;
}
