// features/catalogo/pages/plataforma-ecommerce/shared/catalogo/base/hooks/useCatalogoList.ts
//
// Hook que orquesta el listado de catálogo. Mismo patrón que `useAtributosList`
// (debounce, race-guard, filters + paginación), pero parametrizado por marketplace
// (`ml`/`falabella`/`vtex`) — viene del `EcommercePlatformContext` aguas arriba.
//
// 2026-05-18 — features agregadas:
//   - Default `status: "activos"` (antes era `"todos"`)
//   - Modo "search across all pages": cuando `filters.search` no está vacío,
//     el hook carga TODAS las páginas (pageSize=100 cap del backend) en
//     paralelo de a SEARCH_PAGE_CONCURRENCY=4 hasta SEARCH_MAX_PAGES=30, las
//     dedupea por SKU y filtra client-side. Sale a `searchAllLoading` para
//     que la UI muestre un indicador.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useSessionStorageState } from "@/hooks/useSessionStorageState";
import { mapPlatformToMarketplace, useCatalogoApi } from "../api/catalogo-api";
import type {
    CatalogoListFilters,
    MarketplaceProduct,
} from "../types/catalogo-types";

const DEFAULT_PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

/**
 * Modo "search server-side" (Mayo 2026 — Opción B):
 *
 * Cuando el user busca algo, el front manda `?search=X` directo al backend.
 * El backend (`meli-catalog-service/.../products-cache.service.js`) hace SQL
 * local en `ml_skus` filtrando por sku/ml_item_id/titulo (todos indexados) y
 * después fetch detalles ML solo de los matches. Latencia <500ms vs ~20s del
 * loop client-side anterior.
 *
 * Antes (deuda técnica que reemplazó esto): el hook iteraba TODAS las páginas
 * del catálogo en chunks paralelos y filtraba client-side. Para Mimbral
 * (16.5k SKUs) eran ~1000 calls a ML por cada search.
 *
 * El backend tiene cap defensivo de 200 matches por search. Si una query
 * matchea más (improbable — un seller no busca "a" en su catálogo), se trunca
 * pero no es bloqueante.
 */
const SEARCH_RESULTS_CAP = 200;

export interface UseCatalogoListReturn {
    rows: MarketplaceProduct[];
    /** Filas filtradas localmente por search/reputation (después del fetch). */
    filteredRows: MarketplaceProduct[];
    total: number;
    page: number;
    pageSize: number;
    filters: CatalogoListFilters;
    loading: boolean;
    /** True mientras corre el "search across all pages" (separado de loading normal). */
    searchAllLoading: boolean;
    /** True si el backend reportó más SKUs de los que SEARCH_MAX_PAGES nos deja cargar. */
    searchAllTruncated: boolean;
    /** True cuando la UI está mostrando resultados de "search all" en vez de paginados. */
    isSearchActive: boolean;
    error: string | null;
    setFilters: (next: Partial<CatalogoListFilters>) => void;
    setPageSize: (size: number) => void;
    setPage: (page: number) => void;
    reload: () => Promise<void>;
}

