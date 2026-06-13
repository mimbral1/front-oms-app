// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/hooks/useBatchList.ts
//
// Hook de la lista de lotes (landing del panel de carga masiva). Fetch +
// archivar. Estado local, no toca el store del wizard.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useCargaMasivaApi } from "../api/carga-masiva-api";
import type { BatchSummary } from "../types/carga-masiva-types";

export interface UseBatchListReturn {
    batches: BatchSummary[];
    busy: boolean;
    error: string | null;
    includeArchived: boolean;
    setIncludeArchived: (v: boolean) => void;
    reload: () => Promise<void>;
    archive: (batchId: string) => Promise<void>;
}

export function useBatchList(accountId: number): UseBatchListReturn {
    const api = useCargaMasivaApi();
    const [batches, setBatches] = useState<BatchSummary[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [includeArchived, setIncludeArchived] = useState(false);

    const reload = useCallback(async () => {
        setBusy(true);
        setError(null);
        try {
            setBatches(await api.listBatches({ accountId, includeArchived, limit: 50 }));
        } catch (e) {
            setError((e as Error)?.message ?? "Error cargando los lotes");
        } finally {
            setBusy(false);
        }
    }, [api, accountId, includeArchived]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const archive = useCallback(
        async (batchId: string) => {
            await api.archive(batchId, true);
            await reload();
        },
        [api, reload],
    );

    return { batches, busy, error, includeArchived, setIncludeArchived, reload, archive };
}
