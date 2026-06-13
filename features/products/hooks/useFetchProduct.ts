// src/hooks/useProductDetail.ts
import { useState, useEffect } from "react";
import { fetchProductsAPI } from "@/api/api";
import { Product } from "@/features/products/types/lista-stock";

export function useProductDetail(query: string, idAlmacen: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { products } = await fetchProductsAPI({
          page: 1,
          query,
          id_almacen: idAlmacen.toString(),
        });
        setProduct(products[0] ?? null);
      } catch (e) {
        console.error(e);
        setError("No se pudo obtener el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [query, idAlmacen]);

  return { product, loading, error };
}
