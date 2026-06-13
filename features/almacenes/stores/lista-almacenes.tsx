import { create } from "zustand";
import { WarehouseStore } from "@/features/almacenes/types/almacenes";

export const useWarehouseStore = create<WarehouseStore>((set) => ({
  warehouse: [],
  filters: {
    id: "",
    nombre: "",
    ubicacion: "",
    fechaCreacion: "",
    status: "",
  },
  setWarehouse: (warehouse) => set({ warehouse }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
}));
