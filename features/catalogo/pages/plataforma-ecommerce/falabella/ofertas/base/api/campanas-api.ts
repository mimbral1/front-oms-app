// Cliente de la API de Campañas de ofertas Falabella.
// Pega a /api/pim/canales/falabella/campanas/* (pim proxea a fcom). Usa
// useFetchWithAuthPim (JWT + x-plataforma-id). El envelope del pim es {ok,data};
// acá devolvemos el `data`.

"use client";

import { useCallback, useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import { URL_PIM_SERVICE } from "@/lib/http/endpoints";
import type {
    Campana,
    CampanaDetail,
    AddItemsResult,
    ParsedItems,
    PreviewResult,
    ApplyResult,
    NuevaCampanaInput,
} from "../types/campana-types";

const BASE = "/api/pim/canales/falabella/campanas";

function unwrap<T>(json: any): T {
    return (json?.data ?? json?.result ?? json) as T;
}

export interface UseCampanasApi {
    list: (params?: { status?: string; limit?: number; offset?: number }) => Promise<Campana[]>;
    get: (id: number | string) => Promise<CampanaDetail>;
    create: (input: NuevaCampanaInput) => Promise<Campana>;
    update: (id: number | string, patch: Partial<NuevaCampanaInput>) => Promise<Campana>;
    remove: (id: number | string) => Promise<any>;
    addItems: (
        id: number | string,
        items: { sku: string; precio_oferta?: number }[],
        confirmConflicts?: boolean,
    ) => Promise<AddItemsResult>;
    removeItem: (id: number | string, sku: string) => Promise<any>;
    preview: (id: number | string) => Promise<PreviewResult>;
    parseItems: (file: File) => Promise<ParsedItems>;
    activate: (
        id: number | string,
        opts?: { dryRun?: boolean; onlySkus?: string[] | null },
    ) => Promise<ApplyResult>;
    finish: (id: number | string, opts?: { dryRun?: boolean }) => Promise<ApplyResult>;
}

export function useCampanasApi(): UseCampanasApi {
    const { fetchWithAuthPim, token } = useFetchWithAuthPim();

    const list = useCallback<UseCampanasApi["list"]>(
        async (params = {}) => {
            const qs = new URLSearchParams();
            if (params.status) qs.set("status", params.status);
            if (params.limit != null) qs.set("limit", String(params.limit));
            if (params.offset != null) qs.set("offset", String(params.offset));
            const suffix = qs.toString() ? `?${qs}` : "";
            return unwrap<Campana[]>(await fetchWithAuthPim(`${BASE}${suffix}`));
        },
        [fetchWithAuthPim],
    );

    const get = useCallback<UseCampanasApi["get"]>(
        async (id) => unwrap<CampanaDetail>(await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}`)),
        [fetchWithAuthPim],
    );

    const create = useCallback<UseCampanasApi["create"]>(
        async (input) =>
            unwrap<Campana>(
                await fetchWithAuthPim(BASE, { method: "POST", body: JSON.stringify(input) }),
            ),
        [fetchWithAuthPim],
    );

    const update = useCallback<UseCampanasApi["update"]>(
        async (id, patch) =>
            unwrap<Campana>(
                await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}`, {
                    method: "PATCH",
                    body: JSON.stringify(patch),
                }),
            ),
        [fetchWithAuthPim],
    );

    const remove = useCallback<UseCampanasApi["remove"]>(
        async (id) => unwrap(await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}`, { method: "DELETE" })),
        [fetchWithAuthPim],
    );

    // addItems puede recibir 409 (conflictos). fetchWithAuthPim lanza en !ok, así
    // que capturamos y devolvemos el payload de conflictos (needsConfirmation).
    const addItems = useCallback<UseCampanasApi["addItems"]>(
        async (id, items, confirmConflicts = false) => {
            try {
                return unwrap<AddItemsResult>(
                    await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}/items`, {
                        method: "POST",
                        body: JSON.stringify({ items, confirm_conflicts: confirmConflicts }),
                    }),
                );
            } catch (err: any) {
                // handleErrorResponse adjunta status + body parseado: err.status / err.payload.
                // El proxy pim devuelve los conflictos en payload.data en un 409.
                if (err?.status === 409) {
                    const data = err?.payload?.data ?? err?.payload?.result ?? null;
                    return { needsConfirmation: true, added: 0, skipped: [], conflicts: data?.conflicts ?? [] };
                }
                throw err;
            }
        },
        [fetchWithAuthPim],
    );

    const removeItem = useCallback<UseCampanasApi["removeItem"]>(
        async (id, sku) =>
            unwrap(
                await fetchWithAuthPim(
                    `${BASE}/${encodeURIComponent(String(id))}/items/${encodeURIComponent(sku)}`,
                    { method: "DELETE" },
                ),
            ),
        [fetchWithAuthPim],
    );

    const preview = useCallback<UseCampanasApi["preview"]>(
        async (id) => unwrap<PreviewResult>(await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}/preview`)),
        [fetchWithAuthPim],
    );

    // Multipart: fetchWithAuthPim fuerza Content-Type json, así que hacemos un
    // fetch manual (el browser pone el boundary multipart automáticamente).
    const parseItems = useCallback<UseCampanasApi["parseItems"]>(
        async (file) => {
            const form = new FormData();
            form.append("file", file);
            const base = (URL_PIM_SERVICE || "").replace(/\/+$/, "");
            const headers: Record<string, string> = { "x-plataforma-id": "1" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(`${base}/${BASE.replace(/^\//, "")}/parse-items`, {
                method: "POST",
                headers,
                body: form,
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(json?.message || `Error al parsear el archivo (${res.status})`);
            }
            return unwrap<ParsedItems>(json);
        },
        [token],
    );

    const activate = useCallback<UseCampanasApi["activate"]>(
        async (id, opts = {}) => {
            const qs = opts.dryRun ? "?dry_run=1" : "";
            return unwrap<ApplyResult>(
                await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}/activate${qs}`, {
                    method: "POST",
                    body: JSON.stringify({ only_skus: opts.onlySkus ?? null }),
                }),
            );
        },
        [fetchWithAuthPim],
    );

    const finish = useCallback<UseCampanasApi["finish"]>(
        async (id, opts = {}) => {
            const qs = opts.dryRun ? "?dry_run=1" : "";
            return unwrap<ApplyResult>(
                await fetchWithAuthPim(`${BASE}/${encodeURIComponent(String(id))}/finish${qs}`, {
                    method: "POST",
                    body: JSON.stringify({}),
                }),
            );
        },
        [fetchWithAuthPim],
    );

    return useMemo(
        () => ({ list, get, create, update, remove, addItems, removeItem, preview, parseItems, activate, finish }),
        [list, get, create, update, remove, addItems, removeItem, preview, parseItems, activate, finish],
    );
}
