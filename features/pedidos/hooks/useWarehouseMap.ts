// features/pedidos/hooks/useWarehouseMap.ts
// Carga el mapa code→name de bodegas (warehouses) al montar.

"use client";

import { useCallback, useEffect, useState } from "react";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";

export function useWarehouseMap() {
    const [warehouseMap, setWarehouseMap] = useState<Record<string, string>>({});
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        warehousesAll()
            .then(({ items }) => {
                if (!mounted || !Array.isArray(items)) return;

                const map = items.reduce<Record<string, string>>((acc, w) => {
                    const code = (w?.code ?? "").trim();
                    const name = (w?.name ?? "").trim();
                    if (code) acc[code] = name || code;
                    return acc;
                }, {});

                setWarehouseMap(map);
            })
            .catch((err: any) => {
                if (!mounted) return;
                setWarning(
                    err?.message ||
                    "No se pudieron cargar las bodegas. Algunos filtros pueden no estar disponibles.",
                );
            });

        return () => {
            mounted = false;
        };
    }, []);

    const getWarehouseName = useCallback(
        (code?: string | null) => {
            if (!code) return "";
            const key = code.trim();
            return warehouseMap[key] ?? key;
        },
        [warehouseMap],
    );

    return { warehouseMap, getWarehouseName, warning };
}
