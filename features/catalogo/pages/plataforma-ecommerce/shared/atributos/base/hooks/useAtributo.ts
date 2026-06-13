// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/hooks/useAtributo.ts
//
// Hook para cargar un Atributo individual + permitir guardarlo. Mantiene
// estado local del form (dirty) para que el detail view edite "in place" sin
// usar un modal Bootstrap como en el monolito.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtributosApi } from "../api/atributos-api";
import type { Atributo, AtributoUpdatePayload } from "../types/atributo-types";

export interface UseAtributoReturn {
    /** Atributo cargado desde el backend, o null si no cargó. */
    atributo: Atributo | null;
    /** Versión editable (refleja cambios locales sin guardar). */
    draft: Atributo | null;
    /** True si el draft difiere del atributo cargado. */
    dirty: boolean;
    /** True mientras corre el fetch inicial o un reload. */
    loading: boolean;
    /** True mientras corre un save (`PUT`). */
    saving: boolean;
    /** Mensaje de error del último fetch o save. */
    error: string | null;
    /** Actualiza un campo del draft. */
    setField: <K extends keyof Atributo>(key: K, value: Atributo[K]) => void;
    /** Re-fetch del atributo. */
    reload: () => Promise<void>;
    /** Guarda el draft. Si éxito, sincroniza `atributo` con el draft. */
    save: () => Promise<boolean>;
    /** Descarta cambios — `draft` vuelve a `atributo`. */
    discard: () => void;
}

export function useAtributo(id: number | string | undefined | null): UseAtributoReturn {
    const api = useAtributosApi();
    const [atributo, setAtributo] = useState<Atributo | null>(null);
    const [draft, setDraft] = useState<Atributo | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reqIdRef = useRef(0);

    const reload = useCallback(async () => {
        if (id === undefined || id === null || id === "") {
            setAtributo(null);
            setDraft(null);
            return;
        }
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(id);
            if (reqIdRef.current !== reqId) return;
            setAtributo(data);
            setDraft(data);
        } catch (e) {
            if (reqIdRef.current !== reqId) return;
            setAtributo(null);
            setDraft(null);
            setError((e as Error)?.message ?? "Error cargando atributo");
        } finally {
            if (reqIdRef.current === reqId) setLoading(false);
        }
    }, [api, id]);

    useEffect(() => {
        reload();
    }, [reload]);

    const setField = useCallback<UseAtributoReturn["setField"]>((key, value) => {
        setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    }, []);

    const discard = useCallback(() => {
        setDraft(atributo);
    }, [atributo]);

    const save = useCallback(async (): Promise<boolean> => {
        if (!draft?.id) return false;
        setSaving(true);
        setError(null);
        try {
            const body: AtributoUpdatePayload = {
                nombre: draft.nombre,
                es_obligatorio: draft.esObligatorio ?? false,
                nivel_herencia: draft.nivelHerencia ?? "global",
                unidad_medida: draft.unidadMedida ?? null,
                activo: draft.activo ?? true,
            };
            await api.update(draft.id, body);
            setAtributo(draft);
            return true;
        } catch (e) {
            setError((e as Error)?.message ?? "Error guardando atributo");
            return false;
        } finally {
            setSaving(false);
        }
    }, [api, draft]);

    const dirty =
        draft !== null &&
        atributo !== null &&
        (draft.nombre !== atributo.nombre ||
            draft.esObligatorio !== atributo.esObligatorio ||
            draft.nivelHerencia !== atributo.nivelHerencia ||
            draft.unidadMedida !== atributo.unidadMedida ||
            draft.activo !== atributo.activo);

    return {
        atributo,
        draft,
        dirty,
        loading,
        saving,
        error,
        setField,
        reload,
        save,
        discard,
    };
}
