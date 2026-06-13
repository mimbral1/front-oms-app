"use client";
import { useState } from "react";
//import { PickerUserConfig } from "@/features/picking/types/users";
import { PickerUserConfig } from "@/features/picking/pages/PickingView/configuraciones/Nuevo/NewPicker";
// import { createPickerAPI } from "@/api/api";
// import { CreatePickerResponse } from "@/api/api";
import { usePickersStore } from "@/features/picking/stores/picker-store";

// Si quieres conservar esta interfaz, la replicas:
interface CreatePickerResponse {
  success: boolean;
  data: PickerUserConfig;
}

/**
 * Hook encargado de crear un nuevo picker.
 * Expone:
 *  - createPicker: la función que, por ahora, guarda en el store de Zustand
 *  - loading: estado de carga
 *  - error: último error producido
 */
export function useCreatePicker() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Tomamos la función addPicker del store
  const addPicker = usePickersStore((state) => state.addPicker);

  async function createPicker(
    picker: PickerUserConfig
  ): Promise<CreatePickerResponse | undefined> {
    try {
      setLoading(true);
      setError(null);

      // COMENTAMOS la conexión al endpoint real:
      // const result = await createPickerAPI(picker);
      // return result;

      // Usamos en su lugar el store de Zustand:
      addPicker(picker);

      // Retornamos un objeto de ejemplo con éxito simulado
      const fakeResponse: CreatePickerResponse = {
        success: true,
        data: picker,
      };
      return fakeResponse;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { createPicker, loading, error };
}
