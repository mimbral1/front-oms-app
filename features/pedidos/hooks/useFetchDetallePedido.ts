import { useEffect, useState } from "react";
import { useDetallePedidoStore } from "@/features/pedidos/stores/detalle-pedidos";
import { fetchDetallePedidoAPI } from "@/api/api";
import { Order } from "@/features/pedidos/types/detalle-pedido";

export const useFetchDetallePedido = (pedidoId: string) => {
  const { pedido, setPedido /*, clearPedido*/ } = useDetallePedidoStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //console.log("usefetchdetallePedido");

  useEffect(() => {
    if (!pedidoId) return;

    if (pedido?.id === pedidoId) {
      setIsLoading(false);
      return;
    }

    const fetchPedido = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data: Order | null = await fetchDetallePedidoAPI(pedidoId);

        if (!data) {
          setError("No se encontró el pedido");
          return;
        }

        setPedido(data); // Ya no es necesario transformar `DetallePedido` a `Order`
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Error al cargar el pedido");
          console.error(err.message);
        } else {
          setError("Error desconocido");
          console.error("Error desconocido", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPedido();
    /*
    return () => {
      clearPedido();
    };*/
  }, [pedidoId, setPedido /*clearPedido*/]);

  return { pedido, isLoading, error };
};
