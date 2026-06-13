import { create } from "zustand";
import {
  Cliente,
  Item,
  MetodoEntrega,
  MetodoPago,
} from "@/features/pedidos/types/nuevo-pedido";
import {
  NuevoPedidoStore,
  NuevoPedido,
  NuevoPedidoCliente,
  NuevoPedidoItem,
} from "@/features/pedidos/types/nuevo-pedido";

interface PedidoStore {
  // Estado
  cliente: Partial<Cliente>;
  items: Item[];
  metodoEntrega: Partial<MetodoEntrega>;
  metodoPago: Partial<MetodoPago>;
  errors: Record<string, string[]>;
  isSubmitting: boolean;

  // Acciones
  setCliente: (cliente: Partial<Cliente>) => void;
  addItem: (item: Item) => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, item: Item) => void;
  setMetodoEntrega: (metodo: Partial<MetodoEntrega>) => void;
  setMetodoPago: (metodo: Partial<MetodoPago>) => void;
  setErrors: (errors: Record<string, string[]>) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
}

const initialState: NuevoPedido = {
  cliente: {
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  },
  items: [],
  entrega: {
    fecha: "",
    horario: "",
  },
  estado: "Pendiente",
  prioridad: 1,
};

export const useNuevoPedidoStore = create<
  NuevoPedidoStore & {
    errors: Record<string, string[]>;
    isSubmitting: boolean;
    metodoPago: MetodoPago;
    metodoEntrega: MetodoEntrega;
    items: NuevoPedidoItem[];
    cliente: NuevoPedidoCliente;
    setErrors: (errors: Record<string, string[]>) => void;
    setIsSubmitting: (isSubmitting: boolean) => void;
    setMetodoPago: (metodoPago: MetodoPago) => void;
    setMetodoEntrega: (metodoEntrega: MetodoEntrega) => void;
  }
>((set) => ({
  pedido: null,
  errors: {},
  isSubmitting: false,
  metodoPago: { metodos: [] },
  metodoEntrega: {
    tipo: "delivery",
    transportista: "",
    shippingCost: 0,
    fechaEntrega: { inicio: "", fin: "" },
    direccion: "",
  },
  items: [],
  cliente: {
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  },
  setPedido: (pedido) => set({ pedido }),
  setCliente: (cliente) =>
    set((state) => ({
      pedido: state.pedido ? { ...state.pedido, cliente } : null,
    })),
  addItem: (item) =>
    set((state) => ({
      pedido: state.pedido
        ? { ...state.pedido, items: [...state.pedido.items, item] }
        : null,
    })),
  removeItem: (itemId) =>
    set((state) => ({
      pedido: state.pedido
        ? {
            ...state.pedido,
            items: state.pedido.items.filter((item) => item.id !== itemId),
          }
        : null,
    })),
  updateItem: (itemId, updates) =>
    set((state) => ({
      pedido: state.pedido
        ? {
            ...state.pedido,
            items: state.pedido.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          }
        : null,
    })),
  setEntrega: (entrega) =>
    set((state) => ({
      pedido: state.pedido ? { ...state.pedido, entrega } : null,
    })),
  setPrioridad: (prioridad) =>
    set((state) => ({
      pedido: state.pedido ? { ...state.pedido, prioridad } : null,
    })),
  setNotas: (notas) =>
    set((state) => ({
      pedido: state.pedido ? { ...state.pedido, notas } : null,
    })),
  setErrors: (errors) => set({ errors }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setMetodoPago: (metodoPago) => set({ metodoPago }),
  setMetodoEntrega: (metodoEntrega) => set({ metodoEntrega }),
  reset: () => set({ pedido: null, errors: {} }),
}));
