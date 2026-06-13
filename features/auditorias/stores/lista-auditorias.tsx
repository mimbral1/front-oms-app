import { create } from "zustand";
import { AuditoriasStore } from "@/features/auditorias/types/auditorias";

export const useAuditoriasStore = create<AuditoriasStore>((set) => ({
  auditorias: [],
  filters: {
    id: "",
    entidad: "",
    refId: "",
    idEntidad: "",
  },
  setAuditorias: (auditorias) => set({ auditorias }),
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
}));
