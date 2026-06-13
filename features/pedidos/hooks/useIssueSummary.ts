import { useEffect, useState } from "react";
import { fetchIssueSummary } from "@/app/fetchWithAuth/api-oms/summary";
import type { IssueSummaryResponse } from "@/features/pedidos/types/resumen-pedidos";

export function useIssueSummary(orderId?: number) {
    const [data, setData] = useState<IssueSummaryResponse | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!orderId && orderId !== 0) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchIssueSummary(orderId!)
            .then((d) => !cancelled && setData(d))
            .catch((e) => !cancelled && setError(e as Error))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [orderId]);

    return { data, isLoading, error };
}
