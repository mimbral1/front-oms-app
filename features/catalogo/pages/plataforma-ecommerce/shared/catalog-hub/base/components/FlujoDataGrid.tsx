// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/FlujoDataGrid.tsx
//
// Pieza H (grilla Excel) · Unit 2 — La grilla del "flujo de trabajo" como un
// data-grid tipo Excel sobre @tanstack/react-table v8. Esta versión reescribe la
// PRESENTACIÓN al look del prototipo de diseño (carga-masiva-de-imagnes/project/
// grid.jsx) MANTENIENDO toda la mecánica ya construida: selección de rango 2D,
// fill (Ctrl+D), copy (Ctrl+C), type-to-edit y el resize de columnas de TanStack.
//
// Mecánica clave (ver bloque "PATRÓN meta" más abajo): los `ColumnDef` se
// construyen SOLO con dependencias estructurales (commonColumns/imagenesCol/
// hasMedidas/attributeColumns). Todo el estado volátil (edits, selección,
// handlers, celda activa, expandidas, predicciones…) viaja por
// `table.options.meta` y cada celda lo lee fresco vía el cast `as FlujoGridMeta`.
// Así editar una celda NO reconstruye el modelo de columnas → sin lag ni pérdida
// de foco sobre cientos de filas.
//
// Cero write a ML: este componente solo renderiza y dispara callbacks.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type HeaderContext,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  Calculator,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Maximize2,
} from "lucide-react";

import { effectiveValue, validateRow } from "../lib/grid-logic";
import { GridCellExcel } from "./GridCellExcel";
import { GridDropdown } from "./GridDropdown";
import { DetailPanel } from "./DetailPanel";
import type { PrediccionSkuUi } from "../hooks/useFlujoGrid";
import type { GridColumn, GridRow, Edits } from "../types/grid-types";

