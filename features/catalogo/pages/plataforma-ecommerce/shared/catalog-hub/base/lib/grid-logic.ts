// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/lib/grid-logic.ts
//
// Lógica pura de la grilla editable (Pieza E). Sin React, sin I/O — solo
// transformaciones deterministas sobre el modelo de grilla. Esto permite
// testear/razonar la validación y los KPIs sin montar la UI.

import type { GridColumn, GridRow, Edits, RowStatus } from "../types/grid-types";
import type { PublicarAttribute } from "../../../publicar/base/types/publicar-types";

/**
 * Mapea una columna de la grilla al shape `PublicarAttribute` que consume
 * `AttrInput` (el editor dinámico compartido con el wizard de publicar).
 *
 * `PublicarAttribute["value_type"]` no contempla `"textarea"`; AttrInput cae a
 * su control de texto (`"string"`) cuando el tipo no es boolean/number/list/
 * multi_list/number_unit. Por eso colapsamos `"text"` y `"textarea"` a
 * `"string"` — la grilla monta su propio textarea aparte.
 */
export function columnToAttr(col: GridColumn): PublicarAttribute {
  const valueType: PublicarAttribute["value_type"] =
    col.type === "text" || col.type === "textarea" ? "string" : col.type;
  return {
    id: col.key,
    name: col.label,
    required: !!col.required,
    value_type: valueType,
    values: col.options ?? undefined,
    units: col.unit ?? undefined,
    default_unit: col.unit?.[0],
  };
}

/**
 * Valor efectivo de una celda: la edición pendiente (si existe la clave en el
 * mapa de edits del SKU) tiene prioridad sobre el valor original de la fila.
 */
export function effectiveValue(row: GridRow, edits: Edits, key: string): unknown {
  const e = edits[row.sku];
  if (e && Object.prototype.hasOwnProperty.call(e, key)) return e[key];
  return row.values?.[key];
}

function isEmpty(v: unknown): boolean {
  return v == null || v === "" || (Array.isArray(v) && v.length === 0);
}

/**
 * Valida una fila contra el esquema de columnas, considerando ediciones
 * pendientes. `error` si falta algún requerido; `warn` si está completa pero
 * la categoría diverge o la publicación está en error; `ok` en caso contrario.
 */
export function validateRow(
  row: GridRow,
  columns: GridColumn[],
  edits: Edits,
): { status: RowStatus; missing: string[] } {
  const missing: string[] = [];
  for (const col of columns) {
    if (col.group === "control") continue;
    if (col.required && isEmpty(effectiveValue(row, edits, col.key))) missing.push(col.key);
  }
  if (missing.length > 0) return { status: "error", missing };
  if (row.categoriaDivergente || row.publishStatus === "error") return { status: "warn", missing };
  return { status: "ok", missing };
}

/** Agrega los estados de todas las filas en contadores para las KPI cards. */
export function computeKpis(rows: GridRow[], columns: GridColumn[], edits: Edits) {
  let ok = 0,
    warn = 0,
    error = 0;
  for (const r of rows) {
    const s = validateRow(r, columns, edits).status;
    if (s === "ok") ok++;
    else if (s === "warn") warn++;
    else error++;
  }
  return { total: rows.length, ok, warn, error };
}

/** Aplica una edición masiva (misma clave/valor) a un conjunto de SKUs. */
export function applyBulk(edits: Edits, skus: string[], key: string, value: unknown): Edits {
  const next: Edits = { ...edits };
  for (const sku of skus) next[sku] = { ...(next[sku] ?? {}), [key]: value };
  return next;
}

/** Cantidad total de celdas con edición pendiente. */
export function dirtyCount(edits: Edits): number {
  return Object.values(edits).reduce((n, m) => n + Object.keys(m).length, 0);
}

/** ¿Hay alguna edición pendiente? */
export function isDirty(edits: Edits): boolean {
  return dirtyCount(edits) > 0;
}
