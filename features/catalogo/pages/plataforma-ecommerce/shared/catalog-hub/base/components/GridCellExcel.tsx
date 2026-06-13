// components/GridCellExcel.tsx
"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GridColumn } from "../types/grid-types";

export interface GridCellExcelProps {
  column: GridColumn;
  value: unknown;
  invalid?: boolean;       // obligatorio + vacío
  highlight?: boolean;     // "Resaltar faltantes" global → tinte rose siempre si invalid
  editing: boolean;        // esta celda está en modo edición
  initialChar?: string | null; // type-to-edit: char que abrió la edición (texto/número)
  onStartEdit: () => void; // doble clic
  onCommit: (v: unknown) => void; // confirma (el padre hace onSetEdit + stopEdit)
  onCancel: () => void;    // sale sin escribir (stopEdit)
}

/** Texto de display del valor según el tipo de columna. */
function formatValue(column: GridColumn, value: unknown): string {
  if (value == null || value === "") return "";
  switch (column.type) {
    case "list": {
      const opt = column.options?.find((o) => o.id === value || o.id === String(value));
      return opt ? opt.name : String(value);
    }
    case "boolean":
      return value === true || value === "true" ? "Sí" : value === false || value === "false" ? "No" : "";
    case "number_unit": {
      if (typeof value === "object" && value && "number" in (value as object)) {
        const o = value as { number?: unknown; unit?: unknown };
        return o.number == null || o.number === "" ? "" : `${o.number}${o.unit ? ` ${o.unit}` : ""}`;
      }
      return String(value);
    }
    default:
      return String(value);
  }
}

export function GridCellExcel({ column, value, invalid, highlight, editing, initialChar, onStartEdit, onCommit, onCancel }: GridCellExcelProps) {
  if (!editing) {
    // Precio: display formateado con separador es-CL + "$" gris (solo display;
    // el editor sigue siendo numérico plano). El resto usa formatValue normal.
    const isPrecio = column.key === "precio";
    const hasValue = value != null && value !== "";
    const text =
      isPrecio && hasValue ? Number(value).toLocaleString("es-CL") : formatValue(column, value);
    return (
      <div
        onDoubleClick={onStartEdit}
        className={[
          // Look del prototipo (EditCell): h-9, padding, tipografía OMS.
          "flex h-9 items-center px-2 text-[12.5px] text-gray-800 truncate tabular-nums",
          // Tinte rose: SIEMPRE si "Resaltar faltantes" + invalid; en hover de
          // la fila (clase `group` en el <tr>) si invalid.
          invalid && highlight ? "bg-rose-50/70" : "",
          invalid ? "group-hover:bg-rose-50/70" : "",
        ].join(" ")}
        title={text || undefined}
      >
        {hasValue && isPrecio && <span className="text-[12px] text-gray-400">$</span>}
        {text ? (
          isPrecio && hasValue ? <span className="ml-1">{text}</span> : <span>{text}</span>
        ) : (
          // Placeholder gris (guion), nunca "obligatorio".
          <span className="text-gray-300">—</span>
        )}
      </div>
    );
  }
  return <CellEditor column={column} value={value} initialChar={initialChar} onCommit={onCommit} onCancel={onCancel} />;
}

// Look del prototipo (EditCell): input plano de alto h-9, sin borde, con ring
// azul al foco (focus:ring-inset). La mecánica (foco/commit) NO cambia.
const INPUT_CLS =
  "h-9 w-full bg-white px-2 text-[12.5px] text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 focus:ring-inset";
const SELECT_CLS =
  "h-9 w-full bg-white px-2 text-[12.5px] text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 focus:ring-inset cursor-pointer";

