// features/catalogo/pages/plataforma-ecommerce/shared/dashboard/base/api/dashboard-api.ts

"use client";

import { useCallback, useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import type { DashboardResponse } from "../types/dashboard-types";

export interface UseDashboardApi {
    /** GET /api/pim/dashboard */
    get: () => Promise<DashboardResponse>;
}

export function useDashboardApi(): UseDashboardApi {
    const { fetchWithAuthPim } = useFetchWithAuthPim();

    const get = useCallback(
        () => fetchWithAuthPim<DashboardResponse>("/api/pim/dashboard"),
        [fetchWithAuthPim],
    );

    return useMemo(() => ({ get }), [get]);
}
