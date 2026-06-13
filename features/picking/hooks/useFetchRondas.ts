import { useState, useEffect, useCallback } from "react";
import { usePickingStore } from "@/features/picking/stores/rondas";
import { fetchRondasAPI } from "@/api/api";

export const useFetchRondas = () => {
  const { rondas, setRondas, filters } = usePickingStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRondas = useCallback(async () => {
    console.log("🔄 Fetching Rondas...");
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchRondasAPI();

      if (!data || !Array.isArray(data)) {
        throw new Error("La API no retornó valores válidos");
      }

      // Filtrar datos según los filtros actuales
      const filteredData = data.filter((ronda) => {
        return (
          (!filters.pickingPoint ||
            ronda.pickingPoint
              .toLowerCase()
              .includes(filters.pickingPoint.toLowerCase())) &&
          (!filters.picker ||
            ronda.picker
              .toLowerCase()
              .includes(filters.picker.toLowerCase())) &&
          (!filters.status || ronda.status === filters.status)
        );
      });

      console.log("✅ Rondas obtenidas:", filteredData);
      setRondas(filteredData);
    } catch (err) {
      setError("❌ Error al cargar rondas");
      console.error("⚠ï¸‍ Error en fetchRondas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setRondas]); // 🔹 Asegurar que `setRondas` y `filters` estén en las dependencias.

  // 🔹 Asegurar que `fetchRondas` se ejecuta en montaje y cada vez que `filters` cambie.
  useEffect(() => {
    fetchRondas();
  }, [fetchRondas]);

  return { rondas, isLoading, error, refetch: fetchRondas };
};
