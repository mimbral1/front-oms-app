import { create } from "zustand";
import { DeliveryStore, DeliveryFilters } from "@/features/delivery/types/delivery";

const initialFilters: DeliveryFilters = {
  fechaDesde: "",
  fechaHasta: "",
  estado: "",
  transportista: "",
};

export const useDeliveryStore = create<DeliveryStore>((set) => ({
  envios: [],
  rutas: [],
  transportistas: [],
  filters: initialFilters,
  setEnvios: (envios) => set({ envios }),
  setRutas: (rutas) => set({ rutas }),
  setTransportistas: (transportistas) => set({ transportistas }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