export interface FlujoDataGridProps {
  rows: GridRow[]; // filas en ORDEN visible (filteredRows del padre)
  commonColumns: GridColumn[]; // columnas fijo SIN medidas, EN ORDEN: titulo/precio/stock/marca/ean/descripcion
  imagenesCol: GridColumn | null; // la columna __imagenes (control); si null, no se muestra
  hasMedidas: boolean; // si el schema trae medidas → render de 4 columnas numéricas
  attributeColumns: GridColumn[]; // de useAttributeColumns (Unit 1)
  edits: Edits;
  appliesTo: (attrId: string, categoryId: string | null | undefined) => boolean;
  selected: Set<string>;
  syncBySku: Record<string, boolean>;
  allChecked: boolean;
  onToggleSelect: (sku: string) => void;
  onToggleSelectAll: () => void;
  onSetEdit: (sku: string, key: string, value: unknown) => void;
  onOpenCategoria: (sku: string) => void; // abre el buscador de categoría (modal)
  onToggleSync: (sku: string, v: boolean) => void;
  // Unit 2 — props nuevas de presentación.
  allColumns: GridColumn[]; // = grid.columns (para validateRow del Estado/Producto)
  visible: Record<string, boolean>; // show/hide por key (true/undefined = visible, false = oculta)
  highlight: boolean; // resaltar faltantes
  expanded: Set<string>; // skus con fila de detalle abierta
  onToggleExpand: (sku: string) => void;
  onOpenSidePanel: (sku: string) => void; // abre editor largo de descripción (Maximize)
  onOpenImagenes: (sku: string) => void; // abre ImagenesModal
  onOpenCalculadora: (sku: string) => void; // abre la calculadora de margen (modal) sobre la celda Precio
  calcLoadingSkus: Record<string, boolean>; // SKUs con cálculo de precio inline en curso (spinner en Precio)
  onSetCategoria: (sku: string, cat: { id: string; nombre?: string | null }) => void; // sugerencias top-3
  prediccionesBySku: Record<string, PrediccionSkuUi>;
  // Selección de rango 2D (Unit 1: useGridSelection). El arrastre marca un
  // rectángulo y la edición llena la columna del anchor en las filas del rango.
  initialChar: string | null;
  isInRange: (sku: string, key: string) => boolean;
  isAnchor: (sku: string, key: string) => boolean;
  onBeginSelect: (sku: string, key: string, shift: boolean) => void;
  onExtendSelect: (sku: string, key: string) => void;
  onCommitEdit: (value: unknown) => void;
  // Edición tipo Excel (doble clic / Enter / F2).
  editing: { sku: string; key: string } | null;
  onStartEdit: (sku: string, key: string) => void;
  onStopEdit: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Estado de publicación → texto (sin pill, estilo OMS). */
const PUBLISH_LABEL: Record<string, string> = {
  publicado: "Publicado",
  en_proceso: "En proceso",
  error: "Con error",
  pausado: "Pausado",
  no_publicado: "Sin publicar",
  desconocido: "Sin dato",
};
/** Estado de publicación → color de texto. */
const PUBLISH_COLOR: Record<string, string> = {
  publicado: "text-emerald-700",
  en_proceso: "text-blue-700",
  error: "text-rose-700",
  pausado: "text-amber-700",
  no_publicado: "text-gray-500",
  desconocido: "text-gray-400",
};
/** Vacío "blando": null/""/array vacío. Espeja el isEmpty interno de grid-logic. */
function isEmptyish(v: unknown): boolean {
  return v == null || v === "" || (Array.isArray(v) && v.length === 0);
}

/**
 * PATRÓN meta — todo el estado volátil de la grilla. Se re-crea cada render
 * (eso está bien, es su propósito) y cada cell/header renderer lo lee fresco vía
 * el cast `as FlujoGridMeta` sobre `table.options.meta`.
 */
interface FlujoGridMeta {
  edits: Edits;
  appliesTo: (attrId: string, categoryId: string | null | undefined) => boolean;
  selected: Set<string>;
  syncBySku: Record<string, boolean>;
  allChecked: boolean;
  initialChar: string | null;
  editing: { sku: string; key: string } | null;
  allColumns: GridColumn[];
  highlight: boolean;
  expanded: Set<string>;
  prediccionesBySku: Record<string, PrediccionSkuUi>;
  hasMedidas: boolean;
  attributeColumns: GridColumn[];
  onSetEdit: (sku: string, key: string, value: unknown) => void;
  onOpenCategoria: (sku: string) => void;
  onToggleSync: (sku: string, v: boolean) => void;
  onToggleSelect: (sku: string) => void;
  onToggleSelectAll: () => void;
  onToggleExpand: (sku: string) => void;
  onOpenSidePanel: (sku: string) => void;
  onOpenImagenes: (sku: string) => void;
  onOpenCalculadora: (sku: string) => void;
  calcLoadingSkus: Record<string, boolean>;
  onSetCategoria: (sku: string, cat: { id: string; nombre?: string | null }) => void;
  isInRange: (sku: string, key: string) => boolean;
  isAnchor: (sku: string, key: string) => boolean;
  onBeginSelect: (sku: string, key: string, shift: boolean) => void;
  onExtendSelect: (sku: string, key: string) => void;
  onCommitEdit: (value: unknown) => void;
  onStartEdit: (sku: string, key: string) => void;
  onStopEdit: () => void;
}

/** Lee la meta tipada desde el contexto de celda/cabecera (cast local). */
function readMeta<T extends { table: { options: { meta?: unknown } } }>(ctx: T): FlujoGridMeta {
  return ctx.table.options.meta as FlujoGridMeta;
}

/** Categoría efectiva de una fila (edit sobre base), normalizada a string|null. */
function rowCategoryId(row: GridRow, edits: Edits): string | null {
  const id = effectiveValue(row, edits, "category_id");
  return id != null && String(id).trim() !== "" ? String(id) : null;
}

// IDs sintéticos de las columnas que no salen de `commonColumns`/atributos.
const COL_SELECT = "__select";
const COL_PRODUCTO = "__producto";
const COL_ESTADO = "__estado";
const COL_CATEGORIA = "__categoria";
const COL_SYNC = "__sync";

// Las medidas son 4 columnas numéricas planas (mismo contrato backend). El id de
// cada columna ES su key.
// Medidas del PAQUETE (lo que ML usa para envío y la calculadora). Etiquetadas
// "paq." para distinguirlas de las medidas del PRODUCTO (atributos _TOTAL).
const MEDIDAS_COLS: { key: string; label: string }[] = [
  { key: "seller_package_length", label: "Largo paq. (cm)" },
  { key: "seller_package_width", label: "Ancho paq. (cm)" },
  { key: "seller_package_height", label: "Alto paq. (cm)" },
  { key: "seller_package_weight", label: "Peso paq. (g)" },
];

// Anchos sticky de las 2 primeras columnas (deben coincidir con `size` abajo).
const W_SELECT = 40;
const W_PRODUCTO = 260;

/** Toggle de sincronización (port de `SyncToggle` del prototipo). */
function SyncToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={on ? "Sincronización activada" : "Sincronización desactivada"}
      className="inline-flex items-center"
    >
      <span
        className={[
          "relative h-5 w-9 rounded-full transition-colors",
          on ? "bg-[#c7cadb]" : "bg-gray-200",
        ].join(" ")}
        aria-hidden
      >
        <span
          className={[
            "absolute top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-all",
            on ? "left-0.5" : "left-[18px]",
          ].join(" ")}
        >
          {on && <Check size={10} className="text-[#5b61a8]" strokeWidth={3} />}
        </span>
      </span>
    </button>
  );
}

