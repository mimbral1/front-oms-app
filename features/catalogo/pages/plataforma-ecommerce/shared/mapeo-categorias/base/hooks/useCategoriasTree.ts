// features/catalogo/pages/plataforma-ecommerce/shared/mapeo-categorias/base/hooks/useCategoriasTree.ts

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapeoCategoriasApi } from "../api/mapeo-categorias-api";
import type { CategoriaNodo } from "../types/mapeo-categorias-types";

export interface UseCategoriasTreeReturn {
    tree: CategoriaNodo[];
    loading: boolean;
    error: string | null;
    /** Query de búsqueda. Filtra localmente. */
    search: string;
    setSearch: (q: string) => void;
    /** Árbol filtrado por `search`. */
    filteredTree: CategoriaNodo[];
    /** Set de IDs N2 expandidos. */
    expanded: Set<string>;
    toggle: (n2Id: string) => void;
    /** ID N3 seleccionado. */
    selectedN3Id: string | null;
    setSelectedN3Id: (id: string | null) => void;
    reload: () => Promise<void>;
}

/** Extrae el array de raíces sin importar el shape exacto del envelope. */
function extractRoots(payload: unknown): CategoriaNodo[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as CategoriaNodo[];
    const p = payload as { data?: unknown; categorias?: unknown };
    if (Array.isArray(p.data)) return p.data as CategoriaNodo[];
    if (Array.isArray(p.categorias)) return p.categorias as CategoriaNodo[];
    return [];
}

/**
 * Filtra el árbol por query: mantiene nodos cuyo nombre contiene `q` (case-insensitive)
 * O cuyos descendientes contienen `q`.
 */
function filterTree(nodes: CategoriaNodo[], q: string): CategoriaNodo[] {
    if (!q) return nodes;
    const needle = q.toLowerCase();
    function recurse(node: CategoriaNodo): CategoriaNodo | null {
        const selfMatch = node.nombre?.toLowerCase().includes(needle);
        const children =
            node.subcategorias
                ?.map(recurse)
                .filter((n): n is CategoriaNodo => Boolean(n)) ?? [];
        if (selfMatch || children.length > 0) {
            return { ...node, subcategorias: children };
        }
        return null;
    }
    return nodes
        .map(recurse)
        .filter((n): n is CategoriaNodo => Boolean(n));
}

export function useCategoriasTree(): UseCategoriasTreeReturn {
    const api = useMapeoCategoriasApi();
    const [tree, setTree] = useState<CategoriaNodo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [selectedN3Id, setSelectedN3Id] = useState<string | null>(null);
    const reqIdRef = useRef(0);

    const reload = useCallback(async () => {
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const res = await api.getArbol();
            if (reqIdRef.current !== reqId) return;
            setTree(extractRoots(res));
        } catch (e) {
            if (reqIdRef.current !== reqId) return;
            setTree([]);
            setError((e as Error)?.message ?? "Error cargando árbol");
        } finally {
            if (reqIdRef.current === reqId) setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        reload();
    }, [reload]);

    const toggle = useCallback((n2Id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(n2Id)) next.delete(n2Id);
            else next.add(n2Id);
            return next;
        });
    }, []);

    const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);

    return {
        tree,
        loading,
        error,
        search,
        setSearch,
        filteredTree,
        expanded,
        toggle,
        selectedN3Id,
        setSelectedN3Id,
        reload,
    };
}
