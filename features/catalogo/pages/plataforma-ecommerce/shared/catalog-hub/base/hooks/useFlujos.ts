// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/hooks/useFlujos.ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { useCatalogHubApi } from "../api/catalog-hub-api";
import type { Flujo, Cupo } from "../types/flujo-types";

export interface UseFlujosReturn {
  flujos: Flujo[];
  cupo: Cupo;
  busy: boolean;
  error: string | null;
  reload: () => Promise<void>;
  crear: (p: { nombre: string; descripcion?: string | null; n3_id?: string | null }) => Promise<Flujo>;
  editar: (id: number, p: { nombre?: string; descripcion?: string | null }) => Promise<void>;
  pausar: (id: number) => Promise<void>;
  reanudar: (id: number) => Promise<void>;
  eliminar: (id: number) => Promise<void>;
}

export function useFlujos(): UseFlujosReturn {
  const api = useCatalogHubApi();
  const [flujos, setFlujos] = useState<Flujo[]>([]);
  const [cupo, setCupo] = useState<Cupo>({ activos: 0, max: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setBusy(true); setError(null);
    try { const r = await api.listFlujos(); setFlujos(r.flujos); setCupo(r.cupo); }
    catch (e) { setError((e as Error)?.message ?? "Error cargando los flujos"); }
    finally { setBusy(false); }
  }, [api]);

  useEffect(() => { void reload(); }, [reload]);

  const crear = useCallback(async (p: { nombre: string; descripcion?: string | null; n3_id?: string | null }) => { const f = await api.crear(p); await reload(); return f; }, [api, reload]);
  const editar = useCallback(async (id: number, p: { nombre?: string; descripcion?: string | null }) => { await api.editar(id, p); await reload(); }, [api, reload]);
  const pausar = useCallback(async (id: number) => { await api.pausar(id); await reload(); }, [api, reload]);
  const reanudar = useCallback(async (id: number) => { await api.reanudar(id); await reload(); }, [api, reload]);
  const eliminar = useCallback(async (id: number) => { await api.eliminar(id); await reload(); }, [api, reload]);

  return { flujos, cupo, busy, error, reload, crear, editar, pausar, reanudar, eliminar };
}
