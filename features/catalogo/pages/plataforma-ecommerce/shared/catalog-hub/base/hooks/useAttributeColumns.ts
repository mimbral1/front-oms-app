// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/hooks/useAttributeColumns.ts
//
// Pieza H (grilla Excel) · Unit 1 — Reúne los `category_id` efectivos distintos
// de las filas, trae los atributos ML por categoría (con memo en cliente), y
// devuelve las columnas de atributos unidas (unión heterogénea entre
// categorías) más un predicado `appliesTo(attrId, categoryId)` que indica si un
// atributo aplica a una categoría dada.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePublicarApi } from "../../../publicar/base/api/publicar-api";
import type { PublicarAttribute } from "../../../publicar/base/types/publicar-types";
import { effectiveValue } from "../lib/grid-logic";
import type { GridColumn, GridRow, Edits } from "../types/grid-types";

// Comunes promovidos a columnas fijas / MedidasGroup → no se duplican como atributo.
const COMMON_PROMOTED_IDS = new Set<string>([
  "BRAND", "GTIN",
  "SELLER_PACKAGE_LENGTH", "SELLER_PACKAGE_WIDTH", "SELLER_PACKAGE_HEIGHT", "SELLER_PACKAGE_WEIGHT",
]);

function mlTypeToColumnType(vt?: string): GridColumn["type"] {
  switch (vt) {
    case "boolean": return "boolean";
    case "list": return "list";
    case "number_unit": return "number_unit";
    case "number": return "number";
    default: return "string";
  }
}
function attrToColumn(attr: PublicarAttribute): GridColumn {
  return {
    key: attr.id,
    label: attr.name ?? attr.id,
    group: "categoria",
    type: mlTypeToColumnType(attr.value_type),
    required: !!attr.required,
    options: attr.values && attr.values.length ? attr.values.map((v) => ({ id: v.id, name: v.name })) : null,
    unit: attr.units && attr.units.length ? attr.units : null,
  };
}

export interface UseAttributeColumnsReturn {
  attributeColumns: GridColumn[];
  appliesTo: (attrId: string, categoryId: string | null | undefined) => boolean;
  loading: boolean;
  error: string | null;
}

export function useAttributeColumns(rows: GridRow[], edits: Edits): UseAttributeColumnsReturn {
  const { fetchMlCategoryAttributes } = usePublicarApi();
  const cacheRef = useRef<Map<string, Promise<PublicarAttribute[]>>>(new Map());
  const [byCategory, setByCategory] = useState<Map<string, PublicarAttribute[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clave string estable del conjunto de categorías efectivas. Como `categoryIds`
  // alimenta `attributeColumns` (y, aguas abajo, las `columns` de FlujoDataGrid),
  // derivarlo de una clave string evita producir un array nuevo en cada tecleo:
  // solo cambia la referencia cuando cambia el conjunto de categorías, no en cada
  // edición de cualquier celda. Los ids de categoría ML (MLCxxxx) no contienen "|".
  const categoryKey = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      const c = effectiveValue(r, edits, "category_id");
      if (c != null && c !== "") s.add(String(c));
    }
    return Array.from(s).sort().join("|");
  }, [rows, edits]);

  const categoryIds = useMemo(
    () => (categoryKey ? categoryKey.split("|") : []),
    [categoryKey],
  );

  useEffect(() => {
    let ignore = false;
    const missing = categoryIds.filter((id) => !byCategory.has(id));
    if (!missing.length) return;
    setLoading(true);
    setError(null);
    Promise.all(
      missing.map(async (id) => {
        let p = cacheRef.current.get(id);
        if (!p) {
          p = fetchMlCategoryAttributes(id)
            .then((a) => [...a] as PublicarAttribute[])
            .catch(() => [] as PublicarAttribute[]);
          cacheRef.current.set(id, p);
        }
        return [id, await p] as const;
      }),
    )
      .then((pairs) => {
        if (ignore) return;
        setByCategory((prev) => {
          const next = new Map(prev);
          for (const [id, attrs] of pairs) next.set(id, attrs);
          return next;
        });
        setLoading(false);
      })
      .catch((e) => {
        if (!ignore) { setError((e as Error)?.message ?? "Error cargando atributos"); setLoading(false); }
      });
    return () => { ignore = true; };
  }, [categoryIds, byCategory, fetchMlCategoryAttributes]);

  const { attributeColumns, membership } = useMemo(() => {
    const unionById = new Map<string, PublicarAttribute>();
    const membership = new Map<string, Set<string>>();
    for (const id of categoryIds) {
      const attrs = byCategory.get(id) ?? [];
      const set = new Set<string>();
      for (const a of attrs) {
        if (COMMON_PROMOTED_IDS.has(a.id)) continue;
        set.add(a.id);
        if (!unionById.has(a.id)) unionById.set(a.id, a);
      }
      membership.set(id, set);
    }
    return { attributeColumns: Array.from(unionById.values()).map(attrToColumn), membership };
  }, [categoryIds, byCategory]);

  const appliesTo = useMemo(
    () => (attrId: string, categoryId: string | null | undefined) =>
      categoryId ? membership.get(String(categoryId))?.has(attrId) ?? false : false,
    [membership],
  );

  return { attributeColumns, appliesTo, loading, error };
}
