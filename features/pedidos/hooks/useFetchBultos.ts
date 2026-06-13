import { useEffect } from "react";
import { useBultosStore } from "@/features/pedidos/stores/detalle-pedidos"; // IMPORTACIÓN CORRECTA
// import { bultosMock } from "@/data/mocks/detalle-pedido";
import { fetchBundleAPI } from "@/api/api";
import { Bulto } from "@/features/pedidos/types/detalle-pedido";

export function useFetchBultos(pedidoId: string) {
  const { setBultos, setLoading, setError } = useBultosStore();

  useEffect(() => {
    if (!pedidoId) return;
    async function fetchBultos() {
      setLoading(true);
      setError(null);
      try {
        // Simula la carga de datos filtrados por pedidoId
        const data: Bulto[] = await fetchBundleAPI(pedidoId);
        console.log("Data de los Bultos por id: ", data);
        setBultos(data);
        console.log(data);
      } catch (error) {
        setError("Error al obtener los bultos.");
      } finally {
        setLoading(false);
      }
    }

    if (pedidoId) {
      fetchBultos();
    }
  }, [pedidoId, setBultos, setLoading, setError]);
}
