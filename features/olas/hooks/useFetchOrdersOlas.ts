// /hooks/useFetchOrders.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchOrdersOlasAPI } from "@/api/api"; // tu función real de fetch
import { useOrdersStore } from "@/features/olas/stores/ordersOlas"; // store de Zustand
import { ApiOrder } from "@/features/olas/types/olas";

export function useFetchOrders() {
  // 1) Obtenemos `orders` y `setOrders` del store
  const { orders, setOrders } = useOrdersStore();

  // 2) Estados locales para saber si estamos cargando y si hubo error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3) Función para llamar a la API
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data: ApiOrder[] = await fetchOrdersOlasAPI();
      setOrders(data);
    } catch (err) {
      console.error("Error en fetchOrders:", err);
      setError("Error al cargar pedidos");
    } finally {
      setIsLoading(false);
    }
  }, [setOrders]);

  // 4) Llamamos a `fetchOrders` cuando se monta el componente (y si cambia la función)
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 5) Devolvemos la data, loading, error y la función para reintentar
  return { orders, isLoading, error, refetch: fetchOrders };
}
