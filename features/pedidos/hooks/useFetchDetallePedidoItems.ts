import { useEffect, useState } from "react";
import { useOrderItemsStore } from "@/features/pedidos/stores/detalle-pedidos";
import { fetchItemsPedidoAPI } from "@/api/api";
import { OrderItem } from "@/features/pedidos/types/detalle-pedido";

export const useFetchDetallePedidoItems = (pedidoId: string) => {
  const { items, setItems, setLoading, setError } = useOrderItemsStore();
  const [isLoading, setIsLoadingState] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (!pedidoId) return;

    const fetchItems = async () => {
      setIsLoadingState(true);
      setLoading(true);
      setErrorState(null);
      setError(null);
      try {
        const data: OrderItem[] = await fetchItemsPedidoAPI(pedidoId);
        console.log("Data de items", data);
        setItems(data);
      } catch (err) {
        setErrorState("Error al cargar los items del pedido");
        setError("Error al cargar los items del pedido");
        console.error(err);
      } finally {
        setIsLoadingState(false);
        setLoading(false);
      }
    };

    fetchItems();
  }, [pedidoId, setItems, setLoading, setError]);

  return { items, isLoading, error };
};
