// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/hooks/useAtributosList.ts
//
// Hook que encapsula:
//   - Estado de filtros + paginación.
//   - Debounce de búsqueda.
//   - Auto-reload al cambiar filtros.
//   - Manejo de loading/error.
//
// Patrón similar al `loadAtributos()` del monolito (`atributos.ts` líneas 89–142),
// pero idiomático React con `useState` + `useEffect`.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtributosApi } from "../api/atributos-api";
import type {
    Atributo,
    AtributosListFilters,
    AtributosListResponse,
} from "../types/atributo-types";

interface UseAtributosListState {
    /** Filas de la página actual. */
    rows: Atributo[];
    /** Total absoluto (across pages). */
    total: number;
    /** Página actual (1-based). */
    page: number;
    /** Tamaño de página. */
    pageSize: number;
    /** Filtros activos. */
    filters: AtributosListFilters;
    /** True mientras corre la primera carga o cualquier reload. */
    loading: boolean;
    /** Mensaje de error de la última carga, si la hubo. */
    error: string | null;
}

export interface UseAtributosListReturn extends UseAtributosListState {
    /** Cambia los filtros (excepto page) y resetea page a 1. */
    setFilters: (next: Partial<AtributosListFilters>) => void;
    /** Cambia el pageSize, resetea page a 1. */
    setPageSize: (size: number) => void;
    /** Cambia el page directamente. */
    setPage: (page: number) => void;
    /** Re-fetch con los filtros + page actuales. */
    reload: () => void;
}

const DEFAULT_PAGE_SIZE = 20;
const DEBOUNCE_MS = 350;

export function useAtributosList(initial?: Partial<AtributosListFilters>): UseAtributosListReturn {
    const api = useAtributosApi();

    const [filters, setFiltersState] = useState<AtributosListFilters>({
        ...initial,
    });
    const [page, setPage] = useState(initial?.page ?? 1);
    const [pageSize, setPageSizeState] = useState(initial?.pageSize ?? DEFAULT_PAGE_SIZE);
    const [rows, setRows] = useState<Atributo[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * El debounce vive en un ref para no romper el efecto cada vez que cambia
     * la referencia del timer. Cancela el timer anterior al desmontar.
     */
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /**
     * Token de "última request emitida" para descartar respuestas viejas si
     * llegan después de un cambio de filtros (race condition común).
     */
    const lastRequestIdRef = useRef(0);

    const fetchNow = useCallback(async () => {
        const requestId = ++lastRequestIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const params: AtributosListFilters = {
                ...filters,
                page,
                pageSize,
            };
            const res: AtributosListResponse = await api.list(params);
            if (requestId !== lastRequestIdRef.current) return; // stale
            setRows(Array.isArray(res?.data) ? res.data : []);
            setTotal(typeof res?.total === "number" ? res.total : (res?.data?.length ?? 0));
        } catch (e) {
            if (requestId !== lastRequestIdRef.current) return; // stale
            const err = e as Error;
            setRows([]);
            setTotal(0);
            setError(err?.message ?? "Error desconocido cargando atributos");
        } finally {
            if (requestId === lastRequestIdRef.current) setLoading(false);
        }
    }, [api, filters, page, pageSize]);

    /**
     * Debounce el effect: si el usuario tipea rápido en `buscar`, esperamos
     * `DEBOUNCE_MS` antes de pegar al backend.
     */
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            fetchNow();
        }, DEBOUNCE_MS);
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [fetchNow]);

    const setFilters = useCallback((next: Partial<AtributosListFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...next }));
        setPage(1);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPage(1);
    }, []);

    return {
        rows,
        total,
        page,
        pageSize,
        filters,
        loading,
        error,
        setFilters,
        setPageSize,
        setPage,
        reload: fetchNow,
    };
}
