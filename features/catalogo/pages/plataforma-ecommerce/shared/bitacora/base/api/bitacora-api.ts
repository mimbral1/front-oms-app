// features/catalogo/pages/plataforma-ecommerce/shared/bitacora/base/api/bitacora-api.ts
//
// Cliente HTTP de la bitácora de publicación Falabella.
//   fetchBitacora(sku)        → GET /api/pim/productos/:sku/audit?marketplace=falabella
//   fetchPublishActivity()    → GET /api/pim/canales/falabella/publish-activity
//
// Ambos endpoints devuelven { ok, data }. Degradación graceful: ante error de
// red devolvemos vacío ([] / null) para que la UI muestre "sin actividad" en
// lugar de romper.

"use client";

import { useCallback, useMemo } from "react";
import { useFetchWithAuthPim } from "@/lib/http/client";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { resolveMarketplaceKey } from "../../../productos/base/utils/marketplace";
import type { BitacoraEntry, PublishActivity } from "../types/bitacora-types";

interface Envelope<T> {
    ok?: boolean;
    data?: T;
}

export interface UseBitacoraApi {
    fetchBitacora: (
        sku: string,
        opts?: { limit?: number; offset?: number; includePayload?: boolean },
    ) => Promise<BitacoraEntry[]>;
    fetchPublishActivity: (
        opts?: { accountId?: number; recentLimit?: number },
    ) => Promise<PublishActivity | null>;
}

export function useBitacoraApi(): UseBitacoraApi {
    const { fetchWithAuthPim } = useFetchWithAuthPim();
    // Canal del contexto de plataforma → 'falabella' | 'ml' | 'vtex'. Las rutas pim
    // aceptan 'falabella'/'fala' y 'mercadolibre'/'ml'. Así la bitácora (componente
    // compartido) consume el canal en el que está montada, sin hardcodear Falabella.
    const platform = useEcommercePlatform();
    const channel = resolveMarketplaceKey(platform?.name);

    const fetchBitacora: UseBitacoraApi["fetchBitacora"] = useCallback(
        async (sku, opts) => {
            const p = new URLSearchParams({ marketplace: channel });
            if (opts?.limit) p.set("limit", String(opts.limit));
            if (opts?.offset) p.set("offset", String(opts.offset));
            if (opts?.includePayload) p.set("includePayload", "1");
            try {
                const env = await fetchWithAuthPim<Envelope<BitacoraEntry[]>>(
                    `/api/pim/productos/${encodeURIComponent(sku)}/audit?${p.toString()}`,
                );
                return Array.isArray(env?.data) ? env.data : [];
            } catch {
                return [];
            }
        },
        [fetchWithAuthPim, channel],
    );

    const fetchPublishActivity: UseBitacoraApi["fetchPublishActivity"] = useCallback(
        async (opts) => {
            const p = new URLSearchParams();
            if (opts?.accountId != null) p.set("accountId", String(opts.accountId));
            if (opts?.recentLimit) p.set("recentLimit", String(opts.recentLimit));
            const qs = p.toString() ? `?${p.toString()}` : "";
            try {
                const env = await fetchWithAuthPim<Envelope<PublishActivity>>(
                    `/api/pim/canales/${channel}/publish-activity${qs}`,
                );
                return env?.data ?? null;
            } catch {
                return null;
            }
        },
        [fetchWithAuthPim, channel],
    );

    return useMemo(
        () => ({ fetchBitacora, fetchPublishActivity }),
        [fetchBitacora, fetchPublishActivity],
    );
}
