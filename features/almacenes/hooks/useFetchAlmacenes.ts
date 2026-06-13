import { useEffect, useState, useCallback } from "react";
import { useWarehouseStore } from "@/features/almacenes/stores/lista-almacenes";
import { fetchWarehouseAPI } from "@/api/api";

export const useFetchWarehouse = () => {
  const { warehouse, setWarehouse, filters } = useWarehouseStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouse = useCallback(async () => {
    console.log("Fetching almacenes...");

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWarehouseAPI();
      // console.log("✅ API Response Warehouse:", data);
      if (!data || !Array.isArray(data)) {
        throw new Error("La API no devolvió una lista válida");
      }

      // Aplicar filtros antes de guardar en Zustand
      const filteredData = data.filter((warehouse) => {
        return (
          (!filters.id || String(warehouse.id).includes(filters.id)) &&
          (!filters.nombre ||
            warehouse.nombre
              ?.toLowerCase()
              .includes(filters.nombre.toLowerCase())) &&
          (!filters.ubicacion ||
            warehouse.ubicacion
              ?.toLowerCase()
              .includes(filters.ubicacion.toLowerCase())) &&
          (!filters.fechaCreacion ||
            warehouse.fechaCreacion?.startsWith(filters.fechaCreacion)) &&
          (!filters.status || warehouse.status === filters.status)
        );
      });

      //console.log("🎯 Auditorias filtradas:", filteredData);
      setWarehouse(filteredData);
    } catch (err) {
      setError("Error al cargar Auditorias");
      console.error("❌ Error en fetchAuditorias:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setWarehouse]);

  // Llamar `fetchAuditorias` cuando el componente se monta
  useEffect(() => {
    fetchWarehouse();
  }, [filters]);

  return { warehouse, isLoading, error, refetch: fetchWarehouse };
};
