import { useEffect, useState } from "react";
import { useAuditoriaItemsStore } from "@/features/auditorias/stores/detalle-auditorias"; //  Asegúrate de que la importación sea correcta
import { fetchItemsAuditoriaAPI } from "@/api/api";
import { BultosItem } from "@/features/pedidos/types/detalle-pedido";

export const useFetchItemsAuditoria = (bultoId: string) => {
  const { items, setItems, setLoading, setError } = useAuditoriaItemsStore(); // Accede al store Zustand
  const [isLoading, setIsLoadingState] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);

  // Verifica si bultoId no está  presente
  if (!bultoId) {
    console.log("bultoId es nulo o vacío");
    return { items: [], isLoading: false, error: "No hay bultoId" }; // Devuelve una respuesta vacía
  }

  useEffect(() => {
    if (!bultoId) return;

    const fetchItems = async () => {
      setIsLoadingState(true);
      setLoading(true);
      setErrorState(null);
      setError(null);

      try {
        // Llamada a la API para obtener los items
        const data: BultosItem[] = await fetchItemsAuditoriaAPI(bultoId);
        setItems(data); // Actualiza el estado en el store con los datos recibidos
      } catch (err) {
        setErrorState("Error al cargar los items del pedido");
        setError("Error al cargar los items del pedido");
        console.error(err);
      } finally {
        setIsLoadingState(false);
        setLoading(false);
      }
    };

    fetchItems(); // Ejecuta la llamada a la API
  }, [bultoId, setItems, setLoading, setError]);

  return { items, isLoading, error }; // Devuelve el estado actualizado
};
