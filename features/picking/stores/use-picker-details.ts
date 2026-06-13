"use client";
import { useState, useEffect } from "react";
import { PickerUserConfig } from "@/features/picking/types/users";
// import { getPickerByRutAPI } from "@/api/pickers"; // Comentado por ahora

interface UseGetPickerReturn {
  data: PickerUserConfig | null;
  loading: boolean;
  error: Error | null;
}

export function useGetPicker(rut: string): UseGetPickerReturn {
  const [data, setData] = useState<PickerUserConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPicker() {
      try {
        setLoading(true);
        setError(null);

        // Llamada a la API real (comentada):
        // const pickerData = await getPickerByRutAPI(rut);
        // setData(pickerData);

        // Mientras el endpoint no está disponible, simulamos el resultado:
        setTimeout(() => {
          setData({
            rut: "20.565.453-4",
            name: "Marcelo",
            lastname: "Cancino",
            email: "marcelo.cancino@mimbral.cl",
            profile: "Admin",
            company: "Mimbral",
            location: "Pilar Recepción",
            carriers: ["Starken", "Chilexpress"],
            deliveryMode: "Pilar",
            sectorsAllowed: ["Yogurt", "Vino"],
            sectorsRestricted: ["Audio"], // si aplica
            avatarUrl:
              "https://caracoltv.brightspotcdn.com/dims4/default/d37486a/2147483647/strip/true/crop/380x675+346+0/resize/720x1280!/quality/75/?url=http%3A%2F%2Fcaracol-brightspot.s3.us-west-2.amazonaws.com%2F0a%2Fb7%2F2ea371384b348de6411147cd4056%2Fside-cat.png",
            createdBy: { name: "Juan Hapes", email: "juan.hapes@mimbral.cl" },
            modifiedBy: { name: "Juan Hapes", email: "juan.hapes@mimbral.cl" },
            almacen: "Pilar",
            dateCreated: "2024-04-22T12:46:52Z",
            dateModified: "2024-04-22T12:46:52Z",
            status: "Active",
          });

          setLoading(false);
        }, 500); // Simulamos 0.5s de demora
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    if (rut) {
      fetchPicker();
    } else {
      // Si no hay rut, podría haber un error o simplemente no hacer nada.
      setData(null);
      setLoading(false);
    }
  }, [rut]);

  return { data, loading, error };
}
