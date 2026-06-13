import { useEffect, useState } from "react";
import { fetchRondaApi } from "@/api/api";
import { useDetalleRonda } from "@/features/picking/stores/detalle-rondas";
import { RondaPicking } from "@/features/picking/types/rondas";

export const useFetchRonda = (rondaId: string, waveID: string) => {
  const { ronda, setRonda /*, clearPedido*/ } = useDetalleRonda();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rondaId) return;

    if (ronda?.id === rondaId) {
      setIsLoading(false);
      return;
    }

    const fetchRonda = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data: RondaPicking | null = await fetchRondaApi(rondaId, waveID);
        if (!data) {
          setError("No se encontro detalles de la ronda");
          return;
        }
        console.log("Desde el usefetch de rondas: ", data);

        setRonda(data); // ✅ Ya no es necesario transformar `DetallePedido` a `Order`
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Error al cargar la ronda");
          console.error(err.message);
        } else {
          setError("Error desconocido");
          console.error("Error desconocido", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRonda();
    /*
    return () => {
      clearPedido();
    };*/
  }, [ronda?.id, rondaId, setRonda, waveID /*clearPedido*/]);

  return { ronda, isLoading, error };
};
