// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/hooks/useFlujoGrid.ts
//
// Orquestador de carga + estado de edición de la grilla editable (Pieza E).
// Combina las tres llamadas RAW del cliente (schema → products → values) en un
// único modelo de grilla en memoria (columns + rows) y expone los mutadores de
// edición. Toda la lógica pura vive en `../lib/grid-logic` — acá solo I/O y
// estado React.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCatalogHubGridApi } from "../api/catalog-hub-grid-api";
import { applyBulk, computeKpis, isDirty } from "../lib/grid-logic";
import type {
  Edits,
  GridColumn,
  GridRow,
  N3ProductsResponse,
  SchemaColumn,
} from "../types/grid-types";

/** Cabecera del N3 (nivel 3 del árbol de categorías) que devuelve /products. */
export type N3Header = N3ProductsResponse["n3"];

/** Modo de la grilla (Pieza G). Publicar siembra la categoría predicha;
 *  Editar usa la categoría actual que viene en los values. */
export type GridModo = "publicar" | "editar";

/** Una sugerencia top-N de categoría ML (para el dropdown de categoría — Unit 2).
 *  `id` es el id de categoría ML (en el backend viene como `categoria`). */
export interface PrediccionTop {
  id: string;
  nombre: string;
  confianza?: number;
}

/** Predicción de categoría ML por SKU para alimentar las SUGERENCIAS del
 *  dropdown de categoría (Unit 2). NO se usa para sembrar la categoría base
 *  (eso lo hace la cascada validada). Best-effort: si falla la carga, el mapa
 *  queda vacío y el dropdown simplemente no muestra sugerencias. */
export interface PrediccionSkuUi {
  mlCategoriaIdPredicha?: string | null;
  mlCategoriaNombrePredicha?: string | null;
  top3?: PrediccionTop[];
}

export interface UseFlujoGridReturn {
  columns: GridColumn[];
  rows: GridRow[];
  edits: Edits;
  loading: boolean;
  error: string | null;
  warnings: string[];
  n3Header: N3Header | null;
  /** Sugerencias top-N de categoría ML por SKU (Unit 2). Vacío si no cargó. */
  prediccionesBySku: Record<string, PrediccionSkuUi>;
  setEdit: (sku: string, key: string, value: unknown) => void;
  applyBulkEdit: (skus: string[], key: string, value: unknown) => void;
  /** Escribe muchas celdas (sku,key,value) en UNA sola actualización de estado —
   *  para bulk-ops (fill/clear/Ctrl+D) sin O(N²) ni N re-renders. */
  applyEdits: (entries: Array<{ sku: string; key: string; value: unknown }>) => void;
  /** Pieza G — cambia la categoría ML de una fila (vía edits). Escribe
   *  `values.category_id` + `values.category_nombre`. */
  setCategoria: (sku: string, cat: { id: string; nombre?: string | null }) => void;
  kpis: ReturnType<typeof computeKpis>;
  dirty: boolean;
  reload: () => Promise<void>;
}

/** Las columnas de control (launchers) que siempre se agregan al final.
 *  Pieza H — los atributos de categoría se editan INLINE en la grilla (vía
 *  useAttributeColumns), por eso ya no existe el launcher `__atributos`. El
 *  launcher `__variaciones` también se retiró: el rework de la grilla
 *  (GridCellExcel) no lo renderiza y los contratos C/D no traen variaciones. */
const CONTROL_COLUMNS: GridColumn[] = [
  { key: "__imagenes", label: "Imágenes", group: "control", type: "string", launcher: "imagenes" },
];

/** Mapea una SchemaColumn (RAW backend) a GridColumn, marcando el launcher de
 *  descripción sobre la columna cuya key es exactamente "descripcion". */
function schemaToGridColumn(col: SchemaColumn): GridColumn {
  const base: GridColumn = { ...col, group: col.group };
  if (col.key === "descripcion") base.launcher = "descripcion";
  return base;
}

