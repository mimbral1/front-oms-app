// app\fetchWithAuth\api-orders\useOpenLines.ts

"use client";

import { useEffect, useState } from "react";
import { getOpenLinesByDocNum } from "./orders";

// Cache en memoria por docNum
const cache = new Map<number, any[]>();

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
};

export function useOpenLines(docNum?: number) {
    const [rows, setRows] = useState<any[] | null>(null);
    const [loading, setLoading] = useState<boolean>(!!docNum);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!docNum) return;

        // 1) Si hay cache, devolvemos altiro
        const cached = cache.get(docNum);
        if (cached) {
            setRows(cached);
            setLoading(false);
            return;
        }

        // 2) Si no, pegamos a la API y guardamos
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const { rows: apiRows } = await getOpenLinesByDocNum(docNum, 1, 200);
                if (!mounted) return;
                const list = apiRows ?? [];
                cache.set(docNum, list);
                setRows(list);
            } catch (error: unknown) {
                if (!mounted) return;
                setError(getErrorMessage(error, "Error cargando lineas"));
                setRows([]);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [docNum]);

    return { rows, loading, error };
}
