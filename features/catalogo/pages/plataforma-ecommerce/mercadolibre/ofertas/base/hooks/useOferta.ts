// features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas/base/hooks/useOferta.ts
//
// Carga el detalle de UNA campaña a partir del ID.
//
// IMPORTANTE — ML NO expone `GET /seller-promotions/promotions/:id` que
// devuelva la campaña aisladamente. Para tener el shape `Campaign` completo
// hay que llamar `listInvitations()` (filtrar por ID) + `listPromotionItems()`.
// Es lo que hace `loadOfertasFromApi` y es ineficiente para 1 sola campaña.
//
// Estrategia: traemos toda la lista vía `loadOfertasFromApi()` (con cache
// module-level del catálogo en el primer call) y buscamos por ID en el
// resultado. Si la primera carga ya fue hecha por `useOfertasList`, este hook
// se beneficia del cache de rangos `_itemRanges` que populó.
//
// Las acciones write (pause/resume/delete a nivel de campaña) NO se exponen
// porque ML NO tiene esos endpoints. Las acciones por item se hacen via
// `useOfertasApi.removeItemFromPromotion()` con confirm modal humano (regla
// §"Destructive calls").

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, useOfertasApi } from "../api/ofertas-api";
import type { Campaign } from "../types/oferta-types";

export interface UseOfertaReturn {
    oferta: Campaign | null;
    loading: boolean;
    error: string | null;
    notFound: boolean;
    reload: () => Promise<void>;
}

export function useOferta(id: string | null | undefined): UseOfertaReturn {
    const api = useOfertasApi();
    const [oferta, setOferta] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const reqIdRef = useRef(0);

    const reload = useCallback(async () => {
        if (!id) {
            setOferta(null);
            return;
        }
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const { campaigns } = await api.loadOfertasFromApi();
            if (reqIdRef.current !== reqId) return;
            const found = campaigns.find((c) => c.id === id) ?? null;
            if (!found) {
                setNotFound(true);
                setOferta(null);
            } else {
                setOferta(found);
            }
        } catch (e) {
            if (reqIdRef.current !== reqId) return;
            const err = e as ApiError;
            setError(err?.message ?? "Error cargando oferta");
        } finally {
            if (reqIdRef.current === reqId) setLoading(false);
        }
    }, [api, id]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { oferta, loading, error, notFound, reload };
}
