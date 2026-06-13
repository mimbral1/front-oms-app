// /stores/ordersOlas.ts

import { create } from "zustand";
import { ApiOrder, OrderFilters } from "@/features/olas/types/olas";

interface OrdersStore {
  orders: ApiOrder[];
  filters: OrderFilters;
  setOrders: (orders: ApiOrder[]) => void;
  setFilters: (filters: Partial<OrderFilters>) => void;
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  // Estado inicial
  orders: [],
  filters: {
    searchTerm: "",
  },

  // Mutaciones
  setOrders: (orders) => set({ orders }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
