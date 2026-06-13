import { useEffect, useState, useCallback } from "react";
import { usePickersStore } from "@/features/picking/stores/lista-pickers";
import { fetchAllPickersAPI } from "@/api/api";
import { Picker } from "@/features/picking/types/pickers";

export const useFetchPickers = () => {
  const { pickers, setPickers, filters } = usePickersStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPickers = useCallback(async () => {
    console.log("Fetching Pickers...");
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllPickersAPI();
      // console.log("✅ API Response picker:", data);
      if (!data || !Array.isArray(data)) {
        throw new Error("La API no devolvió una lista válida");
      }

      // Aplicar filtros antes de guardar en Zustand
      const filteredData: Picker[] = data.filter((p) => {
        return (
          // rut es number en Picker, filters.rut es string
          (!filters.rut || String(p.rut).includes(filters.rut)) &&
          // name
          (!filters.name ||
            p.name.toLowerCase().includes(filters.name.toLowerCase())) &&
          // email
          (!filters.email ||
            p.email.toLowerCase().includes(filters.email.toLowerCase())) &&
          // statusName
          (!filters.statusName || p.statusName === filters.statusName)
        );
      });

      //console.log("🎯 Auditorias filtradas:", filteredData);
      setPickers(filteredData);
    } catch (err) {
      setError("Error al cargar Auditorias");
      console.error("❌ Error en fetchAuditorias:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setPickers]);

  // Llamar `fetchAuditorias` cuando el componente se monta
  useEffect(() => {
    fetchPickers();
  }, [filters]);

  return { pickers, isLoading, error, refetch: fetchPickers };
};

// src/data/types/auditoria.ts
/* export interface Picker {
  img: string;
  rut: number;
  name: string;
  email: string;
  roleName: string;
  location: string;
  picking: number;
  emp: string;
  statusID: number;
  statusName: string;
  user_created: number;
  createdAt: Date;
  updateAt: Date;
}

export type PickerStatus = "Activo" | "Inactivo";

export interface PickerFilters {
  rut: string;
  name: string;
  email: string;
  statusName: string;
}

export interface PickersStore {
  pickers: Picker[];
  filters: PickerFilters;
  setAuditorias: (auditorias: Picker[]) => void;
  setFilters: (filters: Partial<PickerFilters>) => void;
} */
