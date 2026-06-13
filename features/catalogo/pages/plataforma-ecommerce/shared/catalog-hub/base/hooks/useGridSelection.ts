// hooks/useGridSelection.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { effectiveValue } from "../lib/grid-logic";
import type { GridRow, Edits } from "../types/grid-types";

export interface CellRef { sku: string; key: string }

export interface UseGridSelectionArgs {
  rows: GridRow[];                 // ORDEN visible/filtrado
  columnKeys: string[];            // ids de columnas EDITABLES, en orden visible
  edits: Edits;
  setEdit: (sku: string, key: string, value: unknown) => void;
  /** Escribe muchas celdas en UNA sola actualización (bulk fill/clear/Ctrl+D)
   *  para evitar el O(N²) de llamar setEdit en loop. */
  applyEdits: (entries: Array<{ sku: string; key: string; value: unknown }>) => void;
  appliesTo: (attrId: string, categoryId: string | null | undefined) => boolean;
  isAttribute: (key: string) => boolean;
}
export interface UseGridSelectionReturn {
  anchor: CellRef | null;
  focus: CellRef | null;
  editing: CellRef | null;
  initialChar: string | null;
  isInRange: (sku: string, key: string) => boolean;
  isAnchor: (sku: string, key: string) => boolean;
  beginSelect: (sku: string, key: string, shift: boolean) => void;
  extendSelect: (sku: string, key: string) => void;
  endSelect: () => void;
  startEdit: (sku: string, key: string) => void;
  stopEdit: () => void;
  commitEdit: (value: unknown) => void;
  clearRange: () => void;
}

function catOf(row: GridRow, edits: Edits): string | null {
  const c = effectiveValue(row, edits, "category_id");
  return c == null || c === "" ? null : String(c);
}

interface Live extends UseGridSelectionArgs { anchor: CellRef | null; focus: CellRef | null }

/** Rectángulo en índices [r1..r2]×[c1..c2] a partir del estado vivo, o null. */
function rectOf(s: Live): { r1: number; r2: number; c1: number; c2: number } | null {
  if (!s.anchor || !s.focus) return null;
  const ar = s.rows.findIndex((r) => r.sku === s.anchor!.sku);
  const fr = s.rows.findIndex((r) => r.sku === s.focus!.sku);
  const ac = s.columnKeys.indexOf(s.anchor.key);
  const fc = s.columnKeys.indexOf(s.focus.key);
  if (ar < 0 || fr < 0 || ac < 0 || fc < 0) return null;
  return { r1: Math.min(ar, fr), r2: Math.max(ar, fr), c1: Math.min(ac, fc), c2: Math.max(ac, fc) };
}

