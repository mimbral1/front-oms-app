import { create } from "zustand";
import { ProductividadStore } from "@/features/picking/types/productividad";

export const useProductividadStore = create<ProductividadStore>((set) => ({
  productividad: [],
  filters: {
    picker: "",
    fechaInicio: "",
    fechaFin: "",
    pickingPoint: "",
  },
  setProductividad: (productividad) => set({ productividad }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
}));
