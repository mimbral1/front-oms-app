import { create } from "zustand";
import { FaltantesStore } from "@/features/pedidos/types/faltantes";

export const useFaltantesStore = create<FaltantesStore>((set) => ({
  faltantes: [],
  filters: {
    pedido: "",
    producto: "",
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
    prioridad: "",
  },
  setFaltantes: (faltantes) => set({ faltantes }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
  updateFaltante: (id, updates) =>
    set((state) => ({
      faltantes: state.faltantes.map((faltante) =>
        faltante.id === id ? { ...faltante, ...updates } : faltante
      ),
    })),
}));
