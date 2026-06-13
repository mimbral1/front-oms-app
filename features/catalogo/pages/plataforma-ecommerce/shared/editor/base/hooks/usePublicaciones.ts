// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/hooks/usePublicaciones.ts
//
// Hook de datos del tab "Publicaciones" — un solo fetch del endpoint 3a (vía pim).
// EditorView lo consume para el badgeCount del tab y le pasa los datos al tab
// (que es presentacional, sin re-fetch). Sólo dispara si `enabled` (canal ML).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorApi } from "../api/editor-api";
import type { EditorPublicacion } from "../types/editor-types";

export interface UsePublicacionesReturn {
    publications: EditorPublicacion[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function usePublicaciones(
    sku: string,
    opts: { enabled: boolean },
): UsePublicacionesReturn {
    const api = useEditorApi();
    const enabled = opts.enabled;
    const [publications, setPublications] = useState<EditorPublicacion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const skuRef = useRef(sku);
    useEffect(() => {
        skuRef.current = sku;
    }, [sku]);

    const reload = useCallback(async () => {
        if (!enabled || !skuRef.current) return;
        setLoading(true);
        setError(null);
        try {
            const rows = await api.fetchPublicaciones(skuRef.current);
            setPublications(rows);
        } catch (e) {
            setError(
                (e as Error)?.message || "No se pudieron cargar las publicaciones.",
            );
            setPublications([]);
        } finally {
            setLoading(false);
        }
    }, [api, enabled]);

    useEffect(() => {
        if (enabled && sku) void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sku, enabled]);

    return { publications, loading, error, reload };
}