/** Editor compacto sin etiqueta, con draft local. Enter/blur = commit; Escape = cancel. */
function CellEditor({
  column,
  value,
  initialChar,
  onCommit,
  onCancel,
}: {
  column: GridColumn;
  value: unknown;
  initialChar?: string | null;
  onCommit: (v: unknown) => void;
  onCancel: () => void;
}) {
  const cancelled = useRef(false);
  const t = column.type;

  if (t === "list") {
    return (
      <select
        autoFocus
        defaultValue={value == null ? "" : String(value)}
        onChange={(e) => onCommit(e.target.value === "" ? null : e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { cancelled.current = true; onCancel(); } }}
        onBlur={() => { if (!cancelled.current) onCancel(); }}
        className={SELECT_CLS}
      >
        <option value="">— seleccionar —</option>
        {(column.options ?? []).map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    );
  }
  if (t === "boolean") {
    const cur = value === true || value === "true" ? "true" : value === false || value === "false" ? "false" : "";
    return (
      <select
        autoFocus
        defaultValue={cur}
        onChange={(e) => onCommit(e.target.value === "" ? null : e.target.value === "true")}
        onKeyDown={(e) => { if (e.key === "Escape") { cancelled.current = true; onCancel(); } }}
        onBlur={() => { if (!cancelled.current) onCancel(); }}
        className={SELECT_CLS}
      >
        <option value="">—</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (t === "number_unit") {
    return <NumberUnitEditor column={column} value={value} onCommit={onCommit} onCancel={onCancel} />;
  }

  return <TextEditor type={t === "number" ? "number" : "text"} value={value} initialChar={initialChar} onCommit={onCommit} onCancel={onCancel} />;
}

function TextEditor({
  type,
  value,
  initialChar,
  onCommit,
  onCancel,
}: {
  type: "text" | "number";
  value: unknown;
  initialChar?: string | null;
  onCommit: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<string>(
    initialChar != null ? initialChar : value == null ? "" : String(value),
  );
  const latest = useRef(draft);
  latest.current = draft;
  const touched = useRef(false); // el usuario tecleó algo (vs solo abrir la celda)
  const done = useRef(false); // ya se resolvió (commit o cancel)
  const ref = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    const d = latest.current;
    if (type === "number") onCommit(d === "" ? null : Number(d));
    else onCommit(d);
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  // Foco SÍNCRONO (useLayoutEffect, no useEffect): si el foco se difiriera al
  // paint, en type-to-edit las teclas siguientes llegan ANTES de que el input
  // tenga foco y se pierden ("escribe la 1ra letra y nada más").
  useLayoutEffect(() => {
    ref.current?.focus();
    // Con type-to-edit (initialChar) solo enfocamos para seguir escribiendo al
    // final; sin él, foco + select (reemplazo del valor al editar).
    if (initialChar == null) ref.current?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Backstop "guardar al salir": al cambiar de celda React desmonta el input
  // ANTES de que el blur alcance a confirmar; esto persiste lo TIPEADO en ese
  // caso. El guard `touched` evita commits espurios (incluido el doble-invoke de
  // efectos de StrictMode en dev, donde todavía no se tecleó nada).
  useEffect(() => {
    return () => { if (!done.current && touched.current) commit(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={ref}
      type={type}
      value={draft}
      onChange={(e) => { touched.current = true; setDraft(e.target.value); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        else if (e.key === "Escape") { e.preventDefault(); cancel(); }
      }}
      onBlur={commit}
      className={`${INPUT_CLS} ${type === "number" ? "tabular-nums" : ""}`}
    />
  );
}

function NumberUnitEditor({
  column,
  value,
  onCommit,
  onCancel,
}: {
  column: GridColumn;
  value: unknown;
  onCommit: (v: unknown) => void;
  onCancel: () => void;
}) {
  const init = value && typeof value === "object" && "number" in (value as object)
    ? (value as { number?: unknown; unit?: unknown })
    : { number: undefined, unit: column.unit?.[0] };
  const [num, setNum] = useState<string>(init.number == null ? "" : String(init.number));
  const [unit, setUnit] = useState<string>(init.unit ? String(init.unit) : (column.unit?.[0] ?? ""));
  const latestNum = useRef(num);
  latestNum.current = num;
  const latestUnit = useRef(unit);
  latestUnit.current = unit;
  const touched = useRef(false);
  const done = useRef(false);
  const ref = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    onCommit({ number: latestNum.current === "" ? null : Number(latestNum.current), unit: latestUnit.current });
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };
  useLayoutEffect(() => {
    ref.current?.focus();
    ref.current?.select();
     
  }, []);
  // Backstop "guardar al salir" (ver TextEditor); el guard `touched` lo hace
  // StrictMode-safe.
  useEffect(() => {
    return () => { if (!done.current && touched.current) commit(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  };
  return (
    // Commit SOLO cuando el foco sale del contenedor completo (no al pasar del
    // número al select de unidad), para poder editar número y unidad sin que el
    // commit cierre la celda a mitad de camino.
    <div
      className="flex h-9 items-stretch gap-1"
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commit(); }}
    >
      <input
        ref={ref}
        type="number"
        value={num}
        onChange={(e) => { touched.current = true; setNum(e.target.value); }}
        onKeyDown={onKeyDown}
        className={`${INPUT_CLS} flex-1 tabular-nums`}
      />
      <select
        value={unit}
        onChange={(e) => { touched.current = true; setUnit(e.target.value); }}
        onKeyDown={onKeyDown}
        className={`${SELECT_CLS} w-14`}
      >
        {(column.unit ?? []).map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
    </div>
  );
}