export function useGridSelection(args: UseGridSelectionArgs): UseGridSelectionReturn {
  const [anchor, setAnchor] = useState<CellRef | null>(null);
  const [focus, setFocus] = useState<CellRef | null>(null);
  const [editing, setEditing] = useState<CellRef | null>(null);
  const [initialChar, setInitialChar] = useState<string | null>(null);

  // Espejo vivo: las operaciones imperativas leen SIEMPRE estado fresco sin
  // recrear callbacks ni arrastrar closures viejas.
  const live = useRef<Live>({ ...args, anchor, focus });
  live.current = { ...args, anchor, focus };

  const selecting = useRef(false);
  // Objetivos capturados al ENTRAR en edición (columna + skus de las filas del
  // rango); el commit escribe ahí aunque la selección cambie entremedio.
  const editTargets = useRef<{ key: string; skus: string[] } | null>(null);

  const isInRange = useCallback((sku: string, key: string) => {
    const R = rectOf(live.current); if (!R) return false;
    const ri = live.current.rows.findIndex((r) => r.sku === sku);
    const ci = live.current.columnKeys.indexOf(key);
    return ri >= R.r1 && ri <= R.r2 && ci >= R.c1 && ci <= R.c2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, focus]);

  const isAnchor = useCallback(
    (sku: string, key: string) => !!anchor && anchor.sku === sku && anchor.key === key,
    [anchor],
  );

  const beginSelect = useCallback((sku: string, key: string, shift: boolean) => {
    if (shift && live.current.anchor) { setFocus({ sku, key }); }
    else { setAnchor({ sku, key }); setFocus({ sku, key }); }
    setEditing((cur) => (cur && (cur.sku !== sku || cur.key !== key) ? null : cur));
    selecting.current = true;
  }, []);
  const extendSelect = useCallback((sku: string, key: string) => {
    if (!selecting.current) return;
    setFocus({ sku, key });
  }, []);
  const endSelect = useCallback(() => { selecting.current = false; }, []);

  const startEdit = useCallback((sku: string, key: string) => {
    const s = live.current;
    const R = rectOf(s);
    const skus: string[] = [];
    if (R) {
      for (let i = R.r1; i <= R.r2; i++) {
        const r = s.rows[i]; if (!r) continue;
        if (s.isAttribute(key) && !s.appliesTo(key, catOf(r, s.edits))) continue;
        skus.push(r.sku);
      }
    } else {
      skus.push(sku);
    }
    editTargets.current = { key, skus: skus.length ? skus : [sku] };
    setEditing({ sku, key });
  }, []);
  const stopEdit = useCallback(() => { setEditing(null); setInitialChar(null); editTargets.current = null; }, []);

  const commitEdit = useCallback((value: unknown) => {
    const t = editTargets.current;
    const s = live.current;
    if (t && t.skus.length) s.applyEdits(t.skus.map((sku) => ({ sku, key: t.key, value })));
    setEditing(null); setInitialChar(null); editTargets.current = null;
  }, []);

  const clearRange = useCallback(() => {
    const s = live.current;
    const R = rectOf(s);
    const entries: Array<{ sku: string; key: string; value: unknown }> = [];
    if (!R) {
      if (s.anchor) entries.push({ sku: s.anchor.sku, key: s.anchor.key, value: null });
    } else {
      for (let i = R.r1; i <= R.r2; i++) {
        const r = s.rows[i]; if (!r) continue;
        for (let j = R.c1; j <= R.c2; j++) {
          const key = s.columnKeys[j]; if (!key) continue;
          if (s.isAttribute(key) && !s.appliesTo(key, catOf(r, s.edits))) continue;
          entries.push({ sku: r.sku, key, value: null });
        }
      }
    }
    s.applyEdits(entries);
  }, []);

  const fillDown = useCallback(() => {
    const s = live.current;
    const a = s.anchor; if (!a) return;
    const key = a.key;
    const ar = s.rows.findIndex((r) => r.sku === a.sku); if (ar < 0) return;
    const value = effectiveValue(s.rows[ar], s.edits, key);
    const R = rectOf(s);
    const end = R && R.r2 > ar ? R.r2 : s.rows.length - 1;
    const entries: Array<{ sku: string; key: string; value: unknown }> = [];
    for (let i = ar + 1; i <= end; i++) {
      const r = s.rows[i]; if (!r) continue;
      if (s.isAttribute(key) && !s.appliesTo(key, catOf(r, s.edits))) continue;
      entries.push({ sku: r.sku, key, value });
    }
    s.applyEdits(entries);
  }, []);

  const copyRange = useCallback(() => {
    const s = live.current;
    const R = rectOf(s); if (!R) return;
    const lines: string[] = [];
    for (let i = R.r1; i <= R.r2; i++) {
      const r = s.rows[i]; if (!r) continue;
      const cells: string[] = [];
      for (let j = R.c1; j <= R.c2; j++) {
        const key = s.columnKeys[j];
        const v = key ? effectiveValue(r, s.edits, key) : "";
        cells.push(v == null ? "" : String(v));
      }
      lines.push(cells.join("\t"));
    }
    try { void navigator.clipboard?.writeText(lines.join("\n"))?.catch(() => {}); } catch { /* sin clipboard */ }
  }, []);

  // Teclado: Enter/F2 editar; Backspace/Supr borrar rango; Ctrl+D rellenar;
  // Ctrl+C copiar; tecla imprimible → type-to-edit. (Mientras se edita, el
  // editor de la celda maneja sus teclas.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = live.current.anchor;
      if (!a) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (editing || inField) return;
      if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(a.sku, a.key); return; }
      if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); clearRange(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") { e.preventDefault(); fillDown(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") { copyRange(); return; }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        setInitialChar(e.key); startEdit(a.sku, a.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, startEdit, clearRange, fillDown, copyRange]);

  // Mouse-up global termina el arrastre aunque se suelte fuera de la grilla.
  useEffect(() => {
    const onUp = () => { selecting.current = false; };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  return {
    anchor, focus, editing, initialChar,
    isInRange, isAnchor,
    beginSelect, extendSelect, endSelect,
    startEdit, stopEdit, commitEdit, clearRange,
  };
}
