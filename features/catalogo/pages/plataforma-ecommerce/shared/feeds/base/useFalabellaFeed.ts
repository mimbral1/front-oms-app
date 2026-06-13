// features/catalogo/pages/plataforma-ecommerce/shared/feeds/base/useFalabellaFeed.ts
//
// Hook de polling del estado de un feed Falabella. Port del legacy
// pim-service/Plataforma_Marketplace/src/features/feeds/useFalabellaFeed.ts,
// adaptado a OMS: usa `useFetchWithAuthPim` (JWT + x-plataforma-id + base
// URL_PIM_SERVICE) en vez de `fetch` directo.
//
// Pollea cada FEED_POLL_MS hasta que el feed se resuelve (isFeedResolved).
// Limpia el timer en unmount / cambio de feedId. En error reintenta con backoff
// x2 (no rompe la card — el worker del backend puede tardar en resolver).

"use client";

import { useEffect, useState } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import {
  FEED_POLL_MS,
  feedEndpoint,
  isFeedResolved,
  type FalabellaFeed,
} from "./feed-status";

interface FeedEnvelope {
  ok?: boolean;
  result?: FalabellaFeed;
  data?: FalabellaFeed;
}

export function useFalabellaFeed(feedId: string | undefined | null, mockData?: FalabellaFeed) {
  const { fetchWithAuthPim } = useFetchWithAuthPim();
  const [data, setData] = useState<FalabellaFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mockData) {
      setData(mockData);
      setError(null);
      return undefined;
    }
    if (!feedId) return undefined;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const json = await fetchWithAuthPim<FeedEnvelope>(feedEndpoint(feedId as string));
        if (cancelled) return;
        const next = json?.result ?? json?.data ?? null;
        setData(next);
        setError(null);
        if (next && !isFeedResolved(next)) {
          timer = setTimeout(tick, FEED_POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        // Backoff x2 en error de red — el backend puede estar resolviendo aún.
        timer = setTimeout(tick, FEED_POLL_MS * 2);
      }
    }

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [feedId, mockData, fetchWithAuthPim]);

  return { data, error };
}
