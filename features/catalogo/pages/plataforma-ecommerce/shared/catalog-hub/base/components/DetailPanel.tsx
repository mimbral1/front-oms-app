// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/DetailPanel.tsx
//
// Unit 2 — Panel de detalle expandido de una fila de la grilla del flujo. Se
// renderiza dentro de la fila <tr> expandida (un <td colSpan> en FlujoDataGrid)
// y queda fijo a la izquierda al hacer scroll horizontal (position: sticky +
// width = ancho visible del contenedor scroll).
//
// Porta la estructura del `DetailPanel` del prototipo (carga-masiva-de-imagnes/
// project/grid.jsx ~347-386): título + descripción (textarea), medidas (4
// inputs numéricos) y los atributos del SKU reutilizando AttrInput del wizard.
// Mantiene el modelo real (edits vía onSetEdit) y tipografía OMS. Cero write a ML.
"use client";

import { AttrInput } from "../../../publicar/base/components/AttrInput";
import { columnToAttr, effectiveValue } from "../lib/grid-logic";
import type { Edits, GridColumn, GridRow } from "../types/grid-types";

export interface DetailPanelProps {
  row: GridRow;
  attributeColumns: GridColumn[];
  appliesTo: (attrId: string, categoryId: string | null | undefined) => boolean;
  hasMedidas: boolean;
  edits: Edits;
  onSetEdit: (sku: string, key: string, value: unknown) => void;
  /** Ancho del contenedor scroll (px) para fijar el panel a la izquierda. */
  width: number;
}

// Las 4 medidas (mismas keys backend que la grilla). Se editan como número plano.
const MEDIDAS: { key: string; label: string }[] = [
  { key: "seller_package_weight", label: "Peso (g)" },
  { key: "seller_package_length", label: "Largo (cm)" },
  { key: "seller_package_width", label: "Ancho (cm)" },
  { key: "seller_package_height", label: "Alto (cm)" },
];

/** Categoría efectiva de la fila, normalizada a string|null. */
function rowCategoryId(row: GridRow, edits: Edits): string | null {
  const id = effectiveValue(row, edits, "category_id");
  return id != null && String(id).trim() !== "" ? String(id) : null;
}

export function DetailPanel({
  row,
  attributeColumns,
  appliesTo,
  hasMedidas,
  edits,
  onSetEdit,
  width,
}: DetailPanelProps) {
  const catId = rowCategoryId(row, edits);
  // Atributos que aplican a la categoría efectiva de esta fila.
  const applicableAttrs = attributeColumns.filter((c) => appliesTo(c.key, catId));

  const descValue = effectiveValue(row, edits, "descripcion");

  return (
    <div style={{ position: "sticky", left: 0, width }} className="px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-400">
        Detalle del producto
        <span className="font-mono text-gray-500 normal-case tracking-normal">{row.sku}</span>
      </div>

      {/* Descripción */}
      <div className="mb-3 max-w-3xl">
        <label className="mb-1 block text-[10.5px] uppercase tracking-wide text-gray-400">
          Descripción
        </label>
        <textarea
          value={typeof descValue === "string" ? descValue : descValue == null ? "" : String(descValue)}
          onChange={(e) => onSetEdit(row.sku, "descripcion", e.target.value)}
          rows={3}
          placeholder="Sin descripción"
          className="w-full resize-y rounded border border-gray-200 px-2.5 py-2 text-[12.5px] text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Medidas (solo si el schema las trae) */}
      {hasMedidas && (
        <div className="mb-3 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {MEDIDAS.map((m) => {
            const v = effectiveValue(row, edits, m.key);
            return (
              <div key={m.key}>
                <label className="mb-1 block text-[10.5px] uppercase tracking-wide text-gray-400">
                  {m.label}
                </label>
                <input
                  value={v == null ? "" : String(v)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    onSetEdit(row.sku, m.key, digits === "" ? null : Number(digits));
                  }}
                  placeholder="—"
                  inputMode="numeric"
                  className="h-8 w-full rounded border border-gray-200 px-2 text-[12.5px] tabular-nums text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Atributos del SKU (según la categoría efectiva). AttrInput trae su
          propio label en layout "stacked". */}
      {applicableAttrs.length > 0 && (
        <div className="max-w-3xl">
          <div className="mb-1.5 text-[10.5px] uppercase tracking-wide text-gray-400">
            Atributos
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            {applicableAttrs.map((col) => (
              <AttrInput
                key={col.key}
                attr={columnToAttr(col)}
                value={effectiveValue(row, edits, col.key)}
                onChange={(v) => onSetEdit(row.sku, col.key, v)}
                layout="stacked"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
