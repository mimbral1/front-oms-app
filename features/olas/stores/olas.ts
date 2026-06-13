import { create } from "zustand";
import { OlaPickingStore, OlaPickingFilters } from "@/features/olas/types/olas";

const initialFilters: OlaPickingFilters = {
  displayId: "",
  pickingPoint: "",
  dateRange: "",
};

export const useOlasStore = create<OlaPickingStore>((set) => ({
  olas: [],
  filters: initialFilters,
  setOlas: (olas) => set({ olas }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
