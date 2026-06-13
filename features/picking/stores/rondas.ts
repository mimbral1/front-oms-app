import { create } from "zustand";
import { RondaPicking, PickingFilters } from "@/features/picking/types/rondas";

interface PickingStore {
  rondas: RondaPicking[];
  filters: PickingFilters;
  setFilters: (filters: Partial<PickingFilters>) => void;
  setRondas: (rondas: RondaPicking[]) => void;
}

export const usePickingStore = create<PickingStore>((set) => ({
  rondas: [],
  filters: {
    pickingPoint: "",
    picker: "",
    status: "",
  },
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  setRondas: (rondas) => set({ rondas }),
}));