/** Wrapper de celda tipo Excel: arrastrar marca el rango 2D (tinte azul), doble
 *  clic edita. El anchor lleva un borde azul. Sin handle de fill. */
function ExcelCellShell({ sku, colKey, meta, isEditing, children }: {
  sku: string; colKey: string; meta: FlujoGridMeta; isEditing: boolean; children: React.ReactNode;
}) {
  const inRange = meta.isInRange(sku, colKey);
  const anchor = meta.isAnchor(sku, colKey);
  return (
    <div
      onMouseDown={(e) => meta.onBeginSelect(sku, colKey, e.shiftKey)}
      onMouseEnter={() => meta.onExtendSelect(sku, colKey)}
      onDoubleClick={() => meta.onStartEdit(sku, colKey)}
      className={[
        "relative h-full w-full select-none",
        inRange && !isEditing ? "bg-blue-100/60" : "",
        anchor && !isEditing ? "ring-1 ring-inset ring-blue-500" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Punto de estado (Producto/Estado): emerald/amber/rose según validateRow. */
function statusDotClass(status: "ok" | "warn" | "error"): string {
  return status === "ok" ? "bg-emerald-500" : status === "warn" ? "bg-amber-400" : "bg-rose-400";
}

export function FlujoDataGrid({
  rows,
  commonColumns,
  imagenesCol,
  hasMedidas,
  attributeColumns,
  edits,
  appliesTo,
  selected,
  syncBySku,
  allChecked,
  onToggleSelect,
  onToggleSelectAll,
  onSetEdit,
  onOpenCategoria,
  onToggleSync,
  allColumns,
  visible,
  highlight,
  expanded,
  onToggleExpand,
  onOpenSidePanel,
  onOpenImagenes,
  onOpenCalculadora,
  calcLoadingSkus,
  onSetCategoria,
  prediccionesBySku,
  initialChar,
  isInRange,
  isAnchor,
  onBeginSelect,
  onExtendSelect,
  onCommitEdit,
  editing,
  onStartEdit,
  onStopEdit,
}: FlujoDataGridProps) {
  // Descripción se saca del loop de comunes: se renderiza como celda especial
  // (input inline + Maximize), no por ExcelCellShell.
  const descCol = useMemo(
    () => commonColumns.find((c) => c.key === "descripcion") ?? null,
    [commonColumns],
  );
  const textCommon = useMemo(
    () => commonColumns.filter((c) => c.key !== "descripcion"),
    [commonColumns],
  );

  // ── Columnas: SOLO dependencias estructurales (nada volátil acá). ──────────
  const columns = useMemo<ColumnDef<GridRow>[]>(() => {
    const defs: ColumnDef<GridRow>[] = [];

    // 1) Selección (sticky left:0, no redimensionable).
    defs.push({
      id: COL_SELECT,
      size: W_SELECT,
      minSize: W_SELECT,
      maxSize: W_SELECT,
      enableResizing: false,
      header: (ctx: HeaderContext<GridRow, unknown>) => {
        const m = readMeta(ctx);
        return (
          <input
            type="checkbox"
            checked={m.allChecked}
            onChange={m.onToggleSelectAll}
            aria-label="Seleccionar todo"
            className="accent-blue-600 h-3.5 w-3.5 align-middle"
          />
        );
      },
      cell: (ctx: CellContext<GridRow, unknown>) => {
        const m = readMeta(ctx);
        const sku = ctx.row.original.sku;
        return (
          <input
            type="checkbox"
            checked={m.selected.has(sku)}
            onChange={() => m.onToggleSelect(sku)}
            aria-label={`Seleccionar ${sku}`}
            className="accent-blue-600 h-3.5 w-3.5 align-middle"
          />
        );
      },
    });

    // 2) Producto (sticky left:W_SELECT) — chevron expandir + punto estado +
    //    nombre + sku + "Nuevo".
    defs.push({
      id: COL_PRODUCTO,
      header: "Producto",
      size: W_PRODUCTO,
      minSize: 180,
      cell: (ctx: CellContext<GridRow, unknown>) => {
        const m = readMeta(ctx);
        const row = ctx.row.original;
        const isNew = row.itemId == null;
        const isOpen = m.expanded.has(row.sku);
        const st = validateRow(row, m.allColumns, m.edits);
        return (
          <div className="flex items-start gap-1.5 px-2 py-1.5">
            <button
              type="button"
              onClick={() => m.onToggleExpand(row.sku)}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200/70 hover:text-gray-700"
              title={isOpen ? "Contraer" : "Expandir detalle"}
              aria-expanded={isOpen}
            >
              <ChevronRight
                size={14}
                className={["transition-transform", isOpen ? "rotate-90" : ""].join(" ")}
              />
            </button>
            <span className={["mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass(st.status)].join(" ")} />
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium leading-snug text-gray-800" title={row.nombre}>
                {row.nombre}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="font-mono text-[10.5px] tabular-nums text-gray-500">{row.sku}</span>
                {isNew ? (
                  <span className="text-[10.5px] font-medium text-indigo-700">Nuevo</span>
                ) : (
                  <span className={["text-[10.5px]", PUBLISH_COLOR[row.publishStatus] ?? "text-gray-500"].join(" ")}>
                    {PUBLISH_LABEL[row.publishStatus] ?? row.publishStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    });

    // 3) Estado (validateRow → Listo / Revisar categoría / Faltan N).
    defs.push({
      id: COL_ESTADO,
      header: "Estado",
      size: 150,
      minSize: 90,
      cell: (ctx: CellContext<GridRow, unknown>) => {
        const m = readMeta(ctx);
        const row = ctx.row.original;
        const st = validateRow(row, m.allColumns, m.edits);
        if (st.status === "ok") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 text-[12px] font-medium text-emerald-600">
              <CheckCircle size={14} /> Listo
            </span>
          );
        }
        if (st.status === "warn") {
          // warn = categoría divergente (prioridad) o publicación en error.
          const label = row.categoriaDivergente ? "Revisar categoría" : "Revisar publicación";
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 text-[12px] font-medium text-amber-600"
              title={label}
            >
              <AlertTriangle size={14} /> {label}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 text-[12px] font-medium tabular-nums text-rose-600">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Faltan {st.missing.length}
          </span>
        );
      },
    });

    // 4) Columnas comunes NO-launcher (titulo/precio/stock/marca/ean) → vía
    //    ExcelCellShell + GridCellExcel (rango editable). Descripción va aparte.
    textCommon.forEach((col) => {
      defs.push({
        id: col.key,
        size: 150,
        minSize: 70,
        header: () => (
          <span>
            {col.label}
            {col.required && (
              <span className="ml-0.5 text-rose-500" aria-hidden>
                ●
              </span>
            )}
          </span>
        ),
        cell: (ctx: CellContext<GridRow, unknown>) => {
          const m = readMeta(ctx);
          const row = ctx.row.original;
          const value = effectiveValue(row, m.edits, col.key);
          const invalid = !!col.required && isEmptyish(value);
          const isEditing = m.editing?.sku === row.sku && m.editing?.key === col.key;
          return (
            <ExcelCellShell sku={row.sku} colKey={col.key} meta={m} isEditing={isEditing}>
              <GridCellExcel
                column={col}
                value={value}
                invalid={invalid}
                highlight={m.highlight}
                editing={isEditing}
                initialChar={isEditing ? m.initialChar : null}
                onStartEdit={() => m.onStartEdit(row.sku, col.key)}
                onCommit={(v) => m.onCommitEdit(v)}
                onCancel={m.onStopEdit}
              />
              {/* Launcher de la calculadora de margen (solo en Precio). Abre el
                  modal con el snapshot de la fila → al confirmar setea el precio. */}
              {col.key === "precio" && !isEditing && (
                m.calcLoadingSkus[row.sku] ? (
                  <span
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-500"
                    title="Calculando precio…"
                  >
                    <Loader2 size={13} className="animate-spin" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      m.onOpenCalculadora(row.sku);
                    }}
                    title="Calculadora de margen"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  >
                    <Calculator size={13} />
                  </button>
                )
              )}
            </ExcelCellShell>
          );
        },
      });
    });

    // 5) Categoría ML (dropdown con sugerencias top-3 + "Buscar más…").
    defs.push({
      id: COL_CATEGORIA,
      header: "Categoría ML",
      size: 200,
      minSize: 90,
      cell: (ctx: CellContext<GridRow, unknown>) => {
        const m = readMeta(ctx);
        const row = ctx.row.original;
        const catId = rowCategoryId(row, m.edits);
        const nombre = effectiveValue(row, m.edits, "category_nombre");
        const catNombre = nombre != null ? String(nombre) : null;
        const display = catNombre || catId;
        const divergente = row.categoriaDivergente;
        const top3 = m.prediccionesBySku[row.sku]?.top3 ?? [];
        return (
          <GridDropdown
            width={260}
            trigger={(_open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                title={catId ? `${catNombre ?? catId} (${catId})` : "Sin categoría — clic para asignar"}
                className={[
                  "flex h-9 w-full items-center gap-1 px-2 text-left text-[12.5px] outline-none",
                  divergente ? "bg-amber-50/70 text-amber-700" : display ? "text-gray-800" : "text-gray-300",
                ].join(" ")}
              >
                {divergente && <AlertTriangle size={13} className="shrink-0 text-amber-500" />}
                <span className="truncate">{display || "—"}</span>
                <ChevronDown size={13} className="ml-auto shrink-0 text-gray-400" />
              </button>
            )}
          >
            {(close) => (
              <div className="max-h-64 overflow-y-auto">
                {top3.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      m.onSetCategoria(row.sku, { id: t.id, nombre: t.nombre });
                      close();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] hover:bg-gray-50"
                  >
                    <span
                      className={[
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        i === 0 ? "bg-emerald-500" : "bg-gray-300",
                      ].join(" ")}
                    />
                    <span className="truncate text-gray-700">{t.nombre || t.id}</span>
                    {catId === t.id && <Check size={13} className="ml-auto shrink-0 text-blue-600" />}
                  </button>
                ))}
                {top3.length > 0 && <div className="my-1 border-t border-gray-100" />}
                <button
                  type="button"
                  onClick={() => {
                    m.onOpenCategoria(row.sku);
                    close();
                  }}
                  className="w-full px-3 py-1.5 text-left text-[12.5px] text-blue-700 hover:bg-gray-50"
                >
                  Buscar más…
                </button>
              </div>
            )}
          </GridDropdown>
        );
      },
    });

    // 6) Imágenes (icono + conteo + "subir"). Abre ImagenesModal.
    if (imagenesCol) {
      const imgCol = imagenesCol;
      defs.push({
        id: imgCol.key,
        header: imgCol.label,
        size: 100,
        minSize: 64,
        cell: (ctx: CellContext<GridRow, unknown>) => {
          const m = readMeta(ctx);
          const row = ctx.row.original;
          const v = effectiveValue(row, m.edits, imgCol.key);
          const n = Array.isArray(v) ? v.length : 0;
          return (
            <div className="flex h-full items-center px-2">
              <button
                type="button"
                onClick={() => m.onOpenImagenes(row.sku)}
                className="inline-flex items-center gap-1.5 text-[12.5px]"
                title={n > 0 ? `${n} imagen${n === 1 ? "" : "es"}` : "Sin imágenes"}
              >
                <ImageIcon size={14} className={n > 0 ? "text-gray-500" : "text-rose-400"} />
                <span className={["tabular-nums font-medium", n > 0 ? "text-gray-700" : "text-rose-600"].join(" ")}>
                  {n}
                </span>
                {n === 0 && <span className="text-[11px] text-rose-500">subir</span>}
              </button>
            </div>
          );
        },
      });
    }

    // 7) Medidas (4 columnas numéricas planas, solo si el schema las trae) → vía
    //    ExcelCellShell + GridCellExcel.
    if (hasMedidas) {
      MEDIDAS_COLS.forEach((mcol) => {
        const col: GridColumn = { key: mcol.key, label: mcol.label, group: "fijo", type: "number" };
        defs.push({
          id: mcol.key,
          size: 88,
          minSize: 56,
          header: () => <span>{mcol.label}</span>,
          cell: (ctx: CellContext<GridRow, unknown>) => {
            const m = readMeta(ctx);
            const row = ctx.row.original;
            const value = effectiveValue(row, m.edits, mcol.key);
            const isEditing = m.editing?.sku === row.sku && m.editing?.key === mcol.key;
            return (
              <ExcelCellShell sku={row.sku} colKey={mcol.key} meta={m} isEditing={isEditing}>
                <GridCellExcel
                  column={col}
                  value={value}
                  highlight={m.highlight}
                  editing={isEditing}
                  initialChar={isEditing ? m.initialChar : null}
                  onStartEdit={() => m.onStartEdit(row.sku, mcol.key)}
                  onCommit={(v) => m.onCommitEdit(v)}
                  onCancel={m.onStopEdit}
                />
              </ExcelCellShell>
            );
          },
        });
      });
    }

    // 8) Columnas de atributos (inline) → vía ExcelCellShell + GridCellExcel. Si
    //    el atributo no aplica a la categoría de la fila → guion no editable.
    attributeColumns.forEach((col) => {
      defs.push({
        id: col.key,
        size: 150,
        minSize: 70,
        header: () => (
          <span>
            {col.label}
            {col.required && (
              <span className="ml-0.5 text-rose-500" aria-hidden>
                ●
              </span>
            )}
          </span>
        ),
        cell: (ctx: CellContext<GridRow, unknown>) => {
          const m = readMeta(ctx);
          const row = ctx.row.original;
          const catId = rowCategoryId(row, m.edits);
          if (!m.appliesTo(col.key, catId)) {
            return <span className="px-2 text-gray-300">—</span>;
          }
          const value = effectiveValue(row, m.edits, col.key);
          const invalid = !!col.required && isEmptyish(value);
          const isEditing = m.editing?.sku === row.sku && m.editing?.key === col.key;
          return (
            <ExcelCellShell sku={row.sku} colKey={col.key} meta={m} isEditing={isEditing}>
              <GridCellExcel
                column={col}
                value={value}
                invalid={invalid}
                highlight={m.highlight}
                editing={isEditing}
                initialChar={isEditing ? m.initialChar : null}
                onStartEdit={() => m.onStartEdit(row.sku, col.key)}
                onCommit={(v) => m.onCommitEdit(v)}
                onCancel={m.onStopEdit}
              />
            </ExcelCellShell>
          );
        },
      });
    });

    // 9) Descripción (input inline directo + Maximize). NO usa ExcelCellShell —
    //    se edita fuera del rango (vía onSetEdit), igual que hoy.
    if (descCol) {
      const dCol = descCol;
      defs.push({
        id: dCol.key,
        header: dCol.label,
        size: 200,
        minSize: 100,
        cell: (ctx: CellContext<GridRow, unknown>) => {
          const m = readMeta(ctx);
          const row = ctx.row.original;
          const v = effectiveValue(row, m.edits, "descripcion");
          return (
            <div className="group/desc relative flex h-full items-center">
              <input
                value={typeof v === "string" ? v : v == null ? "" : String(v)}
                onChange={(e) => m.onSetEdit(row.sku, "descripcion", e.target.value)}
                placeholder="Sin descripción"
                className="h-9 w-full bg-transparent pl-2 pr-7 text-[12.5px] text-gray-800 outline-none placeholder:italic placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:ring-inset"
              />
              <button
                type="button"
                onClick={() => m.onOpenSidePanel(row.sku)}
                title="Abrir editor de descripción"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 hover:text-blue-600 focus:opacity-100 group-hover/desc:opacity-100"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          );
        },
      });
    }

    // 10) Sync (toggle centrado).
    defs.push({
      id: COL_SYNC,
      header: () => <span className="block text-center">Sync</span>,
      size: 80,
      minSize: 72,
      maxSize: 96,
      enableResizing: false,
      cell: (ctx: CellContext<GridRow, unknown>) => {
        const m = readMeta(ctx);
        const sku = ctx.row.original.sku;
        return (
          <div className="flex h-full items-center justify-center">
            <SyncToggle on={!!m.syncBySku[sku]} onClick={() => m.onToggleSync(sku, !m.syncBySku[sku])} />
          </div>
        );
      },
    });

    // ── Reorden (Pieza 1) ─────────────────────────────────────────────────────
    // Se hace sobre el array ya armado (por id) para no mover bloques grandes.
    //   (a) Categoría ML ANTES que Estado → corregir la categoría desde el inicio.
    //   (b) Precio DESPUÉS de las medidas del Paquete → flujo natural
    //       medidas → (margen) → precio. El margen se inserta acá en la Pieza 3.
    const moveBefore = (id: string, beforeId: string) => {
      const from = defs.findIndex((d) => d.id === id);
      if (from < 0) return;
      const [item] = defs.splice(from, 1);
      const to = defs.findIndex((d) => d.id === beforeId);
      defs.splice(to < 0 ? defs.length : to, 0, item);
    };
    const moveAfter = (id: string, afterId: string) => {
      const from = defs.findIndex((d) => d.id === id);
      if (from < 0) return;
      const [item] = defs.splice(from, 1);
      const to = defs.findIndex((d) => d.id === afterId);
      defs.splice(to < 0 ? defs.length : to + 1, 0, item);
    };
    moveBefore(COL_CATEGORIA, COL_ESTADO);
    if (hasMedidas) {
      const lastPkg = MEDIDAS_COLS[MEDIDAS_COLS.length - 1].key;
      moveAfter("margen", lastPkg);   // Margen tras el paquete…
      moveAfter("precio", "margen");  // …y Precio justo después del Margen.
    }

    return defs;
  }, [textCommon, descCol, imagenesCol, hasMedidas, attributeColumns]);

  // Visibilidad de columnas (estado nativo de TanStack): solo listamos las que
  // se OCULTAN (visible[key] === false). Las sintéticas no aparecen en `visible`
  // → quedan siempre visibles.
  const columnVisibility = useMemo<VisibilityState>(() => {
    const vis: VisibilityState = {};
    Object.keys(visible).forEach((key) => {
      if (visible[key] === false) vis[key] = false;
    });
    return vis;
  }, [visible]);

  // Estado volátil → meta. Se re-crea cada render a propósito (las columnas NO
  // se reconstruyen, así que esto no las invalida).
  const meta: FlujoGridMeta = {
    edits,
    appliesTo,
    selected,
    syncBySku,
    allChecked,
    initialChar,
    editing,
    allColumns,
    highlight,
    expanded,
    prediccionesBySku,
    hasMedidas,
    attributeColumns,
    onSetEdit,
    onOpenCategoria,
    onToggleSync,
    onToggleSelect,
    onToggleSelectAll,
    onToggleExpand,
    onOpenSidePanel,
    onOpenImagenes,
    onOpenCalculadora,
    calcLoadingSkus,
    onSetCategoria,
    isInRange,
    isAnchor,
    onBeginSelect,
    onExtendSelect,
    onCommitEdit,
    onStartEdit,
    onStopEdit,
  };

  const table = useReactTable<GridRow>({
    data: rows,
    columns,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (r) => r.sku,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    defaultColumn: { minSize: 56, size: 150 },
    meta,
  });

  // Ancho del contenedor scroll → ancho del panel de detalle (sticky left:0).
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [panelWidth, setPanelWidth] = useState(880);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setPanelWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Estilo sticky de las 2 primeras columnas (selección + Producto): fondo
  // sólido + z-index para que no se tapen al hacer scroll horizontal.
  const stickyTh = (colId: string): React.CSSProperties | undefined => {
    if (colId === COL_SELECT) return { position: "sticky", left: 0, zIndex: 30 };
    if (colId === COL_PRODUCTO) return { position: "sticky", left: W_SELECT, zIndex: 30 };
    return undefined;
  };
  const stickyTd = (colId: string): React.CSSProperties | undefined => {
    if (colId === COL_SELECT) return { position: "sticky", left: 0, zIndex: 10 };
    if (colId === COL_PRODUCTO) return { position: "sticky", left: W_SELECT, zIndex: 10 };
    return undefined;
  };
  const isSticky = (colId: string): boolean => colId === COL_SELECT || colId === COL_PRODUCTO;

  const hasRows = rows.length > 0;
  const visibleLeafCount = table.getVisibleLeafColumns().length;

  return (
    <div
      ref={scrollRef}
      className="max-h-[calc(100vh-330px)] w-full min-w-0 max-w-full overflow-auto bg-white"
    >
      <table
        className="border-collapse text-[12.5px]"
        style={{ width: table.getTotalSize(), minWidth: "100%" }}
      >
        <thead className="sticky top-0 z-20 bg-[#E8EAF7]">
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className="border-b border-gray-200 text-[10.5px] uppercase tracking-wide text-gray-500"
            >
              {hg.headers.map((h) => {
                // El punto rose de columnas requeridas lo pinta cada `header`
                // render (comunes/atributos). Aquí solo posición sticky + bg/z.
                return (
                  <th
                    key={h.id}
                    style={{ width: h.getSize(), ...stickyTh(h.column.id) }}
                    className={[
                      "relative border-r border-gray-100 px-2 py-2 text-left align-bottom",
                      h.column.id === COL_SELECT ? "pl-5" : "",
                      isSticky(h.column.id) ? "bg-[#E8EAF7]" : "",
                    ].join(" ")}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanResize() && (
                      <div
                        onMouseDown={h.getResizeHandler()}
                        onTouchStart={h.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-blue-300/70"
                        aria-hidden
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {!hasRows ? (
            <tr>
              <td colSpan={visibleLeafCount} className="py-10 text-center text-gray-400">
                Sin productos que coincidan con el filtro o la búsqueda.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((r) => {
              const sku = r.original.sku;
              const isSel = selected.has(sku);
              const isOpen = expanded.has(sku);
              return (
                <FragmentRow
                  key={r.id}
                  cells={r.getVisibleCells().map((c) => ({
                    id: c.id,
                    colId: c.column.id,
                    size: c.column.getSize(),
                    node: flexRender(c.column.columnDef.cell, c.getContext()),
                  }))}
                  isSel={isSel}
                  isOpen={isOpen}
                  stickyTd={stickyTd}
                  isSticky={isSticky}
                  colSpan={visibleLeafCount}
                  detail={
                    isOpen ? (
                      <DetailPanel
                        row={r.original}
                        attributeColumns={attributeColumns}
                        appliesTo={appliesTo}
                        hasMedidas={hasMedidas}
                        edits={edits}
                        onSetEdit={onSetEdit}
                        width={panelWidth}
                      />
                    ) : null
                  }
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Fila + fila de detalle expandida. Se aísla en un componente para mantener el
 *  JSX del cuerpo legible (la fila lleva la clase `group` que activa los tintes
 *  rose de los faltantes en hover). */
function FragmentRow({
  cells,
  isSel,
  isOpen,
  stickyTd,
  isSticky,
  colSpan,
  detail,
}: {
  cells: { id: string; colId: string; size: number; node: React.ReactNode }[];
  isSel: boolean;
  isOpen: boolean;
  stickyTd: (colId: string) => React.CSSProperties | undefined;
  isSticky: (colId: string) => boolean;
  colSpan: number;
  detail: React.ReactNode;
}) {
  return (
    <>
      <tr
        className={[
          "group h-11 border-b border-gray-100 hover:bg-blue-50/30",
          isSel ? "bg-blue-50/40" : "",
        ].join(" ")}
      >
        {cells.map((c) => (
          <td
            key={c.id}
            style={{ width: c.size, ...stickyTd(c.colId) }}
            className={[
              // h-11 explícito en el td (además del tr) para que el h-full de
              // ExcelCellShell resuelva y el tinte de rango cubra toda la celda.
              "h-11 border-r border-gray-100 p-0 align-middle",
              c.colId === COL_SELECT ? "pl-5" : "",
              // Fondo sólido en las sticky; las seleccionadas heredan el tinte.
              isSticky(c.colId) ? (isSel ? "bg-blue-50" : "bg-white group-hover:bg-blue-50/30") : "",
            ].join(" ")}
          >
            {c.node}
          </td>
        ))}
      </tr>
      {isOpen && (
        <tr className="border-b border-gray-200 bg-gray-50/60">
          <td colSpan={colSpan} className="p-0">
            {detail}
          </td>
        </tr>
      )}
    </>
  );
}
