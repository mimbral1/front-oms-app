// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/hooks/usePublishActivity.ts
//
// Actividad de publicación para el dashboard (estado actual + eventos de hoy).
// Polling suave (default 60s) porque es un panel de monitoreo, no un detalle.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBitacoraApi } from "../api/bitacora-api";
import type { PublishActivity } from "../types/bitacora-types";

const DEFAULT_POLL_MS = 60_000;

export interface UsePublishActivityReturn {
    activity: PublishActivity | null;
    loading: boolean;
    refresh: () => void;
}

export function usePublishActivity(
    { enabled = true, accountId, pollMs = DEFAULT_POLL_MS }: { enabled?: boolean; accountId?: number; pollMs?: number } = {},
): UsePublishActivityReturn {
    const api = useBitacoraApi();
    const [activity, setActivity] = useState<PublishActivity | null>(null);
    const [loading, setLoading] = useState<boolean>(enabled);
    const aliveRef = useRef(true);

    const load = useCallback(async () => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const data = await api.fetchPublishActivity({ accountId, recentLimit: 20 });
        if (!aliveRef.current) return;
        setActivity(data);
        setLoading(false);
    }, [api, enabled, accountId]);

    useEffect(() => {
        aliveRef.current = true;
        setLoading(enabled);
        void load();
        return () => {
            aliveRef.current = false;
        };
    }, [load, enabled]);

    useEffect(() => {
        if (!enabled || !pollMs) return;
        const t = setInterval(() => void load(), pollMs);
        return () => clearInterval(t);
    }, [enabled, pollMs, load]);

    return { activity, loading, refresh: () => void load() };
}
