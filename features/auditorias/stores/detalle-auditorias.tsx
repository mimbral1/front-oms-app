import { BultosItem, BultosItemsState } from "@/features/pedidos/types/detalle-pedido";
import { create } from "zustand";

// Crea el store con los tipos adecuados

export const useAuditoriaItemsStore = create<BultosItemsState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  setItems: (items: BultosItem[]) => set({ items }), // Tipado de setItems
  setLoading: (isLoading: boolean) => set({ isLoading }), // Tipado de setLoading
  setError: (error: string | null) => set({ error }), // Tipado de setError
}));