export function useCatalogoList(initial?: Partial<CatalogoListFilters>): UseCatalogoListReturn {
    const platform = useEcommercePlatform();
    const marketplace = useMemo(
        () => mapPlatformToMarketplace(platform.exportPrefix),
        [platform.exportPrefix],
    );
    const api = useCatalogoApi();

    // Persistimos filtros + page + pageSize en sessionStorage para que el
    // estado sobreviva la navegación interna (Catálogo → Publicar → Catálogo).
    // Sin esto, Next App Router desmonta la página y se pierden los filtros.
    // Las keys incluyen `marketplace` para que ML, Falabella y VTEX no se pisen
    // entre sí cuando el seller alterna marketplaces.
    const filtersKey = `catalogo.filters.${marketplace}`;
    const pageKey = `catalogo.page.${marketplace}`;
    const pageSizeKey = `catalogo.pageSize.${marketplace}`;

    const [filters, setFiltersState] = useSessionStorageState<CatalogoListFilters>(
        filtersKey,
        {
            // Default Activos — la mayoría de las veces el seller solo quiere ver
            // sus listings vivos. Pueden cambiar el tab si necesitan otra cosa.
            status: "activos",
            reputation: "todas",
            ...initial,
        },
    );
    const [page, setPage] = useSessionStorageState<number>(
        pageKey,
        initial?.page ?? 1,
    );
    const [pageSize, setPageSizeState] = useSessionStorageState<number>(
        pageSizeKey,
        initial?.pageSize ?? DEFAULT_PAGE_SIZE,
    );
    const [rows, setRows] = useState<MarketplaceProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchAllLoading, setSearchAllLoading] = useState(false);
    const [searchAllTruncated, setSearchAllTruncated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastReqRef = useRef(0);

    const isSearchActive = (filters.search ?? "").trim().length > 0;

    /**
     * Fetch de UNA página del backend con los filtros actuales.
     * Acepta `search` opcional — cuando se pasa, el backend hace SQL local
     * y devuelve todos los matches en una sola respuesta (sin paginación).
     */
    const fetchPage = useCallback(
        async (pg: number, ps: number, searchText?: string) => {
            return api.list({
                marketplace,
                page: pg,
                pageSize: ps,
                status: filters.status,
                ...(searchText ? { search: searchText } : {}),
            });
        },
        [api, filters.status, marketplace],
    );

    /**
     * Modo normal — carga una página específica del backend.
     */
    const fetchPagedNow = useCallback(async () => {
        const reqId = ++lastReqRef.current;
        setLoading(true);
        setError(null);
        setSearchAllTruncated(false);
        try {
            const res = await fetchPage(page, pageSize);
            if (reqId !== lastReqRef.current) return;
            setRows(Array.isArray(res?.data) ? res.data : []);
            setTotal(typeof res?.total === "number" ? res.total : (res?.data?.length ?? 0));
        } catch (e) {
            if (reqId !== lastReqRef.current) return;
            setRows([]);
            setTotal(0);
            setError((e as Error)?.message ?? "Error cargando catálogo");
        } finally {
            if (reqId === lastReqRef.current) setLoading(false);
        }
    }, [fetchPage, page, pageSize]);

    /**
     * Modo search server-side — una sola llamada con `?search=X` al backend.
     * El backend filtra en SQL local (`ml_skus`) y devuelve hasta 200 matches
     * con detalles ML completos. No hay loop, no hay concurrency, no hay cap
     * client-side.
     */
    const fetchSearchServerSideNow = useCallback(async () => {
        const reqId = ++lastReqRef.current;
        const searchText = (filters.search ?? "").trim();
        setSearchAllLoading(true);
        setError(null);
        setSearchAllTruncated(false);
        try {
            // pageSize=200 acompaña el cap del backend; pg=1 no se usa en modo search
            // pero lo pasamos por compat. El backend ignora `page` cuando hay `search`.
            const res = await fetchPage(1, SEARCH_RESULTS_CAP, searchText);
            if (reqId !== lastReqRef.current) return;
            const data = Array.isArray(res?.data) ? res.data : [];
            setRows(data);
            setTotal(typeof res?.total === "number" ? res.total : data.length);
            // Si el backend devolvió exactamente el cap, posible truncación.
            // Es muy raro (un seller no busca queries tan amplias) pero lo señalamos.
            setSearchAllTruncated(data.length >= SEARCH_RESULTS_CAP);
        } catch (e) {
            if (reqId !== lastReqRef.current) return;
            setRows([]);
            setTotal(0);
            setError((e as Error)?.message ?? "Error buscando en el catálogo");
        } finally {
            if (reqId === lastReqRef.current) setSearchAllLoading(false);
        }
    }, [fetchPage, filters.search]);

    /** Dispatcher — server-side search vs paginado. */
    const fetchNow = useCallback(async () => {
        if (isSearchActive) {
            await fetchSearchServerSideNow();
        } else {
            await fetchPagedNow();
        }
    }, [fetchPagedNow, fetchSearchServerSideNow, isSearchActive]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchNow, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [fetchNow]);

    // Local filtering: search + quality level (de `performance.score` real ML).
    // En modo search-all, `rows` ya tiene TODO el catálogo (hasta el cap);
    // este filter local hace el matching real contra `search` y `reputation`.
    //
    // Semántica del filtro Calidad:
    //   - "todas"     → todo, PERO oculta items catalog_listing (default)
    //   - "catalogo"  → SOLO items catalog_listing (cuando el usuario lo elige
    //                   explícito en el dropdown del toolbar)
    //   - "green/yellow/red" → filtra por level real (excluye sin score Y catálogos)
    //
    // El default oculta los catálogos porque Mimbral los publica masivamente
    // como segunda forma de exposición — si los mostráramos juntos con las
    // clásicas, la mitad del listing del PIM serían filas azules "Catálogo"
    // sin score real accionable. Cuando el seller quiere auditar esa cara
    // de su catálogo, filtra explícito.
    //
    // Items sin score (clásicas paused/recientes) se excluyen al filtrar por
    // un level específico — solo aparecen en "todas" como badge gris "Sin score".
    const filteredRows = useMemo(() => {
        const q = (filters.search ?? "").trim().toLowerCase();
        const rep = filters.reputation ?? "todas";
        return rows.filter((p) => {
            if (q) {
                const hay = `${p.sku} ${p.seller_sku ?? ""} ${p.titulo} ${p.item_id ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }

            const isCatalogListing = Boolean(p.is_catalog_listing);

            // Modo "solo catálogo": muestra exclusivamente catalog_listings.
            if (rep === "catalogo") {
                return isCatalogListing;
            }

            // Cualquier otro modo: oculta catalog_listings (no son la cara
            // accionable del catálogo PIM).
            if (isCatalogListing) return false;

            // Filtro por level real (excluye sin score).
            if (rep !== "todas") {
                const level = computeQualityDetail(p).level;
                if (level !== rep) return false;
            }

            return true;
        });
    }, [filters.reputation, filters.search, rows]);

    const setFilters = useCallback((next: Partial<CatalogoListFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...next }));
        // Cambios server-side resetean page.
        // search: cuando se ACTIVA (de "" a algo) o se DESACTIVA, también reset
        // a página 1 — porque cambian de modo paginado a search-all (y viceversa).
        if (next.status !== undefined || next.search !== undefined) setPage(1);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPage(1);
    }, []);

    return {
        rows,
        filteredRows,
        total,
        page,
        pageSize,
        filters,
        loading,
        searchAllLoading,
        searchAllTruncated,
        isSearchActive,
        error,
        setFilters,
        setPageSize,
        setPage,
        reload: fetchNow,
    };
}

/**
 * Calidad de la publicación = **score oficial de ML** (`GET /item/:id/performance`).
 *
 * Lo persiste el worker `performance-refresh.runner.js` del meli-catalog-service
 * en `ml_skus.performance_*` cada 6 horas. El endpoint `/api/pim/productos` lo
 * enriquece por batch lookup (sin N+1) y lo expone vía `p.performance.score`.
 *
 * Niveles por umbral (oficial ML):
 *   - Bad    → score 0-39   → red  ("Baja")
 *   - Medium → score 40-69  → yellow ("Media")
 *   - Good   → score 70-100 → green ("Alta")
 *
 * Cuando ML no devolvió `level` pero sí `score`, derivamos por el umbral.
 * Cuando NO hay score (worker no procesó aún, o ML aún no calculó), devolvemos
 * `null` — la UI muestra "Sin score". **NUNCA inventamos un nivel** — la
 * heurística client-side anterior se eliminó porque era engañosa para el seller.
 */
export type QualityLevel = "green" | "yellow" | "red";

export interface QualityDetail {
    /** null cuando ML aún no devolvió score para este ítem. */
    level: QualityLevel | null;
    score: number | null;
    /** Cuándo el worker sincronizó este score (ISO 8601). */
    syncedAt: string | null;
    /** Cuándo ML calculó el score (ISO 8601). */
    calculatedAt: string | null;
    /**
     * `true` si la publicación usa el catálogo compartido de ML
     * (`catalog_listing=true` en la API ML). El content (título, fotos,
     * atributos) viene de la ficha de catálogo, no del seller — por eso ML
     * NO devuelve score propio para estos items.
     *
     * Cuando es true + `score=null`, la UI muestra badge azul "Catálogo"
     * en vez del gris "Sin score". Diferencia semántica importante:
     *   - Sin score → ML no calculó aún (publicación reciente o paused)
     *   - Catálogo  → No aplica score del listing (content de ML, no del seller)
     */
    isCatalogListing: boolean;
    /** Origen del score: "ml" (performance) o "fala" (content score 0-100, tramos 71/30). */
    kind: "ml" | "fala";
}

export function computeQualityDetail(p: MarketplaceProduct): QualityDetail {
    const perf = p?.performance;
    const isCatalogListing = Boolean(p?.is_catalog_listing);

    // ── Falabella: content score 0-100 (no tiene `performance` ML ni levels). ──
    // Tramos oficiales (GetContentScore): ≥71 verde, 30-70 ámbar, <30 rojo.
    const falaScore = p?.content_score;
    if ((!perf || perf.score == null) && falaScore != null) {
        const s = Number(falaScore);
        const level: QualityLevel = s >= 71 ? "green" : s >= 30 ? "yellow" : "red";
        return {
            level,
            score: s,
            syncedAt: null,
            calculatedAt: null,
            isCatalogListing: false,
            kind: "fala",
        };
    }

    if (!perf || perf.score == null) {
        return {
            level: null,
            score: null,
            syncedAt: null,
            calculatedAt: null,
            isCatalogListing,
            kind: "ml",
        };
    }
    // Si ML mandó `level` lo respetamos, sino derivamos por umbral.
    let level: QualityLevel;
    if (perf.level === "Good") level = "green";
    else if (perf.level === "Medium") level = "yellow";
    else if (perf.level === "Bad") level = "red";
    else if (perf.score >= 70) level = "green";
    else if (perf.score >= 40) level = "yellow";
    else level = "red";

    return {
        level,
        score: perf.score,
        syncedAt: perf.synced_at ?? null,
        calculatedAt: perf.calculated_at ?? null,
        isCatalogListing,
        kind: "ml",
    };
}
