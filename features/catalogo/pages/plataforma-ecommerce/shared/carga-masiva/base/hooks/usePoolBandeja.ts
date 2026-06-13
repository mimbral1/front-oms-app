// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/hooks/usePoolBandeja.ts
//
// Hook de la bandeja "Productos a publicar" (cross-lote). Estado local (no usa
// el store de upload). Fetch manual + acciones tomar/soltar.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useCargaMasivaApi } from "../api/carga-masiva-api";
import type { BulkRow } from "../types/carga-masiva-types";

export type PoolFilter = "disponible" | "lo-mio" | "publicado";

export interface UsePoolBandejaReturn {
    rows: BulkRow[];
    filter: PoolFilter;
    setFilter: (f: PoolFilter) => void;
    busy: boolean;
    error: string | null;
    userId: number;
    reload: () => Promise<void>;
    claim: (batchId: string, rowNumbers: number[]) => Promise<void>;
    release: (batchId: string, rowNumbers: number[]) => Promise<void>;
}

export function usePoolBandeja(accountId: number): UsePoolBandejaReturn {
    const api = useCargaMasivaApi();
    const { user } = useAuth();
    const userId = Number(user?.id) || 0;

    const [rows, setRows] = useState<BulkRow[]>([]);
    const [filter, setFilter] = useState<PoolFilter>("disponible");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setBusy(true);
        setError(null);
        try {
            const params: { accountId: number; status?: string; assignedTo?: number } = { accountId };
            if (filter === "disponible") params.status = "disponible";
            else if (filter === "publicado") params.status = "publicado";
            else if (filter === "lo-mio") {
                params.status = "asignado";
                params.assignedTo = userId;
            }
            setRows(await api.getPool(params));
        } catch (e) {
            setError((e as Error)?.message ?? "Error cargando la bandeja");
        } finally {
            setBusy(false);
        }
    }, [api, accountId, filter, userId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const claim = useCallback(
        async (batchId: string, rowNumbers: number[]) => {
            if (!userId) {
                setError("Usuario no identificado. Vuelve a iniciar sesión.");
                return;
            }
            await api.claim(batchId, rowNumbers, userId);
            await reload();
        },
        [api, userId, reload],
    );

    const release = useCallback(
        async (batchId: string, rowNumbers: number[]) => {
            if (!userId) return;
            await api.release(batchId, rowNumbers, userId);
            await reload();
        },
        [api, userId, reload],
    );

    return { rows, filter, setFilter, busy, error, userId, reload, claim, release };
}
