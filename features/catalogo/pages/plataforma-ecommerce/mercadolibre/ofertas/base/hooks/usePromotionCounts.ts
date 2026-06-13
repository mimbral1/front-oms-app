"use client";
import { useCallback, useEffect, useState } from "react";
import { useOfertasApi } from "../api/ofertas-api";
import type { MLPromotionType } from "../types/oferta-types";

export interface PromotionCounts {
    active: number | null;
    paused: number | null;
    candidate: number | null;
    inscritos: number;
}

export function usePromotionCounts(
    promoId: string | null | undefined,
    type: MLPromotionType | null | undefined,
) {
    const api = useOfertasApi();
    const [counts, setCounts] = useState<PromotionCounts | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!promoId || !type) { setCounts(null); return; }
        setLoading(true); setError(null);
        try {
            setCounts(await api.getPromotionCounts(promoId, type));
        } catch (e) {
            setError((e as Error)?.message ?? "Error al cargar los conteos");
        } finally {
            setLoading(false);
        }
    }, [api, promoId, type]);

    useEffect(() => { void reload(); }, [reload]);

    return { counts, loading, error, reload };
}
