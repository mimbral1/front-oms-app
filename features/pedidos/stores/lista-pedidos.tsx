import { create } from "zustand";
import { PedidosStore } from "@/features/pedidos/types/lista-pedidos";

export const usePedidosStore = create<PedidosStore>((set) => ({
  pedidos: [],
  filters: {
    id: "",
    cliente: "",
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
    pickingPoint: "",
    fechaCreacion: ""
  },
  setPedidos: (pedidos) => set({ pedidos }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
}));
