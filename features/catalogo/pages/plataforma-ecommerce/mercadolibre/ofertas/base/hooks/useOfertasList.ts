// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useOfertasList.ts
//
// PORT (adaptado) del legacy `loadInitialState()` + `OfertasApp.tsx:38-61`.
//
// Carga el state inicial con partición 3-way correcta:
//   - activas: enrolledList donde itemsFirstPage tiene status=started|pending|sync_requested|restore_requested
//   - finalizadas: enrolledList donde solo hay status=finished (statusOf por fecha la marca 'ended')
//   - disponibles: notEnrolledList (candidatos sin opt-in)
//   - failed: invitaciones donde el fetch de items reventó (ML 500, timeout, etc.)
//
// Adicionalmente al mount: hidrata el cache module-level del catálogo SKU para
// que CampaignDetailModal/MLEnrollModal puedan cruzar item_id ML → SKU SAP
// sin fetch adicional.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, useOfertasApi } from "../api/ofertas-api";
import { primeCatalogCache, shouldUseStrictApi } from "../data/loader";
import { statusOf } from "../helpers/status";
import type {
    Campaign,
    CatalogSku,
    MLAvailable,
    MLFailedInvitation,
} from "../types/oferta-types";

export interface UseOfertasListReturn {
    activas: ReadonlyArray<Campaign>;
    finalizadas: ReadonlyArray<Campaign>;
    disponibles: ReadonlyArray<MLAvailable>;
    failed: ReadonlyArray<MLFailedInvitation>;
    loading: boolean;
    error: string | null;
    /** Catálogo SKU pre-cargado en cache (también disponible vía
     *  `getCachedCatalog()` para los modales). */
    catalog: ReadonlyArray<CatalogSku>;
    reload: () => Promise<void>;
}

/**
 * Catálogo SKU — pagina todas las páginas de `/api/pim/productos` (cap 1000
 * por página × 25 páginas = hasta 25k SKUs).
 */
const CATALOG_PAGE_SIZE = 1000;
const CATALOG_MAX_PAGES = 25;

export function useOfertasList(): UseOfertasListReturn {
    const api = useOfertasApi();
    const [activas, setActivas] = useState<ReadonlyArray<Campaign>>([]);
    const [finalizadas, setFinalizadas] = useState<ReadonlyArray<Campaign>>([]);
    const [disponibles, setDisponibles] = useState<ReadonlyArray<MLAvailable>>([]);
    const [failed, setFailed] = useState<ReadonlyArray<MLFailedInvitation>>([]);
    const [catalog, setCatalog] = useState<ReadonlyArray<CatalogSku>>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const reqIdRef = useRef(0);

    const loadCatalog = useCallback(async (): Promise<ReadonlyArray<CatalogSku>> => {
        try {
            const all: CatalogSku[] = [];
            for (let page = 1; page <= CATALOG_MAX_PAGES; page++) {
                const r = await api.listSellerCatalog({
                    page,
                    pageSize: CATALOG_PAGE_SIZE,
                });
                all.push(...r.items);
                if (r.items.length < CATALOG_PAGE_SIZE) break;
                if (r.total > 0 && all.length >= r.total) break;
            }
            return all;
        } catch (err) {
            if (process.env.NODE_ENV !== "production") {
                console.warn("[ofertas] loadCatalog falló:", err);
            }
            if (shouldUseStrictApi()) throw err;
            return [];
        }
    }, [api]);

    const reload = useCallback(async () => {
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);

        try {
            // Cargar catálogo + ofertas en paralelo. El catálogo es lo que
            // alimenta el lookup item_id → SKU SAP en los modales.
            const [catalogResult, ofertasResult] = await Promise.allSettled([
                loadCatalog(),
                api.loadOfertasFromApi(),
            ]);

            if (reqIdRef.current !== reqId) return;

            // Catálogo: prime cache (los modales lo leen). Si falló, dejamos
            // cache vacío — los modales caerán al lazy fetch.
            const catalogItems =
                catalogResult.status === "fulfilled" ? catalogResult.value : [];
            primeCatalogCache(catalogItems);
            setCatalog(catalogItems);

            // Ofertas: partición 3-way + manejo de failed[].
            if (ofertasResult.status === "fulfilled") {
                const { campaigns, ml_available, ml_failed } = ofertasResult.value;
                // Partir `campaigns` en activas vs finalizadas usando `statusOf`
                // (que mira draft/paused/fechas). active+scheduled+paused →
                // activas. ended → finalizadas.
                const ahora: Campaign[] = [];
                const pasadas: Campaign[] = [];
                for (const c of campaigns) {
                    const s = statusOf(c);
                    if (s === "ended") pasadas.push(c);
                    else ahora.push(c);
                }
                setActivas(ahora);
                setFinalizadas(pasadas);
                setDisponibles(ml_available);
                setFailed(ml_failed);
            } else {
                const err = ofertasResult.reason as ApiError;
                setError(err?.message ?? "Error cargando ofertas");
                if (shouldUseStrictApi()) throw err;
                // No-strict: dejamos listas vacías; el banner de error queda visible.
                setActivas([]);
                setFinalizadas([]);
                setDisponibles([]);
                setFailed([]);
            }
        } catch (e) {
            if (reqIdRef.current !== reqId) return;
            setError((e as Error)?.message ?? "Error cargando ofertas");
        } finally {
            if (reqIdRef.current === reqId) setLoading(false);
        }
    }, [api, loadCatalog]);

    useEffect(() => {
        reload();
    }, [reload]);

    return {
        activas,
        finalizadas,
        disponibles,
        failed,
        loading,
        error,
        catalog,
        reload,
    };
}
