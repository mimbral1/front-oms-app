// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/hooks/useDashboard.ts
//
// Hook simple para cargar el dashboard. No hace polling automático — el
// usuario puede refrescar con el botón "Refrescar" en el chrome.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDashboardApi } from "../api/dashboard-api";
import type { DashboardResponse } from "../types/dashboard-types";

export interface UseDashboardReturn {
    data: DashboardResponse | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
    const api = useDashboardApi();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reqIdRef = useRef(0);

    const refresh = useCallback(async () => {
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get();
            if (reqIdRef.current !== reqId) return;
            setData(res);
        } catch (e) {
            if (reqIdRef.current !== reqId) return;
            setError((e as Error)?.message ?? "Error cargando dashboard");
        } finally {
            if (reqIdRef.current === reqId) setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, loading, error, refresh };
}
