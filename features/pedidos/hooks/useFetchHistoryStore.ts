import { useEffect } from "react";
import { useHistoryStore } from "@/features/pedidos/stores/detalle-pedidos";
import { fetchHistorialPedidoAPI } from "@/api/api";

export const useFetchHistorialPedido = (pedidoId: string) => {
  const { setControls, setEvents, setLoading, setError } = useHistoryStore();

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!pedidoId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchHistorialPedidoAPI(pedidoId);

        if (data) {
          setControls(data.controls);
          setEvents(data.events);
        }
      } catch (err) {
        setError("Error al cargar el historial");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [pedidoId, setControls, setEvents, setLoading, setError]);

  return useHistoryStore();
};
