"use client";

import { useState, useEffect, useCallback } from "react";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { useOlasStore } from "@/features/olas/stores/olas";
import { OlaPicking } from "@/features/olas/types/olas";

interface ApiWave {
  displayId: string;
  pickingPoint?: { id?: string; name?: string; label?: string } | null;
  dateStart: string;
  dateEnd: string;
  pedidos?: [number, number] | number[];
  items?: [number, number] | number[];
  bloqueada: boolean;
  status: string;
}

interface ApiWavesResponse {
  page: number;
  pageSize: number;
  total: number;
  data: ApiWave[];
}

const mapWaveStatus = (status: string): OlaPicking["status"] => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "pending") return "Pendiente";
  if (normalized === "in_progress" || normalized === "in progress") return "En curso";
  if (normalized === "completed" || normalized === "finished") return "Finalizada";

  return "Pendiente";
};

const mapApiWaveToOla = (wave: ApiWave): OlaPicking => ({
  id: wave.displayId,
  pickingPoint: wave.pickingPoint?.name || "-",
  fechaInicio: wave.dateStart,
  fechaFin: wave.dateEnd,
  pedidos: {
    actual: Number(wave.pedidos?.[0] ?? 0),
    total: Number(wave.pedidos?.[1] ?? 0),
  },
  items: {
    actual: Number(wave.items?.[0] ?? 0),
    total: Number(wave.items?.[1] ?? 0),
  },
  bloqueada: Boolean(wave.bloqueada),
  status: mapWaveStatus(wave.status),
});

export const useFetchOlas = () => {
  const { olas, setOlas } = useOlasStore();
  const { fetchWithAuthQA } = useFetchWithAuthQA();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOlas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuthQA<ApiWavesResponse>(
        "picking-service/waves?page=1&pageSize=200",
        { method: "GET" }
      );

      if (!Array.isArray(response?.data)) {
        throw new Error("La API no devolvió datos válidos de olas");
      }

      setOlas(response.data.map(mapApiWaveToOla));
    } catch (err) {
      setError("Error al cargar las olas");
      console.error("Error en fetchOlas:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuthQA, setOlas]);

  useEffect(() => {
    fetchOlas();
  }, [fetchOlas]);

  return { olas, isLoading, error, refetch: fetchOlas };
};
