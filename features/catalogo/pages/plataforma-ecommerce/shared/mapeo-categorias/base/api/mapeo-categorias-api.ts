// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/api/mapeo-categorias-api.ts

"use client";

import { useCallback, useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import type {
    CategoriasArbolResponse,
    MapeoCategoria,
} from "../types/mapeo-categorias-types";

export interface UseMapeoCategoriasApi {
    /** GET /api/pim/categorias/arbol */
    getArbol: () => Promise<CategoriasArbolResponse>;
    /** GET /api/pim/categorias/:id/mapeos */
    getMapeos: (n3Id: number | string) => Promise<MapeoCategoria[]>;
}

export function useMapeoCategoriasApi(): UseMapeoCategoriasApi {
    const { fetchWithAuthPim } = useFetchWithAuthPim();

    const getArbol = useCallback(
        () =>
            fetchWithAuthPim<CategoriasArbolResponse>(
                "/api/pim/categorias/arbol",
            ),
        [fetchWithAuthPim],
    );

    const getMapeos = useCallback(
        async (n3Id: number | string): Promise<MapeoCategoria[]> => {
            const res = await fetchWithAuthPim<
                MapeoCategoria[] | { data?: MapeoCategoria[] }
            >(`/api/pim/categorias/${encodeURIComponent(String(n3Id))}/mapeos`);
            if (Array.isArray(res)) return res;
            if (Array.isArray((res as { data?: MapeoCategoria[] }).data)) {
                return (res as { data: MapeoCategoria[] }).data;
            }
            return [];
        },
        [fetchWithAuthPim],
    );

    return useMemo(() => ({ getArbol, getMapeos }), [getArbol, getMapeos]);
}
