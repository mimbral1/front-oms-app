// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/GridToolbar.tsx
//
// Toolbar de la grilla del flujo (Unit 1) — reemplaza a GridHeaderBar. Adopta el
// diseño del prototipo (carga-masiva-de-imagnes/project/grid.jsx, bloque toolbar
// del App ~568-724) con TIPOGRAFÍA OMS (las mismas clases utilitarias de tamaño
// que ya usaba la grilla, sin la fuente del prototipo).
//
// Contiene: path (breadcrumb) + Total + stats inline coloreados, búsqueda,
// filtro Estado (dropdown), Columnas (dropdown show/hide), toggle Resaltar
// faltantes, y los botones de acción Guardar + Sincronizar (en vez del
// "Publicar N" del prototipo). Más la alerta ámbar de categorías inválidas.
//
// Solo presentación: todo el estado vive en FlujoGridView. Sin pills, sin lógica
// de datos. Cero write a ML.
"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  Columns3,
  Save,
  Search,
  UploadCloud,
  X,
} from "lucide-react";

import type { N3Header } from "../hooks/useFlujoGrid";
import { GridDropdown } from "./GridDropdown";

/** Filtro de estado del toolbar — superset del filtro de la grilla (agrega
 *  "listos"). FlujoGridView lo mapea a su `GridFilter` interno. */
export type EstadoFiltro = "todos" | "listos" | "pendientes" | "error" | "sin";

/** Una columna ofrecida en el dropdown de Columnas. `always` = no se ofrece
 *  (siempre visible); `required` = punto rose (atributo obligatorio). */
export interface ToolbarColumn {
  key: string;
  label: string;
  required?: boolean;
  always?: boolean;
}

export interface GridToolbarProps {
  n3Header: N3Header | null;
  stats: { total: number; listo: number; pendiente: number; error: number; sinPublicar: number };

  estado: EstadoFiltro;
  onEstado: (e: EstadoFiltro) => void;

  search: string;
  onSearch: (s: string) => void;

  columns: ToolbarColumn[];
  visible: Record<string, boolean>;
  onToggleColumn: (key: string) => void;

  highlight: boolean;
  onToggleHighlight: () => void;

  /** Acción Guardar (persistir edits en memoria). */
  dirty: boolean;
  saving: boolean;
  onGuardar: () => void;

  /** Acción Sincronizar (empujar los SKUs marcados a ML). */
  markedCount: number;
  syncBusy: boolean;
  onSincronizar: () => void;

  /** Mensaje de resultado de la última acción (Guardar/Sincronizar). */
  saveMsg: { kind: "ok" | "err"; text: string } | null;
}

const ESTADO_LABELS: Record<EstadoFiltro, string> = {
  todos: "Todos",
  listos: "Listos",
  pendientes: "Pendientes",
  error: "Con error",
  sin: "Sin publicar",
};

