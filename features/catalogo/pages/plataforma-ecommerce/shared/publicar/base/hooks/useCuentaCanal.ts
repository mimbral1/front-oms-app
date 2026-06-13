// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/hooks/useCuentaCanal.ts
//
// Resuelve la cuenta vendedora del canal (commerce-service vía /api/pim/cuentas)
// una sola vez por sesión. Caché a nivel de módulo keyed por canal para que
// ProgressSidebar y PublishConfirmModal NO disparen dos fetches del mismo dato.
//
// Las cuentas/canales casi no cambian → caché de sesión es suficiente. No hay
// invalidación; un reload de la app la refresca.

"use client";

import { useEffect, useState } from "react";
import { usePublicarApi, type CuentaCanal } from "../api/publicar-api";
import type { PublicarChannel } from "../types/publicar-types";

const cache = new Map<PublicarChannel, CuentaCanal | null>();

export interface UseCuentaCanalReturn {
    cuenta: CuentaCanal | null;
    loading: boolean;
}

export function useCuentaCanal(channel: PublicarChannel): UseCuentaCanalReturn {
    const api = usePublicarApi();
    const [cuenta, setCuenta] = useState<CuentaCanal | null>(
        () => cache.get(channel) ?? null,
    );
    const [loading, setLoading] = useState<boolean>(() => !cache.has(channel));

    useEffect(() => {
        let alive = true;

        if (cache.has(channel)) {
            setCuenta(cache.get(channel) ?? null);
            setLoading(false);
            return;
        }

        setLoading(true);
        api.fetchCuentaCanal(channel)
            .then((c) => {
                cache.set(channel, c);
                if (!alive) return;
                setCuenta(c);
                setLoading(false);
            })
            .catch(() => {
                if (!alive) return;
                setCuenta(null);
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [channel, api]);

    return { cuenta, loading };
}
