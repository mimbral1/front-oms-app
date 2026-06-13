import { useEffect, useState, useCallback } from "react";
import { useAuditoriasStore } from "@/features/auditorias/stores/lista-auditorias";
import { fetchAuditoriasAPI } from "@/api/api";

export const useFetchAuditorias = () => {
  const { auditorias, setAuditorias, filters } = useAuditoriasStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditorias = useCallback(async () => {
    console.log("Fetching auditorias...");

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAuditoriasAPI();
      //console.log("✅ API Response:", data);
      if (!data || !Array.isArray(data)) {
        throw new Error("La API no devolvió una lista válida");
      }

      // Aplicar filtros antes de guardar en Zustand
      const filteredData = data.filter((auditoria) => {
        return (
          (!filters.id || auditoria.id.includes(filters.id)) &&
          (!filters.entidad ||
            auditoria.entidad
              .toLowerCase()
              .includes(filters.entidad.toLowerCase())) &&
          (!filters.refId || auditoria.refId === filters.refId) &&
          (!filters.idEntidad || auditoria.idEntidad === filters.idEntidad)
        );
      });

      //console.log("🎯 Auditorias filtradas:", filteredData);
      setAuditorias(filteredData);
    } catch (err) {
      setError("Error al cargar Auditorias");
      console.error("❌ Error en fetchAuditorias:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setAuditorias]);

  // Llamar `fetchAuditorias` cuando el componente se monta
  useEffect(() => {
    fetchAuditorias();
  }, [filters]);

  return { auditorias, isLoading, error, refetch: fetchAuditorias };
};