export function GridToolbar({
  n3Header,
  stats,
  estado,
  onEstado,
  search,
  onSearch,
  columns,
  visible,
  onToggleColumn,
  highlight,
  onToggleHighlight,
  dirty,
  saving,
  onGuardar,
  markedCount,
  syncBusy,
  onSincronizar,
  saveMsg,
}: GridToolbarProps) {
  // Path tipo "N1 › N2" (la fila de stats de abajo ya da el contexto del N3).
  const path =
    [n3Header?.n1Nombre, n3Header?.n2Nombre].filter(Boolean).join(" › ") ||
    n3Header?.nombre ||
    "Categoría";

  // Menú del filtro Estado: [valor, etiqueta, conteo].
  const estadoMenu: Array<[EstadoFiltro, string, number]> = [
    ["todos", "Todos", stats.total],
    ["listos", "Listos para publicar", stats.listo],
    ["pendientes", "Pendientes", stats.pendiente],
    ["error", "Con error", stats.error],
    ["sin", "Sin publicar", stats.sinPublicar],
  ];

  // Columnas ofrecibles en el dropdown (las `always` no se ofrecen).
  const offerableColumns = columns.filter((c) => !c.always);

  const showAlerta = stats.error > 0 && (estado === "todos" || estado === "error");

  return (
    <div className="bg-white rounded-t-lg">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-x-4 gap-y-3">
        {/* Path + Total + stats inline */}
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-gray-400">{path}</div>
          <div className="flex items-baseline gap-3 mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10.5px] uppercase tracking-wide text-gray-400">Total</span>
              <span className="text-[18px] font-bold text-gray-900 tabular-nums leading-none">
                {stats.total.toLocaleString("es-CL")}
              </span>
            </div>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-3 text-[12px] tabular-nums">
              <span className="text-emerald-600">
                <b className="font-semibold">{stats.listo}</b> listos
              </span>
              <span className="text-rose-600">
                <b className="font-semibold">{stats.pendiente}</b> con faltantes
              </span>
              <span className="text-amber-600">
                <b className="font-semibold">{stats.error}</b> con error
              </span>
            </div>
          </div>
        </div>

        {/* Separador resumen ↔ controles (los mantiene agrupados, no separados a
            los extremos en pantallas anchas). */}
        <span className="hidden lg:block w-px self-stretch bg-gray-200" aria-hidden />

        {/* Búsqueda */}
        <div className="flex items-center gap-2 h-9 px-2.5 rounded-md border border-gray-300 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 w-56">
          <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por SKU o título…"
            className="w-full bg-transparent text-[12.5px] text-gray-800 placeholder:text-gray-400 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>

        {/* Filtro Estado (dropdown) */}
        <GridDropdown
          width={230}
          trigger={(_open, toggle) => (
            <button
              type="button"
              onClick={toggle}
              className={[
                "h-9 px-3 inline-flex items-center gap-2 rounded-md border bg-white text-[12.5px] text-gray-700 hover:bg-gray-50",
                estado !== "todos" ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-300",
              ].join(" ")}
            >
              <span className="text-gray-400">Estado:</span>
              <span className="font-medium text-gray-800">{ESTADO_LABELS[estado]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            </button>
          )}
        >
          {(close) => (
            <div>
              {estadoMenu.map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    onEstado(k);
                    close();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-gray-50"
                >
                  <span className={["w-3.5", estado === k ? "text-blue-600" : "text-transparent"].join(" ")}>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className={estado === k ? "text-gray-900 font-medium" : "text-gray-700"}>
                    {label}
                  </span>
                  <span className="ml-auto text-[11px] text-gray-400 tabular-nums">{n}</span>
                </button>
              ))}
            </div>
          )}
        </GridDropdown>

        {/* Columnas (dropdown show/hide) */}
        <GridDropdown
          width={240}
          align="right"
          trigger={(_open, toggle) => (
            <button
              type="button"
              onClick={toggle}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white text-[12.5px] text-gray-700 hover:bg-gray-50"
            >
              <Columns3 className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              Columnas
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            </button>
          )}
        >
          {() => (
            <div className="max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10.5px] uppercase tracking-wide text-gray-400">
                Mostrar columnas
              </div>
              {offerableColumns.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visible[c.key] !== false}
                    onChange={() => onToggleColumn(c.key)}
                    className="accent-blue-600 w-3.5 h-3.5"
                  />
                  <span>{c.label}</span>
                  {c.required && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400"
                      title="Obligatoria"
                      aria-hidden
                    />
                  )}
                </label>
              ))}
            </div>
          )}
        </GridDropdown>

        {/* Toggle Resaltar faltantes */}
        <button
          type="button"
          onClick={onToggleHighlight}
          className="h-9 inline-flex items-center gap-2 text-[12.5px] text-gray-600 select-none"
          title="Resaltar campos obligatorios vacíos"
          aria-pressed={highlight}
        >
          <span
            className={[
              "relative w-8 h-[18px] rounded-full transition-colors",
              highlight ? "bg-rose-500" : "bg-gray-300",
            ].join(" ")}
            aria-hidden
          >
            <span
              className={[
                "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all",
                highlight ? "left-[15px]" : "left-0.5",
              ].join(" ")}
            />
          </span>
          Resaltar faltantes
        </button>

        {/* Acciones: Guardar + Sincronizar (en vez de "Publicar N") */}
        <button
          type="button"
          onClick={onGuardar}
          disabled={!dirty || saving}
          className="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white text-[12.5px] font-medium text-gray-700 px-3.5 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="h-3.5 w-3.5" aria-hidden />
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onSincronizar}
          disabled={markedCount === 0 || syncBusy}
          className="h-9 inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-medium px-3.5 shadow-sm transition-colors tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UploadCloud className="h-3.5 w-3.5" aria-hidden />
          Sincronizar{markedCount > 0 ? ` (${markedCount})` : ""}
        </button>
      </div>

      {/* Mensaje de resultado de la última acción */}
      {saveMsg && (
        <div
          className={[
            "px-4 py-2 border-b text-[11.5px]",
            saveMsg.kind === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700",
          ].join(" ")}
        >
          {saveMsg.text}
        </div>
      )}

      {/* Alerta de categorías inválidas */}
      {showAlerta && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" aria-hidden />
          <p className="text-[12px] text-amber-800 leading-snug">
            <b className="font-semibold tabular-nums">{stats.error}</b> productos tienen una categoría
            que no corresponde. Corrige la <b className="font-semibold">Categoría ML</b> para poder
            publicarlos.
          </p>
          <button
            type="button"
            onClick={() => onEstado("error")}
            className="ml-auto text-[12px] font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 shrink-0"
          >
            Ver solo con error
          </button>
        </div>
      )}
    </div>
  );
}
