// src/stores/lista-products.ts
import { create } from "zustand";
import { shallow } from "zustand/shallow"; // ➜ npm i zustand   (ya lo tienes)
import { ProductsStore, ProductFilters } from "@/features/products/types/lista-stock";

export const useProductsStore = create<ProductsStore>()((set, get) => ({
  /* ---------- datos ---------- */
  products: [],
  page: 1,
  totalPages: 0,
  totalItems: 0,

  /* ---------- filtros ---------- */
  filters: {
    page: 1,
    query: "",
    activo: "", // "Y" | "N" | ""
    id_almacen: "",
  },

  /* ---------- acciones ---------- */
  setProducts: (payload) =>
    set(() => ({
      products: payload.products,
      page: payload.page,
      totalPages: payload.totalPages,
      totalItems: payload.totalItems,
    })),

  setFilters: (partial: Partial<ProductFilters>) =>
    set((state) => {
      const next = { ...state.filters, ...partial };
      // evita generar un nuevo objeto si nada cambió
      return shallow(state.filters, next) ? state : { filters: next };
    }),
}));
