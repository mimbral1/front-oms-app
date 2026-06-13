// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/hooks/useFlujoSync.ts
//
// Máquina de polling para un job de sincronización a ML (Pieza F):
//   start(skus, accountId) → POST /sync → poll GET /sync/:jobId cada 2500ms
//   hasta un estado terminal (done|error). Si el POST falla (p.ej. 409 porque ya
//   hay un job en curso), reengancha el último job vía GET /sync. Limpia el
//   intervalo al desmontar y expone reset() para volver al estado inicial.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCatalogHubGridApi, type SyncJobStatus } from "../api/catalog-hub-grid-api";

const POLL_MS = 2500;
const TERMINAL = new Set<SyncJobStatus["status"]>(["done", "error"]);

export interface UseFlujoSyncReturn {
  status: SyncJobStatus | null;
  busy: boolean;
  error: string | null;
  start: (skus: string[], accountId: number) => Promise<void>;
  reset: () => void;
}

export function useFlujoSync(flujoId: number | string): UseFlujoSyncReturn {
  const api = useCatalogHubGridApi();
  const [status, setStatus] = useState<SyncJobStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);
  useEffect(() => clear, [clear]);

  const poll = useCallback((jobId: number) => {
    clear();
    const tick = async () => {
      try {
        const s = await api.getSyncStatus(flujoId, jobId);
        setStatus(s);
        if (TERMINAL.has(s.status)) { setBusy(false); return; } // terminal → stop, no reschedule
      } catch (e) {
        setBusy(false);
        setError((e as Error)?.message ?? "Error consultando el estado de la sincronización");
        return; // stop on error
      }
      timer.current = setTimeout(tick, POLL_MS); // schedule next only after this one resolved
    };
    timer.current = setTimeout(tick, POLL_MS);
  }, [api, flujoId, clear]);

  const start = useCallback(async (skus: string[], accountId: number) => {
    setError(null); setBusy(true);
    try {
      const res = await api.startSync(flujoId, skus, accountId);
      setStatus({ jobId: res.jobId, status: res.status, total: res.total, done: 0, ok: 0, errors: 0, items: [], finishedAt: null });
      poll(res.jobId);
    } catch (e) {
      setBusy(false);
      // Puede ser 409 (ya hay un sync en curso) u otro error: intentamos cargar el último job.
      const latest = await api.getLatestSync(flujoId).catch(() => null);
      if (latest && !TERMINAL.has(latest.status)) {
        setStatus(latest); setBusy(true); poll(latest.jobId);
        setError("Ya hay una sincronización en curso.");
      } else {
        setError((e as Error)?.message ?? "No se pudo iniciar la sincronización");
      }
    }
  }, [api, flujoId, poll]);

  const reset = useCallback(() => { clear(); setStatus(null); setBusy(false); setError(null); }, [clear]);

  return { status, busy, error, start, reset };
}
