// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/api/atributos-api.ts
//
// Cliente HTTP tipado para la feature Atributos. Usa `useFetchWithAuthPim`
// (apunta a `URL_PIM_SERVICE` con headers Authorization + x-plataforma-id).
//
// Convención: cada función devuelve la response sin transformar. La adaptación
// para la UI (mapeo a tipos del dominio) vive en los hooks.

"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuthPim } from "@/lib/http/client";
import type {
    Atributo,
    AtributosListFilters,
    AtributosListResponse,
    AtributoUpdatePayload,
    MapeoAtributo,
    MapeoAtributoUpsertPayload,
    MarketplaceChannel,
} from "../types/atributo-types";

/**
 * Convierte un objeto de filtros a querystring. Omite vacíos / undefined.
 */
function buildQuery(params: AtributosListFilters): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === "" || v === false) continue;
        p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : "";
}

export interface UseAtributosApi {
    /** GET /api/pim/atributos?... — listado paginado con filtros. */
    list: (filters?: AtributosListFilters) => Promise<AtributosListResponse>;

    /**
     * GET /api/pim/atributos/:id — detalle.
     *
     * NOTA: el monolito no tiene un endpoint `GET /atributos/:id` explícito —
     * en la práctica abre el modal con la row de la lista. Para esta feature
     * lo intentamos primero; si el backend devuelve 404, el hook caerá a
     * `list({ id })` como fallback.
     */
    get: (id: number | string) => Promise<Atributo>;

    /** PUT /api/pim/atributos/:id — editar atributo maestro. */
    update: (id: number | string, body: AtributoUpdatePayload) => Promise<unknown>;

    /**
     * GET /api/pim/mapeos-atributos/:channel/:n3Id — mapeos para una categoría
     * y un marketplace específico.
     */
    listMapeos: (channel: MarketplaceChannel, n3Id: string | number) =>
        Promise<{ data: MapeoAtributo[]; total?: number }>;

    /**
     * POST /api/pim/mapeos-atributos/:channel — crear mapeo nuevo.
     */
    createMapeo: (
        channel: MarketplaceChannel,
        body: MapeoAtributoUpsertPayload,
    ) => Promise<MapeoAtributo>;

    /**
     * PUT /api/pim/mapeos-atributos/:channel/:id — editar mapeo existente.
     */
    updateMapeo: (
        channel: MarketplaceChannel,
        id: number | string,
        body: MapeoAtributoUpsertPayload,
    ) => Promise<MapeoAtributo>;

    /**
     * DELETE /api/pim/mapeos-atributos/:channel/:id — eliminar mapeo.
     */
    deleteMapeo: (
        channel: MarketplaceChannel,
        id: number | string,
    ) => Promise<unknown>;
}

/**
 * Hook que devuelve los wrappers tipados de la API.
 *
 * Uso típico:
 * ```ts
 * const api = useAtributosApi();
 * const { data, total } = await api.list({ buscar: "color", pageSize: 20 });
 * ```
 */
export function useAtributosApi(): UseAtributosApi {
    const { fetchWithAuthPim } = useFetchWithAuthPim();
    const { user } = useAuth();
    // Patrón del proyecto: enviar `userId` + `userName` + `userEmail` en cada
    // mutación para que el backend escriba logs de auditoría legibles.
    const userId = Number(user?.id) || null;
    const userName = user?.nombre ?? null;
    const userEmail = user?.email ?? null;

    const list = useCallback(
        (filters: AtributosListFilters = {}) =>
            fetchWithAuthPim<AtributosListResponse>(
                `/api/pim/atributos${buildQuery(filters)}`,
            ),
        [fetchWithAuthPim],
    );

    const get = useCallback(
        async (id: number | string): Promise<Atributo> => {
            // Intentamos el endpoint directo primero.
            try {
                return await fetchWithAuthPim<Atributo>(
                    `/api/pim/atributos/${encodeURIComponent(String(id))}`,
                );
            } catch (e) {
                const err = e as { status?: number };
                if (err?.status !== 404) throw e;
                // Fallback: pedir el listado y filtrar — más caro pero compat
                // con el monolito que no expone GET singular.
                const list = await fetchWithAuthPim<AtributosListResponse>(
                    `/api/pim/atributos?pageSize=500`,
                );
                const found = list.data.find((a) => String(a.id) === String(id));
                if (!found) {
                    const error = new Error(`Atributo ${id} no encontrado`) as Error & {
                        status?: number;
                    };
                    error.status = 404;
                    throw error;
                }
                return found;
            }
        },
        [fetchWithAuthPim],
    );

    const update = useCallback(
        (id: number | string, body: AtributoUpdatePayload) =>
            fetchWithAuthPim(`/api/pim/atributos/${encodeURIComponent(String(id))}`, {
                method: "PUT",
                body: JSON.stringify({ ...body, userId, userName, userEmail }),
            }),
        [fetchWithAuthPim, userId, userName, userEmail],
    );

    const listMapeos = useCallback(
        (channel: MarketplaceChannel, n3Id: string | number) =>
            fetchWithAuthPim<{ data: MapeoAtributo[]; total?: number }>(
                `/api/pim/mapeos-atributos/${channel}/${encodeURIComponent(String(n3Id))}`,
            ),
        [fetchWithAuthPim],
    );

    const createMapeo = useCallback(
        (channel: MarketplaceChannel, body: MapeoAtributoUpsertPayload) =>
            fetchWithAuthPim<MapeoAtributo>(`/api/pim/mapeos-atributos/${channel}`, {
                method: "POST",
                body: JSON.stringify({ ...body, userId, userName, userEmail }),
            }),
        [fetchWithAuthPim, userId, userName, userEmail],
    );

    const updateMapeo = useCallback(
        (
            channel: MarketplaceChannel,
            id: number | string,
            body: MapeoAtributoUpsertPayload,
        ) =>
            fetchWithAuthPim<MapeoAtributo>(
                `/api/pim/mapeos-atributos/${channel}/${encodeURIComponent(String(id))}`,
                {
                    method: "PUT",
                    body: JSON.stringify({ ...body, userId, userName, userEmail }),
                },
            ),
        [fetchWithAuthPim, userId, userName, userEmail],
    );

    const deleteMapeo = useCallback(
        (channel: MarketplaceChannel, id: number | string) =>
            fetchWithAuthPim(
                `/api/pim/mapeos-atributos/${channel}/${encodeURIComponent(String(id))}`,
                {
                    method: "DELETE",
                    // DELETE no suele llevar body pero el backend lo acepta para
                    // popular el log de auditoría con quién borró el mapeo.
                    body: JSON.stringify({ userId, userName, userEmail }),
                },
            ),
        [fetchWithAuthPim, userId, userName, userEmail],
    );

    return useMemo(
        () => ({ list, get, update, listMapeos, createMapeo, updateMapeo, deleteMapeo }),
        [list, get, update, listMapeos, createMapeo, updateMapeo, deleteMapeo],
    );
}
