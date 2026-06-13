// src/hooks/useFetchProducts.ts
import { useEffect, useState, useCallback } from "react";
import { fetchProductsAPI } from "@/api/api";
import { useProductsStore } from "@/features/products/stores/lista-products";
import { PagedProducts } from "@/features/products/types/lista-stock";

export function useFetchProducts() {
  const { products, page, totalPages, totalItems, filters, setProducts } =
    useProductsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp: PagedProducts = await fetchProductsAPI(filters);
      setProducts(resp); // ↍ pasa products + meta
    } catch (e) {
      console.error("❌ Error fetchProducts:", e);
      setError("Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  }, [filters, setProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* Devuelve también la info de paginación para el componente de UI */
  return {
    products,
    page,
    totalPages,
    totalItems,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}
