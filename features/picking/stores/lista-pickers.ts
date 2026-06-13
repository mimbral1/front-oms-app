import { create } from "zustand";
import { PickersStore } from "@/features/picking/types/pickers";

export const usePickersStore = create<PickersStore>((set) => ({
  pickers: [],
  filters: {
    rut: "",
    name: "",
    email: "",
    statusName: "",
  },
  setPickers: (pickers) => set({ pickers }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
}));
