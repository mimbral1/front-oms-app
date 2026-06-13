// ─── Products Feature – Public API ─────────────────────────────────────────

// Hooks
export { useFetchProducts } from "./hooks/useFetchProducts";
export { useProductDetail } from "./hooks/useFetchProduct";

// Stores
export { useProductsStore } from "./stores/lista-products";

// Types
export type { Product, ProductStatus, ProductFilters, PagedProducts, ProductsStore } from "./types/lista-stock";
