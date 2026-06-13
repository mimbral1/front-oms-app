// features/catalogo/pages/plataforma-ecommerce/shared/carga-masiva/base/hooks/useBatchDetail.ts
//
// Hook del detalle de un lote: productos (queue) + actividad (timeline).

"use client";

import { useCallback, useEffect, useState } from "react";
import { useCargaMasivaApi } from "../api/carga-masiva-api";
import type { BulkRow, BatchSummary, BatchActivity } from "../types/carga-masiva-types";

export interface UseBatchDetailReturn {
    batch: BatchSummary | null;
    rows: BulkRow[];
    activity: BatchActivity[];
    busy: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useBatchDetail(batchId: string): UseBatchDetailReturn {
    const api = useCargaMasivaApi();
    const [batch, setBatch] = useState<BatchSummary | null>(null);
    const [rows, setRows] = useState<BulkRow[]>([]);
    const [activity, setActivity] = useState<BatchActivity[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!batchId) return;
        setBusy(true);
        setError(null);
        try {
            const [queue, acts] = await Promise.all([api.getQueue(batchId), api.getActivity(batchId)]);
            setBatch(queue.batch ?? null);
            setRows(queue.rows ?? []);
            setActivity(acts);
        } catch (e) {
            setError((e as Error)?.message ?? "Error cargando el lote");
        } finally {
            setBusy(false);
        }
    }, [api, batchId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    return { batch, rows, activity, busy, error, reload };
}