export function useFlujoGrid(
  flujoId: number | string,
  n3Id?: string,
  modo: GridModo = "publicar",
): UseFlujoGridReturn {
  const api = useCatalogHubGridApi();

  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [edits, setEdits] = useState<Edits>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [n3Header, setN3Header] = useState<N3Header | null>(null);
  const [prediccionesBySku, setPrediccionesBySku] = useState<Record<string, PrediccionSkuUi>>({});

  const load = useCallback(async () => {
    if (!n3Id) {
      // Sin N3 seleccionado: estado vacío, sin spinner ni error.
      setColumns([]);
      setRows([]);
      setEdits({});
      setWarnings([]);
      setN3Header(null);
      setPrediccionesBySku({});
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Schema → columnas. Pieza G: el backend devuelve solo el set COMÚN
      //    (sin grupo `categoria`; la categoría ML es por SKU). Armamos la
      //    grilla con las columnas comunes + los controles (launchers).
      const schema = await api.getN3Schema(n3Id);
      const schemaWarnings = schema.warnings ?? [];
      const gridColumns: GridColumn[] = [
        ...schema.columns.map(schemaToGridColumn),
        ...CONTROL_COLUMNS,
      ];
      setColumns(gridColumns);

      // 2. Products → filas base + cabecera N3 + universo de SKUs. U3: los
      //    productos se cargan POR FLUJO (membresía) en vez de toda la N3. El
      //    shape de respuesta es idéntico al de getN3Products (mismo N3ProductsResponse).
      const productsRes = await api.getFlujoProducts(flujoId, { pageSize: 500 });
      setN3Header(productsRes.n3 ?? null);
      const products = productsRes.products ?? [];
      const skus = products.map((p) => p.sku);

      // 3. Values → atributos por SKU. Tolerante a `valores_no_disponibles` /
      //    `publication_state_unavailable`: si falta el value de un SKU usamos
      //    defaults sanos (nunca dejamos la fila en blanco).
      const valuesRes = skus.length > 0 ? await api.getN3Values(n3Id, skus) : { valuesBySku: {} };
      const valuesBySku = valuesRes.valuesBySku ?? {};

      const gridRows: GridRow[] = products.map((p) => {
        const v = valuesBySku[p.sku];
        return {
          sku: p.sku,
          nombre: p.nombre,
          itemId: p.item_id,
          publishStatus: p.publish_status,
          mlStatus: p.ml_status,
          categoriaDivergente: v?.categoria_divergente ?? false,
          fuente: v?.fuente ?? "desconocido",
          // En Editar, `getN3Values` ya trae `category_id` (+ nombre) en values.
          // El overlay del flujo (ediciones/imágenes guardadas con saveItems) se
          // superpone ENCIMA del N3 maestro para que persista al recargar.
          values: { ...(v?.values ?? {}), ...(p.overlay ?? {}) },
        };
      });

      // 4. Pieza G — siembra de categoría por fila (modo Publicar). UNA sola
      //    llamada batch (cero cuota ML) resuelve la categoría por SKU con la
      //    CASCADA VALIDADA del N3 (la misma del wizard: P0_excepcion →
      //    P3_tipo_producto → P3.5_prediccion_ml → P4_canonico), evitando las
      //    categorías absurdas de la predicción cruda. La sembramos como
      //    baseline en `values.category_id`/`category_nombre` SOLO en filas que
      //    todavía no tienen categoría. Como baseline (no edit), una categoría
      //    intacta no marca la fila como sucia; al corregirla con `setCategoria`
      //    sí se crea un edit. El endpoint devuelve todo el N3 (sin paginación).
      //    En Editar la categoría ya viene de los values, así que no la pedimos.
      const predictionWarnings: string[] = [];
      if (modo === "publicar" && skus.length > 0) {
        try {
          const cascadeRes = await api.getN3CascadeCategorias(n3Id);
          const bySku = new Map(
            (cascadeRes.data ?? []).map((d) => [d.sku, d] as const),
          );
          for (const row of gridRows) {
            const hasCategory = row.values.category_id != null
              && String(row.values.category_id).trim() !== "";
            if (hasCategory) continue;
            const hit = bySku.get(row.sku);
            if (hit?.categoria_id) {
              row.values = {
                ...row.values,
                category_id: hit.categoria_id,
                category_nombre: hit.categoria_nombre ?? null,
              };
            }
          }
        } catch (e) {
          // La siembra es best-effort: si falla (red/cuota) la grilla queda
          // usable y el usuario asigna la categoría con el buscador (Unit 3).
          predictionWarnings.push(
            `categorias_no_disponibles: ${(e as Error)?.message ?? "error"}`,
          );
        }
      }

      // Unit 1/2 — sugerencias top-N de categoría ML por SKU para el dropdown
      // de categoría (modo Publicar). Best-effort, batch, CERO cuota ML (lee el
      // snapshot `predicciones_ml` del backend). NO toca la siembra por cascada
      // de arriba: esto es solo para mostrar SUGERENCIAS en el dropdown. Si
      // falla, el mapa queda vacío y el dropdown no muestra sugerencias.
      let predBySku: Record<string, PrediccionSkuUi> = {};
      if (modo === "publicar" && skus.length > 0) {
        try {
          const pred = await api.getPredicciones(n3Id, { pageSize: 500 });
          const next: Record<string, PrediccionSkuUi> = {};
          for (const p of pred.data ?? []) {
            // `top3` no está tipado en el cliente (el backend sí lo devuelve:
            // `[{ categoria, nombre, confianza }]`). Lo leemos con un acceso
            // estrecho y normalizamos `categoria` → `id`.
            const rawTop3 = (p as { top3?: Array<{ categoria?: string | null; nombre?: string | null; confianza?: number | null }> }).top3;
            const top3: PrediccionTop[] = Array.isArray(rawTop3)
              ? rawTop3
                  .filter((t): t is { categoria: string; nombre?: string | null; confianza?: number | null } =>
                    t != null && typeof t.categoria === "string" && t.categoria.trim() !== "")
                  .map((t) => ({
                    id: t.categoria,
                    nombre: t.nombre ?? "",
                    confianza: t.confianza ?? undefined,
                  }))
              : [];
            next[p.sku] = {
              mlCategoriaIdPredicha: p.mlCategoriaIdPredicha ?? null,
              mlCategoriaNombrePredicha: p.mlCategoriaNombrePredicha ?? null,
              top3,
            };
          }
          predBySku = next;
        } catch {
          // Best-effort: dropdown sin sugerencias.
          predBySku = {};
        }
      }
      setPrediccionesBySku(predBySku);

      setRows(gridRows);

      // Acumulamos warnings de schema + products + values + predicciones
      // (deduplicados).
      const allWarnings = Array.from(
        new Set([
          ...schemaWarnings,
          ...(productsRes.warnings ?? []),
          ...(valuesRes.warnings ?? []),
          ...predictionWarnings,
        ]),
      );
      setWarnings(allWarnings);

      // Las ediciones pendientes se descartan en una recarga explícita —
      // partimos siempre de los valores frescos del backend.
      setEdits({});
    } catch (e) {
      setError((e as Error)?.message ?? "No se pudo cargar la grilla.");
    } finally {
      setLoading(false);
    }
  }, [api, flujoId, n3Id, modo]);

  useEffect(() => {
    void load();
  }, [load]);

  const setEdit = useCallback((sku: string, key: string, value: unknown) => {
    setEdits((e) => ({ ...e, [sku]: { ...(e[sku] ?? {}), [key]: value } }));
  }, []);

  const applyBulkEdit = useCallback((skus: string[], key: string, value: unknown) => {
    setEdits((e) => applyBulk(e, skus, key, value));
  }, []);

  // Bulk genérico: UNA sola actualización para muchas (sku,key,value). Evita el
  // O(N²) de llamar setEdit en loop (cada uno hace un spread completo de edits).
  const applyEdits = useCallback(
    (entries: Array<{ sku: string; key: string; value: unknown }>) => {
      if (!entries.length) return;
      setEdits((e) => {
        const next: Edits = { ...e };
        for (const { sku, key, value } of entries) {
          next[sku] = { ...(next[sku] ?? {}), [key]: value };
        }
        return next;
      });
    },
    [],
  );

  // Pieza G — la categoría por fila se cambia vía edits (category_id + nombre),
  // para que el cambio sea trackeable (dirty) y persista con `saveItems`.
  const setCategoria = useCallback(
    (sku: string, cat: { id: string; nombre?: string | null }) => {
      setEdits((e) => ({
        ...e,
        [sku]: {
          ...(e[sku] ?? {}),
          category_id: cat.id,
          category_nombre: cat.nombre ?? null,
        },
      }));
    },
    [],
  );

  const kpis = useMemo(() => computeKpis(rows, columns, edits), [rows, columns, edits]);
  const dirty = useMemo(() => isDirty(edits), [edits]);

  return {
    columns,
    rows,
    edits,
    loading,
    error,
    warnings,
    n3Header,
    prediccionesBySku,
    setEdit,
    applyBulkEdit,
    applyEdits,
    setCategoria,
    kpis,
    dirty,
    reload: load,
  };
}
