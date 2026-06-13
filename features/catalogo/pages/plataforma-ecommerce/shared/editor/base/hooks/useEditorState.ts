// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/hooks/useEditorState.ts
//
// Hook controlador del Editor — fetch del producto + dirty tracking + save.
//
// Patrón: snapshot original (`originalProduct`) + draft de campos editados
// (`editFields`, `editAttrs`, `editImagenes`). Al guardar, se computa un
// `cambios` diff que se envía en `PUT /api/pim/productos/:sku`.
//
// Sin POST/PUT/DELETE automático: `save()` solo se invoca tras click humano
// explícito en "Guardar" (el modal de confirm vive en EditorView si es
// destructivo).

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorApi, type EditorApiError } from "../api/editor-api";
import type {
    EditorCalidad,
    EditorProduct,
    EditorSavePatch,
    EditorSaveResult,
} from "../types/editor-types";

/** Valor editable para un campo básico (titulo, precio, stock, etc). */
export type EditFieldValue = string | number | boolean | null;

/** Valor editable para un atributo dinámico. */
export type EditAttrValue = string | number | boolean | string[] | null;

export interface UseEditorStateReturn {
    /** Producto original (snapshot del backend, sin draft aplicado). */
    product: EditorProduct | null;
    /** Datos de calidad del producto (fetch paralelo a `product`). */
    calidad: EditorCalidad | null;
    /** Loading flag del fetch de calidad. */
    calidadLoading: boolean;
    /** Mapa de campos básicos editados (`titulo` → "Nuevo título"). */
    editFields: Record<string, EditFieldValue>;
    /** Mapa de atributos editados (`MODEL` → "ABC-123"). */
    editAttrs: Record<string, EditAttrValue>;
    /** Lista de URLs de imágenes (orden editable). */
    editImagenes: string[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    saveError: EditorApiError | null;
    /** Si hay cambios sin guardar. */
    dirty: boolean;
    /** Payload exacto que se enviará en PUT /api/pim/productos/:sku. */
    draftPayload: EditorSavePatch | null;
    /** Recarga producto + calidad desde backend. */
    reload: () => Promise<void>;
    /** Recarga sólo calidad (manual refresh tras editar para ver nuevo score). */
    reloadCalidad: () => Promise<void>;
    /** Editar un campo básico. NO persiste — usar `save()`. */
    updateField: (key: string, value: EditFieldValue) => void;
    /** Editar un atributo. */
    updateAttr: (id: string, value: EditAttrValue) => void;
    /** Reemplazar la lista de imágenes (drag-drop reorder, add/remove). */
    setImagenes: (urls: string[]) => void;
    /** Persistir cambios al backend. Devuelve el resultado o lanza error. */
    save: () => Promise<EditorSaveResult | null>;
    /** Descartar cambios — vuelve al snapshot original. */
    reset: () => void;
}

/** Hidrata el state de edición desde un snapshot del backend. */
function hydrateFromProduct(product: EditorProduct): {
    fields: Record<string, EditFieldValue>;
    attrs: Record<string, EditAttrValue>;
    imagenes: string[];
} {
    const fields: Record<string, EditFieldValue> = {};
    Object.entries(product.campos_basicos || {}).forEach(([key, field]) => {
        fields[key] = field?.valor ?? null;
    });

    const attrs: Record<string, EditAttrValue> = {};
    (product.atributos || []).forEach((attr) => {
        attrs[attr.id] = (attr?.valor ?? null) as EditAttrValue;
    });

    const imagenes = [...(product.imagenes?.lista ?? [])];

    return { fields, attrs, imagenes };
}

/** Computa el diff entre el snapshot original y el draft. Solo campos modificados. */
function computeChanges(
    original: EditorProduct,
    editFields: Record<string, EditFieldValue>,
    editAttrs: Record<string, EditAttrValue>,
    editImagenes: string[],
): EditorSavePatch["cambios"] {
    const cambios: EditorSavePatch["cambios"] = {};

    // Campos básicos diff
    Object.entries(editFields).forEach(([key, value]) => {
        const originalValue = original.campos_basicos?.[key]?.valor ?? null;
        if (value !== originalValue) {
            (cambios as Record<string, unknown>)[key] = value;
        }
    });

    // Imágenes diff (compara serialized)
    const origImgs = original.imagenes?.lista ?? [];
    if (JSON.stringify(origImgs) !== JSON.stringify(editImagenes)) {
        cambios.imagenes = editImagenes;
    }

    // Atributos diff
    const attrChanges: EditorSavePatch["cambios"]["atributos"] = [];
    (original.atributos || []).forEach((attr) => {
        const next = editAttrs[attr.id];
        if (next !== undefined && next !== attr.valor) {
            attrChanges.push({ id: attr.id, valor: next });
        }
    });
    if (attrChanges && attrChanges.length > 0) {
        cambios.atributos = attrChanges;
    }

    return cambios;
}

function buildSavePatch(
    product: EditorProduct,
    marketplace: string,
    editFields: Record<string, EditFieldValue>,
    editAttrs: Record<string, EditAttrValue>,
    editImagenes: string[],
): EditorSavePatch {
    const cambios = computeChanges(product, editFields, editAttrs, editImagenes);
    if (Object.keys(cambios).length > 0 && typeof product.version === "number") {
        (cambios as Record<string, unknown>).expected_version = product.version;
    }
    return { marketplace, cambios };
}

export function useEditorState(sku: string): UseEditorStateReturn {
    const api = useEditorApi();
    const [product, setProduct] = useState<EditorProduct | null>(null);
    const [calidad, setCalidad] = useState<EditorCalidad | null>(null);
    const [calidadLoading, setCalidadLoading] = useState(false);
    const [editFields, setEditFields] = useState<Record<string, EditFieldValue>>({});
    const [editAttrs, setEditAttrs] = useState<Record<string, EditAttrValue>>({});
    const [editImagenes, setEditImagenesState] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<EditorApiError | null>(null);

    /** Idempotency-key estable mientras el modal/save está "abierto". Se
     *  regenera al abrir un nuevo intento. */
    const idemKeyRef = useRef<string | null>(null);

    const skuRef = useRef(sku);
    useEffect(() => {
        skuRef.current = sku;
    }, [sku]);

    const reloadCalidad = useCallback(async () => {
        if (!skuRef.current) return;
        setCalidadLoading(true);
        try {
            const data = await api.fetchCalidad(skuRef.current);
            setCalidad(data);
        } catch (e) {
            // Calidad no debe bloquear la vista — el legacy también lo hace
            // con Promise.allSettled. Solo loggeamos.
            if (process.env.NODE_ENV !== "production") {
                console.warn("[editor] fetchCalidad falló:", e);
            }
            setCalidad(null);
        } finally {
            setCalidadLoading(false);
        }
    }, [api]);

    const reload = useCallback(async () => {
        if (!skuRef.current) return;
        setLoading(true);
        setError(null);
        try {
            // Patrón del legacy: detalle + calidad en paralelo, no bloquear si calidad falla.
            const [det, cal] = await Promise.allSettled([
                api.fetchProduct(skuRef.current),
                api.fetchCalidad(skuRef.current),
            ]);
            if (det.status === "rejected") throw det.reason;
            const data = det.value;
            setProduct(data);
            const { fields, attrs, imagenes } = hydrateFromProduct(data);
            setEditFields(fields);
            setEditAttrs(attrs);
            setEditImagenesState(imagenes);
            setCalidad(cal.status === "fulfilled" ? cal.value : null);
        } catch (e) {
            const msg = (e as Error)?.message ?? "Error al cargar el producto";
            setError(msg);
            setProduct(null);
            setCalidad(null);
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (sku) void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sku]);

    const updateField = useCallback((key: string, value: EditFieldValue) => {
        setEditFields((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateAttr = useCallback((id: string, value: EditAttrValue) => {
        setEditAttrs((prev) => ({ ...prev, [id]: value }));
    }, []);

    const setImagenes = useCallback((urls: string[]) => {
        setEditImagenesState(urls);
    }, []);

    const draftPayload = useMemo(
        () =>
            product
                ? buildSavePatch(
                      product,
                      api.marketplaceKey,
                      editFields,
                      editAttrs,
                      editImagenes,
                  )
                : null,
        [api.marketplaceKey, editAttrs, editFields, editImagenes, product],
    );

    const save = useCallback(async (): Promise<EditorSaveResult | null> => {
        if (!draftPayload) return null;
        if (Object.keys(draftPayload.cambios).length === 0) {
            return null; // nada que guardar
        }

        setSaving(true);
        setSaveError(null);
        try {
            // Regenerar key sólo si no hay una pendiente (en un retry, mantenemos la misma).
            if (!idemKeyRef.current) {
                idemKeyRef.current = api.genIdempotencyKey();
            }
            const result = await api.saveProduct(
                skuRef.current,
                draftPayload,
                { idempotencyKey: idemKeyRef.current },
            );
            // Save OK → liberamos la key (próximo save tendrá una nueva).
            idemKeyRef.current = null;
            // Refresh desde backend para tener canonical (incluye fields server-derived).
            await reload();
            return result;
        } catch (e) {
            setSaveError(e as EditorApiError);
            // NO limpiamos idemKeyRef — un retry usa la misma key (backend replay-tea).
            return null;
        } finally {
            setSaving(false);
        }
    }, [api, draftPayload, reload]);

    const reset = useCallback(() => {
        if (!product) return;
        const { fields, attrs, imagenes } = hydrateFromProduct(product);
        setEditFields(fields);
        setEditAttrs(attrs);
        setEditImagenesState(imagenes);
        idemKeyRef.current = null;
    }, [product]);

    /** Dirty si hay al menos un campo distinto del snapshot. */
    const dirty =
        draftPayload != null &&
        Object.keys(draftPayload.cambios).length > 0;

    return {
        product,
        calidad,
        calidadLoading,
        editFields,
        editAttrs,
        editImagenes,
        loading,
        saving,
        error,
        saveError,
        dirty,
        draftPayload,
        reload,
        reloadCalidad,
        updateField,
        updateAttr,
        setImagenes,
        save,
        reset,
    };
}
