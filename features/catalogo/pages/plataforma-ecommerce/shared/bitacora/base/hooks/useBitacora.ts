// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/hooks/useBitacora.ts
//
// Carga la bitácora de un SKU. Pollea mientras haya eventos "en vuelo" (último
// estado ENCOLADO/FEED_ENVIADO → esperando a Falabella), porque el desenlace
// (SINCRONIZADO/RECHAZADO) lo descubre el worker de FeedStatus minutos después.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBitacoraApi } from "../api/bitacora-api";
import type { BitacoraEntry } from "../types/bitacora-types";

const IN_FLIGHT = new Set(["ENCOLADO", "FEED_ENVIADO"]);
const DEFAULT_POLL_MS = 15_000;

export interface UseBitacoraReturn {
    entries: BitacoraEntry[];
    loading: boolean;
    /** Hay al menos un evento esperando desenlace de Falabella. */
    pending: boolean;
    refresh: () => void;
}

export function useBitacora(
    sku: string | null | undefined,
    { autoPoll = true, pollMs = DEFAULT_POLL_MS }: { autoPoll?: boolean; pollMs?: number } = {},
): UseBitacoraReturn {
    const api = useBitacoraApi();
    const [entries, setEntries] = useState<BitacoraEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(Boolean(sku));
    const aliveRef = useRef(true);

    const load = useCallback(async () => {
        if (!sku) {
            setEntries([]);
            setLoading(false);
            return;
        }
        const data = await api.fetchBitacora(sku, { limit: 100 });
        if (!aliveRef.current) return;
        setEntries(data);
        setLoading(false);
    }, [api, sku]);

    useEffect(() => {
        aliveRef.current = true;
        setLoading(Boolean(sku));
        void load();
        return () => {
            aliveRef.current = false;
        };
    }, [load, sku]);

    // El evento más reciente es el primero (orden DESC del backend).
    const pending = entries.length > 0 && IN_FLIGHT.has(String(entries[0]?.event_type ?? ""));

    useEffect(() => {
        if (!autoPoll || !sku || !pending) return;
        const t = setInterval(() => void load(), pollMs);
        return () => clearInterval(t);
    }, [autoPoll, sku, pending, pollMs, load]);

    return { entries, loading, pending, refresh: () => void load() };
}
