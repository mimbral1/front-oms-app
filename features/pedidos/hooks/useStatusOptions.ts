// features/pedidos/hooks/useStatusOptions.ts
// Carga las opciones de estado de pedido desde el endpoint de OMS.

"use client";

import { useEffect, useState } from "react";
import { useFetchWithAuth } from "@/lib/http/client";

type OrderStatus = { orderStatusID: number; statusCode: string };
type Option = { label: string; value: string };

export function useStatusOptions() {
    const { fetchWithAuth } = useFetchWithAuth();
    const [statusOptions, setStatusOptions] = useState<Option[]>([]);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const res = await fetchWithAuth<OrderStatus[]>("oms-service/orders/status");
                const list = Array.isArray(res) ? res : [];

                const opts = list.map((it) => ({
                    label: String(it.statusCode ?? ""),
                    value: String(it.orderStatusID ?? ""),
                }));

                if (mounted) setStatusOptions(opts);
            } catch (err: any) {
                if (!mounted) return;
                setStatusOptions([]);
                setWarning(
                    err?.message ||
                    "No se pudieron cargar los estados de pedido. Algunos filtros pueden no estar disponibles.",
                );
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    return { statusOptions, warning };
}
