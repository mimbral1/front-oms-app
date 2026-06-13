// features/catalogo/hooks/useStatusCatalogs.ts
//
// Hook que carga las lookup tables de estados desde el backend (migration 024)
// y cachea en memoria global por 5 minutos. Estos valores casi nunca cambian
// — un fetch al primer mount alcanza.
//
// Uso:
//   const { publishStatus, jobStatus, importStatus, validationStatus, loading }
//     = useStatusCatalogs();
//
//   const meta = publishStatus["synchronized"];
//   // → { code: "synchronized", labelEs: "Sincronizado", colorHex: "#28A745", ... }
//
// Patrón: un solo fetch global compartido entre todos los componentes via
// `globalCache`. No depende de React Query / SWR para mantener cero deps
// nuevas. Si necesitás invalidar (estado nuevo agregado), llamar
// `invalidateStatusCatalogs()` y el próximo render dispara refetch.

"use client";

import { useEffect, useState } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";

export interface StatusMeta {
    code: string;
    labelEs: string;
    labelEn: string | null;
    colorHex: string | null;
    iconName: string | null;
    isTerminal: boolean;
    sortOrder: number;
    description: string | null;
}

export interface StatusCatalogs {
    publishStatus: Record<string, StatusMeta>;
    jobStatus: Record<string, StatusMeta>;
    importStatus: Record<string, StatusMeta>;
    validationStatus: Record<string, StatusMeta>;
    /** Estados ML reales (active, paused, closed, under_review, etc.) — distinto
     *  del publishStatus interno del schema. Migration 030 (Item 2 follow-up). */
    itemStatus: Record<string, StatusMeta>;
}

const EMPTY_CATALOGS: StatusCatalogs = {
    publishStatus: {},
    jobStatus: {},
    importStatus: {},
    validationStatus: {},
    itemStatus: {},
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Cache global compartido entre todos los componentes que llamen el hook.
let globalCache: StatusCatalogs | null = null;
let globalCacheAt = 0;
let inflightPromise: Promise<StatusCatalogs> | null = null;
const subscribers = new Set<() => void>();

function isCacheValid(): boolean {
    return globalCache !== null && Date.now() - globalCacheAt < CACHE_TTL_MS;
}

/** Fuerza refetch en el próximo render de cualquier consumer. */
export function invalidateStatusCatalogs(): void {
    globalCache = null;
    globalCacheAt = 0;
    inflightPromise = null;
    subscribers.forEach((cb) => cb());
}

export interface UseStatusCatalogsReturn extends StatusCatalogs {
    /** True mientras se hace el fetch inicial. */
    loading: boolean;
    /** Error del fetch (network / shape inesperado). */
    error: string | null;
}

export function useStatusCatalogs(): UseStatusCatalogsReturn {
    const { fetchWithAuthPim } = useFetchWithAuthPim();
    const [catalogs, setCatalogs] = useState<StatusCatalogs>(
        () => globalCache ?? EMPTY_CATALOGS,
    );
    const [loading, setLoading] = useState<boolean>(!isCacheValid());
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Si cache válido, usar y salir.
        if (isCacheValid()) {
            setCatalogs(globalCache!);
            setLoading(false);
            return;
        }

        let mounted = true;
        const subscribe = () => {
            if (!mounted) return;
            setCatalogs(globalCache ?? EMPTY_CATALOGS);
            setLoading(false);
        };
        subscribers.add(subscribe);

        // Si ya hay un fetch en vuelo, esperar a que termine — no duplicar.
        if (!inflightPromise) {
            inflightPromise = (async () => {
                try {
                    interface Envelope { ok: boolean; data: StatusCatalogs }
                    const env = await fetchWithAuthPim<Envelope>(
                        "/api/pim/ml/status-catalogs",
                    );
                    const data = env?.data ?? EMPTY_CATALOGS;
                    globalCache = data;
                    globalCacheAt = Date.now();
                    return data;
                } catch (e) {
                    const msg = (e as Error)?.message ?? "Error cargando catálogos de estado";
                    if (mounted) setError(msg);
                    // Fallback: cache vacío pero no null, para no quedar en loop.
                    globalCache = EMPTY_CATALOGS;
                    globalCacheAt = Date.now();
                    return EMPTY_CATALOGS;
                } finally {
                    // Notificar a todos los subscribers cuando termine.
                    subscribers.forEach((cb) => cb());
                    inflightPromise = null;
                }
            })();
        }

        return () => {
            mounted = false;
            subscribers.delete(subscribe);
        };
    }, [fetchWithAuthPim]);

    return {
        ...catalogs,
        loading,
        error,
    };
}

/**
 * Helper para usar fuera de componentes React (ej. en utilidades de
 * formateo). Retorna el cache actual o EMPTY_CATALOGS si no hay nada.
 * NO hace fetch — pensado para casos donde ya sabés que `useStatusCatalogs`
 * fue llamado antes en el árbol.
 */
export function getStatusCatalogsSync(): StatusCatalogs {
    return globalCache ?? EMPTY_CATALOGS;
}

/**
 * Resuelve un estado por code. Si no existe en el catálogo (no hidratado
 * todavía o estado desconocido), devuelve un fallback con el code como label.
 */
export function resolveStatus(
    catalog: Record<string, StatusMeta>,
    code: string | null | undefined,
): StatusMeta {
    if (!code) {
        return {
            code: "",
            labelEs: "—",
            labelEn: null,
            colorHex: "#6C757D",
            iconName: null,
            isTerminal: false,
            sortOrder: 0,
            description: null,
        };
    }
    const found = catalog[code];
    if (found) return found;
    // Fallback: usar el code como label si no está en el catálogo.
    return {
        code,
        labelEs: code,
        labelEn: null,
        colorHex: "#6C757D",
        iconName: null,
        isTerminal: false,
        sortOrder: 999,
        description: null,
    };
}
