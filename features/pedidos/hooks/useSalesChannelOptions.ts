// features/pedidos/hooks/useSalesChannelOptions.ts
// Carga las opciones de canal de venta desde el endpoint de comercio.

"use client";

import { useEffect, useState } from "react";
import { useFetchWithAuth } from "@/lib/http/client";

type Option = { label: string; value: string };

export function useSalesChannelOptions() {
    const { fetchWithAuth } = useFetchWithAuth();
    const [salesChannelOptions, setSalesChannelOptions] = useState<Option[]>([]);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const res = await fetchWithAuth<{
                    ok: boolean;
                    data: { referenceId: string; name: string }[];
                }>("comerce-service/sales-channel/ListarSimple");

                const list = (res && (res as any).data) || [];
                const opts = Array.isArray(list)
                    ? list.map((it) => ({
                        label: String(it.name ?? "").trim(),
                        value: String(it.referenceId ?? "").trim(),
                    }))
                    : [];

                if (mounted) setSalesChannelOptions(opts);
            } catch (err: any) {
                if (!mounted) return;
                setSalesChannelOptions([]);
                setWarning(
                    err?.message ||
                    "No se pudieron cargar los canales de venta. Algunos filtros pueden no estar disponibles.",
                );
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    return { salesChannelOptions, warning };
}
