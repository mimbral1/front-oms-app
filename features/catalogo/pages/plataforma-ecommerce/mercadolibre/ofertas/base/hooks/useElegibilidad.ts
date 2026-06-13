// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useElegibilidad.ts
//
// Estado del Explorador: búsqueda (SKU/MLC/nombre) → seleccionar un producto →
// cargar publicaciones + elegibilidad de cada una. Read-only.

"use client";

import { useCallback, useRef, useState } from "react";
import { useOfertasApi } from "../api/ofertas-api";
import { toEligibility } from "../helpers/elegibilidad";
import type {
    ProductMatch,
    PublicationEligibility,
} from "../types/elegibilidad-types";

export interface UseElegibilidadReturn {
    query: string;
    setQuery: (q: string) => void;
    results: ProductMatch[];
    selectedSku: string | null;
    selectedTitulo: string | null;
    searching: boolean;
    loading: boolean;
    error: string | null;
    eligibility: PublicationEligibility[];
    search: () => Promise<void>;
    selectProduct: (m: ProductMatch) => Promise<void>;
    reload: () => Promise<void>;
}

export function useElegibilidad(): UseElegibilidadReturn {
    const api = useOfertasApi();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<ProductMatch[]>([]);
    const [selectedSku, setSelectedSku] = useState<string | null>(null);
    const [selectedTitulo, setSelectedTitulo] = useState<string | null>(null);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eligibility, setEligibility] = useState<PublicationEligibility[]>([]);

    // Race guard: cada operación bumpea el counter; solo la última aplica sus
    // resultados (evita que un clic anterior pise los datos de uno posterior).
    const reqIdRef = useRef(0);

    const selectProduct = useCallback(
        async (m: ProductMatch) => {
            const reqId = ++reqIdRef.current;
            setSelectedSku(m.sku);
            setSelectedTitulo(m.titulo);
            setLoading(true);
            setError(null);
            setEligibility([]);
            try {
                const pubs = await api.listPublicaciones(m.sku);
                const settled = await Promise.allSettled(
                    pubs.map(async (pub) => {
                        const { results } = await api.listItemPromotions(pub.itemId);
                        return toEligibility(pub, [...results]); // readonly → mutable
                    }),
                );
                if (reqIdRef.current !== reqId) return;
                const rows: PublicationEligibility[] = settled.map((s, i) =>
                    s.status === "fulfilled" ? s.value : toEligibility(pubs[i], []),
                );
                setEligibility(rows);
            } catch (e) {
                if (reqIdRef.current !== reqId) return;
                setError(
                    e instanceof Error ? e.message : "No se pudo cargar la elegibilidad.",
                );
            } finally {
                if (reqIdRef.current === reqId) setLoading(false);
            }
        },
        [api],
    );

    const search = useCallback(async () => {
        const q = query.trim();
        if (!q) return;
        const reqId = ++reqIdRef.current;
        setSearching(true);
        setError(null);
        setResults([]);
        setSelectedSku(null);
        setEligibility([]);
        let matches: ProductMatch[] = [];
        try {
            matches = await api.searchProductos(q);
            if (reqIdRef.current !== reqId) return;
            setResults(matches);
        } catch (e) {
            if (reqIdRef.current !== reqId) return;
            setError(e instanceof Error ? e.message : "No se pudo buscar.");
            return;
        } finally {
            if (reqIdRef.current === reqId) setSearching(false);
        }
        // Auto-seleccionar si hay exactamente 1 match. Fuera del try/finally:
        // selectProduct maneja su propio loading y vuelve a bumpear el reqId.
        if (matches.length === 1) await selectProduct(matches[0]);
    }, [api, query, selectProduct]);

    const reload = useCallback(async () => {
        if (selectedSku) {
            await selectProduct({ sku: selectedSku, titulo: selectedTitulo ?? selectedSku });
        }
    }, [selectedSku, selectedTitulo, selectProduct]);

    return {
        query, setQuery, results, selectedSku, selectedTitulo,
        searching, loading, error, eligibility, search, selectProduct, reload,
    };
}
