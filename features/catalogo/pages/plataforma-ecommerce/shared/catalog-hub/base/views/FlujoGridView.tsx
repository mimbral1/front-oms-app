// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/views/FlujoGridView.tsx
//
// Orquestador de la grilla editable (Pieza E/G/H). Junta:
//   - useFlujoGrid (carga schema+products+values, estado de edición en memoria),
//   - GridToolbar (path + stats inline + búsqueda + filtro Estado + Columnas +
//     toggle Resaltar faltantes + Guardar/Sincronizar; reemplaza a GridHeaderBar),
//   - FlujoDataGrid (la grilla tipo Excel sobre TanStack: selección, Producto,
//     columnas comunes vía GridCell, Categoría ML por fila, grupo Medidas,
//     Imágenes y columnas de atributos INLINE + toggle de sincronización),
//   - GridFooter (pie con acciones masivas: Categoría/Marca/Sync sobre la
//     selección + "Mostrando X de Y"),
//   - SidePanel (editor lateral largo de Título + Descripción) e ImagenesModal /
//     CategoryPickerModal.
//
// Unit 3: toolbar + grilla + footer viven en UNA tarjeta; el editor largo de
// descripción es el SidePanel (reemplaza al DescripcionModal) y las acciones
// masivas las cubre el GridFooter (reemplaza al BulkApplyModal).
//
// Pieza G: la categoría ML es POR FILA (`values.category_id`). Pieza H: los
// atributos de categoría ahora se editan INLINE en la grilla (vía
// useAttributeColumns + columnas de atributo), ya no por un modal aparte. El
// `modo` (Publicar/Editar) filtra qué SKUs se ven. Solo LECTURA de atributos de
// categoría — cero write a ML.
//
// Pieza F: Guardar persiste los edits en memoria (PATCH /flujos/:id/items) y
// Sincronizar empuja los SKUs marcados a ML (POST /flujos/:id/sync + polling).
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/context/auth/AuthContext";
import { calcularPrecioSugerido } from "@/features/catalogo/services/calculadoraMargen";
import { ArrowLeft, ImageUp, Loader2, Save, UploadCloud } from "lucide-react";

import { ActionButton } from "@/components/ui";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useFlujoGrid, type GridModo } from "../hooks/useFlujoGrid";
import { useFlujoSync } from "../hooks/useFlujoSync";
import { useAttributeColumns } from "../hooks/useAttributeColumns";
import { useGridSelection } from "../hooks/useGridSelection";
import { useCatalogHubGridApi, type SaveItemInput } from "../api/catalog-hub-grid-api";
import { effectiveValue, validateRow } from "../lib/grid-logic";
import { FlujoDataGrid } from "../components/FlujoDataGrid";
import { GridToolbar, type EstadoFiltro } from "../components/GridToolbar";
import { GridFooter } from "../components/GridFooter";
import { SidePanel } from "../components/SidePanel";
import { ImagenesModal } from "../components/ImagenesModal";
import { SyncProgressModal } from "../components/SyncProgressModal";
import { CategoryPickerModal } from "../../../publicar/base/components/CategoryPickerModal";
import { CalculadoraMargenModal } from "../../../publicar/base/components/CalculadoraMargenModal";
import type { GridColumn, GridRow } from "../types/grid-types";
import type {
  MarketplaceCategory,
  UploadedImage,
} from "../../../publicar/base/types/publicar-types";

/** Shape mínimo que necesita el orquestador del flujo (id + n3_id + nombre). */
export interface FlujoGridFlujo {
  id: number;
  n3_id: string;
  nombre: string;
}

export interface FlujoGridViewProps {
  flujo: FlujoGridFlujo;
  accountId: number;
  onBack: () => void;
  /** Pieza G — modo de la grilla (filtra qué SKUs entran + siembra categoría).
   *  Publicar → SKUs sin publicar (predicción); Editar → publicados (cat. actual). */
  modo?: GridModo;
  /** U4 — abre la vista de Carga masiva de imágenes para este flujo. */
  onOpenCargaMasiva?: () => void;
}

/** Keys comunes de medidas — se sacan de las columnas comunes para renderizarlas
 *  como 4 columnas numéricas propias (Peso/Largo/Ancho/Alto) en la grilla (H.2). */
const MEDIDAS_KEYS: ReadonlySet<string> = new Set([
  "seller_package_weight",
  "seller_package_length",
  "seller_package_width",
  "seller_package_height",
]);

/** Orden VISIBLE de las 4 columnas de medidas en la grilla (H.2) — debe espejar
 *  MEDIDAS_COLS de FlujoDataGrid. Se usa para armar editableColumnKeys. */
const MEDIDAS_ORDER = [
  "seller_package_weight",
  "seller_package_length",
  "seller_package_width",
  "seller_package_height",
] as const;

export function FlujoGridView({ flujo, accountId, onBack, modo = "publicar", onOpenCargaMasiva }: FlujoGridViewProps) {
  const grid = useFlujoGrid(flujo.id, flujo.n3_id, modo);
  const api = useCatalogHubGridApi();
  const sync = useFlujoSync(flujo.id);

  // Estado local de UI (selección, filtro, búsqueda, sync, modales).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<EstadoFiltro>("todos");
  const [search, setSearch] = useState("");
  // Unit 1 — toggle "Resaltar faltantes" + visibilidad de columnas (show/hide).
  const [highlight, setHighlight] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({});
  const [syncBySku, setSyncBySku] = useState<Record<string, boolean>>({});
  // Unit 3 — SKU abierto en el panel lateral de edición larga (Título + Descripción).
  const [sidePanelSku, setSidePanelSku] = useState<string | null>(null);
  const [imgModal, setImgModal] = useState<{ sku: string } | null>(null);
  const [calcModal, setCalcModal] = useState<{ sku: string } | null>(null);
  const [catPicker, setCatPicker] = useState<{ sku: string } | null>(null);
  // Unit 3 — picker de categoría en MASA (acción del footer sobre la selección).
  const [bulkCatOpen, setBulkCatOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Unit 2 — filas con la fila de detalle (DetailPanel) abierta.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((sku: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }, []);

  // SKUs marcados con el toggle de sincronización.
  const markedSkus = useMemo(
    () => Object.keys(syncBySku).filter((k) => syncBySku[k]),
    [syncBySku],
  );

  // Pieza H — atributos inline (columnas dinámicas por categoría). Se declara
  // arriba para que la siembra de visibilidad de columnas también los considere.
  const attrs = useAttributeColumns(grid.rows, grid.edits);

  // Unit 1/2 — al cambiar el set de columnas (comunes + atributos), sembramos
  // visibilidad = todas visibles para las columnas nuevas, preservando las
  // decisiones previas del usuario. (El dropdown de Columnas alterna estas banderas.)
  useEffect(() => {
    setVisibleCols((prev) => {
      const next: Record<string, boolean> = { ...prev };
      let changed = false;
      grid.columns.forEach((c) => {
        if (next[c.key] === undefined) {
          next[c.key] = true;
          changed = true;
        }
      });
      attrs.attributeColumns.forEach((c) => {
        if (next[c.key] === undefined) {
          next[c.key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [grid.columns, attrs.attributeColumns]);

  const toggleColumn = useCallback((key: string) => {
    setVisibleCols((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  }, []);

  // Edits en memoria → payload de items (solo los que realmente tienen cambios).
  const buildDirtyItems = useCallback((): SaveItemInput[] =>
    Object.entries(grid.edits)
      .map(([sku, values]) => ({ sku, values }))
      .filter((it) => Object.keys(it.values).length > 0),
  [grid.edits]);

  const onGuardar = useCallback(async () => {
    const items = buildDirtyItems();
    if (!items.length) return;
    setSaveMsg(null);
    setSaving(true);
    try {
      await api.saveItems(flujo.id, items);
      await grid.reload();
      setSaveMsg({ kind: "ok", text: "Cambios guardados." });
    } catch (e) {
      setSaveMsg({ kind: "err", text: `No se pudo guardar: ${(e as Error)?.message ?? "error"}` });
    } finally {
      setSaving(false);
    }
  }, [api, flujo.id, grid.reload, buildDirtyItems]);

  const onSincronizar = useCallback(async () => {
    if (!markedSkus.length) return;
    setSaveMsg(null);
    // El sync lee lo PERSISTIDO → guardamos primero si hay ediciones pendientes.
    if (grid.dirty) {
      const items = buildDirtyItems();
      if (items.length) {
        try {
          await api.saveItems(flujo.id, items);
        } catch (e) {
          setSaveMsg({ kind: "err", text: `No se pudo guardar antes de sincronizar: ${(e as Error)?.message ?? "error"}` });
          return;
        }
      }
    }
    setSyncOpen(true);
    await sync.start(markedSkus, accountId);
  }, [markedSkus, grid.dirty, buildDirtyItems, api, flujo.id, sync, accountId]);

  // Al terminar el sync, recargamos la grilla (C refleja el nuevo estado ML).
  useEffect(() => {
    if (sync.status?.status === "done") void grid.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.status?.status]);

  // ── Columnas para la grilla (Pieza H) ──────────────────────────────────
  // commonColumns = columnas fijas SIN medidas → titulo/precio/stock/marca/ean/
  //   descripcion. OJO: descripcion DEBE ir aquí (es fijo + launcher; GridCell
  //   lo renderiza rico). Las medidas van como 4 columnas numéricas (H.2).
  const commonColumns = useMemo<GridColumn[]>(
    () => grid.columns.filter((c) => c.group === "fijo" && !MEDIDAS_KEYS.has(c.key)),
    [grid.columns],
  );
  const imagenesCol = useMemo(
    () => grid.columns.find((c) => c.launcher === "imagenes") ?? null,
    [grid.columns],
  );
  // ¿El schema trae las medidas? (si sí, la grilla renderiza las 4 columnas numéricas).
  const hasMedidas = useMemo(
    () => grid.columns.some((c) => MEDIDAS_KEYS.has(c.key)),
    [grid.columns],
  );

  // ── Filtrado client-side (modo + búsqueda + filtro de estado) ──────────
  // Pieza G — el modo enmarca el universo: Publicar trabaja SKUs sin publicar
  // (se les siembra la categoría predicha); Editar trabaja los ya publicados
  // (categoría actual). El modo es estado de grilla, no persiste en la DB.
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grid.rows.filter((row) => {
      if (modo === "publicar" && row.publishStatus !== "no_publicado") return false;
      if (modo === "editar" && row.publishStatus === "no_publicado") return false;
      if (q) {
        const hay =
          row.nombre.toLowerCase().includes(q) || row.sku.toLowerCase().includes(q);
        if (!hay) return false;
      }
      if (estado === "todos") return true;
      const status = validateRow(row, grid.columns, grid.edits).status;
      // Mapeo EstadoFiltro → estado de validación de la fila:
      //   listos     → ok (todo completo, sin divergencias)
      //   pendientes → faltan requeridos (validateRow.status === "error")
      //   error      → revisar categoría / publicación en error (status "warn")
      //   sin        → SKU sin publicar en ML
      if (estado === "listos") return status === "ok";
      if (estado === "pendientes") return status === "error";
      if (estado === "error") return status === "warn";
      if (estado === "sin") return row.publishStatus === "no_publicado";
      return true;
    });
  }, [grid.rows, grid.columns, grid.edits, search, estado, modo]);

  // ── Pieza H — navegación tipo Excel (selección de rango 2D) ────────────
  // useGridSelection va DESPUÉS de `filteredRows` (lo consume) y ANTES del
  // return; sin condicionales (no hay early-returns en el JSX). `attrs` ya se
  // declaró arriba (junto a la siembra de visibilidad de columnas).

  // Orden VISIBLE de columnas EDITABLES (las que participan del rango 2D): las
  // comunes NO launcher (titulo/precio/stock/marca/ean — descripcion es launcher
  // y queda fuera), luego las 4 medidas (si el schema las trae) y por último los
  // atributos inline. Espeja el orden de columnas de FlujoDataGrid.
  const editableColumnKeys = useMemo<string[]>(() => [
    ...commonColumns.filter((c) => !c.launcher).map((c) => c.key),
    ...(hasMedidas ? [...MEDIDAS_ORDER] : []),
    ...attrs.attributeColumns.map((c) => c.key),
  ], [commonColumns, hasMedidas, attrs.attributeColumns]);

  const sel = useGridSelection({
    rows: filteredRows,
    columnKeys: editableColumnKeys,
    edits: grid.edits,
    setEdit: grid.setEdit,
    applyEdits: grid.applyEdits,
    appliesTo: attrs.appliesTo,
    isAttribute: (k) => attrs.attributeColumns.some((c) => c.key === k),
  });

  // ── Selección (Set<sku>) ───────────────────────────────────────────────
  const toggle = useCallback((sku: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allKeys = filteredRows.map((r) => r.sku);
      const allChecked = allKeys.length > 0 && allKeys.every((k) => prev.has(k));
      return allChecked ? new Set() : new Set(allKeys);
    });
  }, [filteredRows]);

  const allChecked =
    filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.sku));

  // Filas de los modales/paneles (resueltas desde el estado vivo de la grilla).
  const sidePanelRow = useMemo(
    () => (sidePanelSku ? grid.rows.find((r) => r.sku === sidePanelSku) ?? null : null),
    [sidePanelSku, grid.rows],
  );
  const imgRow = useMemo(
    () => (imgModal ? grid.rows.find((r) => r.sku === imgModal.sku) ?? null : null),
    [imgModal, grid.rows],
  );
  const calcRow = useMemo(
    () => (calcModal ? grid.rows.find((r) => r.sku === calcModal.sku) ?? null : null),
    [calcModal, grid.rows],
  );

  // ── Pieza 3b — cálculo inline automático del precio ──────────────────────────
  // Opción B: las medidas del paquete se llenan a mano en la grilla. El cálculo
  // SOLO corre cuando hay margen + las 4 medidas (largo/ancho/alto/peso); sin
  // medidas la calculadora no puede cotizar el envío. Se dispara al cambiar
  // cualquiera de esos 5 valores (debounce 600ms).
  const { token } = useAuth();
  const [calcLoading, setCalcLoading] = useState<Record<string, boolean>>({});
  const calcTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const prevCalcInput = useRef<Record<string, string>>({});

  interface InlineCalcInput {
    margenPct: number;
    largo: number;
    ancho: number;
    alto: number;
    pesoG: number;
    categoria: string | null;
  }

  const runInlineCalc = useCallback(
    async (sku: string, input: InlineCalcInput) => {
      setCalcLoading((s) => ({ ...s, [sku]: true }));
      try {
        const resp = await calcularPrecioSugerido(
          {
            sku,
            margen_objetivo: input.margenPct / 100, // celda guarda %, backend espera fracción
            dimensiones: { largo: input.largo, ancho: input.ancho, alto: input.alto },
            peso_kg: input.pesoG / 1000, // celda en g → kg
            ...(input.categoria ? { categoria_override: String(input.categoria) } : {}),
          },
          token,
        );
        const precio = resp.precio_redondeado_990 ?? resp.precio_sugerido;
        if (precio != null) grid.setEdit(sku, "precio", precio);
      } catch {
        // best-effort: si la calculadora falla, dejamos el precio como está.
      } finally {
        setCalcLoading((s) => ({ ...s, [sku]: false }));
      }
    },
    [grid, token],
  );

  // Observa margen + las 4 medidas por fila. Recalcula el precio (debounce) solo
  // cuando los 5 están presentes y numéricos. La calc setea `precio` (no esos
  // campos) → no hay loop.
  useEffect(() => {
    const numOf = (row: GridRow, key: string): number | null => {
      const v = effectiveValue(row, grid.edits, key);
      const n = Number(v);
      return v != null && String(v).trim() !== "" && Number.isFinite(n) ? n : null;
    };
    grid.rows.forEach((row) => {
      const sku = row.sku;
      const margenPct = numOf(row, "margen");
      const largo = numOf(row, "seller_package_length");
      const ancho = numOf(row, "seller_package_width");
      const alto = numOf(row, "seller_package_height");
      const pesoG = numOf(row, "seller_package_weight");
      const sig = [margenPct, largo, ancho, alto, pesoG].join("|");
      if (sig === prevCalcInput.current[sku]) return;
      prevCalcInput.current[sku] = sig;
      if (calcTimers.current[sku]) clearTimeout(calcTimers.current[sku]);
      // Faltan datos → no calcular (la calculadora necesita las 4 medidas).
      if (margenPct == null || largo == null || ancho == null || alto == null || pesoG == null) return;
      const categoria = effectiveValue(row, grid.edits, "category_id") as string | null;
      calcTimers.current[sku] = setTimeout(
        () => void runInlineCalc(sku, { margenPct, largo, ancho, alto, pesoG, categoria }),
        600,
      );
    });
  }, [grid.edits, grid.rows, runInlineCalc]);

  // Limpia los timers de debounce pendientes al desmontar.
  useEffect(() => {
    const timers = calcTimers.current;
    return () => {
      Object.keys(timers).forEach((k) => clearTimeout(timers[k]));
    };
  }, []);
  const imgValue = useMemo<UploadedImage[]>(() => {
    if (!imgRow) return [];
    const v = effectiveValue(imgRow, grid.edits, "__imagenes");
    return Array.isArray(v) ? (v as UploadedImage[]) : [];
  }, [imgRow, grid.edits]);
  const catPickerRow = useMemo(
    () => (catPicker ? grid.rows.find((r) => r.sku === catPicker.sku) ?? null : null),
    [catPicker, grid.rows],
  );

  // Categoría efectiva de una fila (edit sobre base) → para el diagnóstico de
  // imágenes y la categoría actual del buscador.
  const rowCategory = useCallback(
    (row: GridRow): { id: string | null; nombre: string | null } => {
      const id = effectiveValue(row, grid.edits, "category_id");
      const nombre = effectiveValue(row, grid.edits, "category_nombre");
      return {
        id: id != null && String(id).trim() !== "" ? String(id) : null,
        nombre: nombre != null ? String(nombre) : null,
      };
    },
    [grid.edits],
  );

  // Unit 1 — mapeo de KPIs de la grilla al shape del toolbar:
  //   ok   (todo completo)            → listo
  //   error(faltan requeridos)        → pendiente ("con faltantes")
  //   warn (revisar categoría/estado) → error ("con error")
  const stats = useMemo(
    () => ({
      total: grid.kpis.total,
      listo: grid.kpis.ok,
      pendiente: grid.kpis.error,
      error: grid.kpis.warn,
      sinPublicar: grid.rows.filter((r) => r.publishStatus === "no_publicado").length,
    }),
    [grid.kpis, grid.rows],
  );

  // Unit 3 — marcas distintas presentes en la grilla (valor efectivo), para el
  // dropdown "Marca" del footer. Set → Array.from (es5-safe; sin spread sobre Set).
  const marcas = useMemo(
    () =>
      Array.from(
        new Set(
          grid.rows
            .map((r) => effectiveValue(r, grid.edits, "marca"))
            .filter(Boolean)
            .map(String),
        ),
      ),
    [grid.rows, grid.edits],
  );

  // Unit 1/2 — columnas ofrecibles en el dropdown de Columnas: las comunes (sin
  // las de control/launcher) MÁS los atributos de categoría (Unit 2). Así el
  // usuario puede mostrar/ocultar también los atributos dinámicos.
  const toolbarColumns = useMemo(
    () => [
      ...grid.columns
        .filter((c) => c.group !== "control")
        .map((c) => ({ key: c.key, label: c.label, required: !!c.required, always: false })),
      ...attrs.attributeColumns.map((c) => ({
        key: c.key,
        label: c.label,
        required: !!c.required,
        always: false,
      })),
    ],
    [grid.columns, attrs.attributeColumns],
  );

  return (
    // Altura acotada a la pantalla: la ventana NO scrollea (overflow-hidden) →
    // header, toolbar y footer quedan fijos; SOLO el cuerpo de la grilla scrollea
    // (su propio overflow-auto, ambos ejes). Se mantiene layout de bloque para no
    // romper la contención horizontal de la tabla.
    <div className="flex h-screen w-full min-w-0 max-w-full flex-col overflow-hidden">
      <EcommercePageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
              aria-hidden
            >
              ML
            </span>
            Catalog Hub · {modo === "editar" ? "Editar" : "Publicar"}
          </span>
        }
        title={flujo.nombre}
        actions={
          <div className="flex items-center gap-2">
            {onOpenCargaMasiva && (
              <ActionButton variant="secondary" size="sm" onClick={onOpenCargaMasiva}>
                <ImageUp className="w-4 h-4" /> Carga masiva
              </ActionButton>
            )}
            <ActionButton
              variant="secondary" size="sm"
              disabled={!grid.dirty || saving}
              onClick={() => void onGuardar()}
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando…" : "Guardar"}
            </ActionButton>
            <ActionButton
              variant="primary" size="sm"
              disabled={markedSkus.length === 0 || sync.busy}
              onClick={() => void onSincronizar()}
            >
              <UploadCloud className="w-4 h-4" />
              Sincronizar{markedSkus.length ? ` (${markedSkus.length})` : ""}
            </ActionButton>
          </div>
        }
      />

      <div className="flex h-11 min-w-0 items-center gap-3 border-b border-gray-200 bg-white px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver
        </button>
        {saveMsg ? (
          <span
            className={[
              "ml-auto text-[11.5px]",
              saveMsg.kind === "ok" ? "text-emerald-700" : "text-rose-700",
            ].join(" ")}
          >
            {saveMsg.text}
          </span>
        ) : grid.dirty ? (
          <span className="ml-auto text-[11.5px] text-amber-700">
            Cambios sin guardar (solo en memoria)
          </span>
        ) : null}
      </div>

      {/* Avisos de la grilla (categoría no mapeada, estado no disponible, etc.) */}
      {grid.warnings.length > 0 && (
        <div className="mx-6 mt-4 flex min-w-0 flex-wrap gap-2">
          {grid.warnings.map((w, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-[12px] text-amber-800"
            >
              <span aria-hidden>⚠</span>
              {w}
            </span>
          ))}
        </div>
      )}

      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-hidden bg-gray-100 px-6 py-6">
        {grid.loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-[13px]">
            <span className="inline-block h-5 w-5 mr-3 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
            Cargando grilla…
          </div>
        ) : grid.error ? (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            <div className="mb-2">
              <strong>Error:</strong> {grid.error}
            </div>
            <ActionButton variant="secondary" size="sm" onClick={() => void grid.reload()}>
              Reintentar
            </ActionButton>
          </div>
        ) : (
          <>
            {/* Pieza H — aviso NO bloqueante de carga/error de atributos. Va
                FUERA de la tarjeta (arriba) para no romper la costura toolbar↔grilla. */}
            {attrs.loading ? (
              <div className="inline-flex items-center gap-2 text-[11.5px] text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Cargando atributos…
              </div>
            ) : attrs.error ? (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                No se pudieron cargar algunos atributos: {attrs.error}
              </div>
            ) : null}

            {grid.rows.length === 0 ? (
              <div className="bg-white rounded-md border border-gray-200 py-12 text-center text-gray-500">
                Sin productos en esta N3.
              </div>
            ) : (
              // Unit 3 — TARJETA ÚNICA: toolbar (cabecera) + grilla + footer.
              // flex-1 + min-h-0 + flex-col: la grilla (hija) toma el alto restante
              // y scrollea sola; toolbar y footer quedan fijos arriba/abajo.
              // Sin overflow-hidden para no recortar los dropdowns `up` del footer.
              <div className="min-w-0 max-w-full rounded-lg border border-gray-200 bg-white shadow-sm">
                <GridToolbar
                  n3Header={grid.n3Header}
                  stats={stats}
                  estado={estado}
                  onEstado={setEstado}
                  search={search}
                  onSearch={setSearch}
                  columns={toolbarColumns}
                  visible={visibleCols}
                  onToggleColumn={toggleColumn}
                  highlight={highlight}
                  onToggleHighlight={() => setHighlight((h) => !h)}
                  dirty={grid.dirty}
                  saving={saving}
                  onGuardar={() => void onGuardar()}
                  markedCount={markedSkus.length}
                  syncBusy={sync.busy}
                  onSincronizar={() => void onSincronizar()}
                  saveMsg={saveMsg}
                />

                {/* Pista de uso — antes vivía en el footer; ahora arriba, junto a la
                    toolbar, para que se vea sin scrollear hasta el fondo. */}
                <div className="px-4 py-1.5 border-b border-gray-100 bg-white text-[11.5px] text-gray-500">
                  Edita cualquier celda; los campos obligatorios vacíos se marcan al pasar el mouse por
                  la fila.
                </div>

                <FlujoDataGrid
                  rows={filteredRows}
                  commonColumns={commonColumns}
                  imagenesCol={imagenesCol}
                  hasMedidas={hasMedidas}
                  attributeColumns={attrs.attributeColumns}
                  edits={grid.edits}
                  appliesTo={attrs.appliesTo}
                  selected={selected}
                  syncBySku={syncBySku}
                  allChecked={allChecked}
                  onToggleSelect={toggle}
                  onToggleSelectAll={toggleAll}
                  onSetEdit={grid.setEdit}
                  onOpenCategoria={(sku) => setCatPicker({ sku })}
                  onToggleSync={(sku, v) => setSyncBySku((s) => ({ ...s, [sku]: v }))}
                  allColumns={grid.columns}
                  visible={visibleCols}
                  highlight={highlight}
                  expanded={expanded}
                  onToggleExpand={toggleExpand}
                  onOpenSidePanel={(sku) => setSidePanelSku(sku)}
                  onOpenImagenes={(sku) => setImgModal({ sku })}
                  onOpenCalculadora={(sku) => setCalcModal({ sku })}
                  calcLoadingSkus={calcLoading}
                  onSetCategoria={grid.setCategoria}
                  prediccionesBySku={grid.prediccionesBySku}
                  editing={sel.editing}
                  initialChar={sel.initialChar}
                  isInRange={sel.isInRange}
                  isAnchor={sel.isAnchor}
                  onBeginSelect={sel.beginSelect}
                  onExtendSelect={sel.extendSelect}
                  onStartEdit={sel.startEdit}
                  onStopEdit={sel.stopEdit}
                  onCommitEdit={sel.commitEdit}
                />

                <GridFooter
                  selectedCount={selected.size}
                  marcas={marcas}
                  onApplyMarca={(m) => grid.applyBulkEdit(Array.from(selected), "marca", m)}
                  onApplySync={(on) =>
                    setSyncBySku((s) => {
                      const n = { ...s };
                      Array.from(selected).forEach((sku) => {
                        n[sku] = on;
                      });
                      return n;
                    })
                  }
                  onApplyCategoria={() => setBulkCatOpen(true)}
                  onClearSelection={() => setSelected(new Set())}
                  shownCount={filteredRows.length}
                  total={grid.kpis.total}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales / paneles */}
      {/* Unit 3 — editor lateral largo (Título + Descripción). Comparte las keys
          `titulo`/`descripcion` con el inline de la grilla → editan el mismo valor. */}
      <SidePanel
        open={!!sidePanelSku}
        sku={sidePanelSku}
        nombre={sidePanelRow?.nombre ?? ""}
        titulo={String(effectiveValue(sidePanelRow ?? ({} as GridRow), grid.edits, "titulo") ?? "")}
        descripcion={String(
          effectiveValue(sidePanelRow ?? ({} as GridRow), grid.edits, "descripcion") ?? "",
        )}
        onChange={(key, value) => sidePanelSku && grid.setEdit(sidePanelSku, key, value)}
        onClose={() => setSidePanelSku(null)}
      />

      {imgRow && (
        <ImagenesModal
          open={!!imgModal}
          images={imgValue}
          onChange={(imgs) => imgModal && grid.setEdit(imgModal.sku, "__imagenes", imgs)}
          onClose={() => setImgModal(null)}
          // Pieza G: la categoría es por fila (`mlCategory` grilla-wide se quitó).
          // El diagnóstico de imágenes usa la categoría efectiva del SKU.
          categoryId={rowCategory(imgRow).id ?? undefined}
          title={`Imágenes · ${imgRow.nombre}`}
        />
      )}

      {/* Pieza 3a — calculadora de margen por fila (launcher en la celda Precio).
          allowBackendDims: el backend resuelve costo (SAP) + categoría + dims; el
          snapshot aporta lo que ya hay en la fila. Al confirmar setea el precio. */}
      {calcRow && (
        <CalculadoraMargenModal
          open={!!calcModal}
          marketplace="ml"
          // Opción B: para productos NUEVOS el backend no resuelve medidas (no hay
          // ítem ni dims en SAP) → el modal exige las 4 medidas + categoría (se
          // prellenan desde la grilla vía el snapshot, o se completan en el modal).
          // Si el SKU ya está publicado, el modal cotiza el envío por item_id.
          allowBackendDims={!!calcRow.itemId}
          snapshot={{
            sku: calcRow.sku,
            categoryId: rowCategory(calcRow).id ?? null,
            itemId: calcRow.itemId ?? null,
            currentPrice: Number(effectiveValue(calcRow, grid.edits, "precio")) || 0,
            largoRaw: effectiveValue(calcRow, grid.edits, "seller_package_length"),
            anchoRaw: effectiveValue(calcRow, grid.edits, "seller_package_width"),
            altoRaw: effectiveValue(calcRow, grid.edits, "seller_package_height"),
            pesoRaw: effectiveValue(calcRow, grid.edits, "seller_package_weight"),
          }}
          initialMargenPct={(() => {
            const mg = effectiveValue(calcRow, grid.edits, "margen");
            return mg != null && String(mg).trim() !== "" ? Number(mg) : undefined;
          })()}
          onClose={() => setCalcModal(null)}
          onConfirm={(precio) => {
            if (calcModal) grid.setEdit(calcModal.sku, "precio", precio);
            setCalcModal(null);
          }}
        />
      )}

      {/* Pieza G — buscador de categoría directo desde la columna Categoría ML. */}
      {catPickerRow && (
        <CategoryPickerModal
          open={!!catPicker}
          channel="ml"
          current={
            rowCategory(catPickerRow).id
              ? ({
                  id: rowCategory(catPickerRow).id as string,
                  nombre: rowCategory(catPickerRow).nombre ?? undefined,
                } as MarketplaceCategory)
              : null
          }
          onSelect={(cat) =>
            grid.setCategoria(catPickerRow.sku, {
              id: cat.id,
              nombre: cat.nombre ?? cat.path ?? null,
            })
          }
          onClose={() => setCatPicker(null)}
        />
      )}

      {/* Unit 3 — categoría en MASA: el footer abre este picker y la categoría
          elegida se aplica a TODA la selección (reemplaza al BulkApplyModal). */}
      <CategoryPickerModal
        open={bulkCatOpen}
        channel="ml"
        current={null}
        onSelect={(cat) =>
          Array.from(selected).forEach((sku) =>
            grid.setCategoria(sku, { id: cat.id, nombre: cat.nombre ?? cat.path ?? null }),
          )
        }
        onClose={() => setBulkCatOpen(false)}
      />

      <SyncProgressModal
        open={syncOpen}
        status={sync.status}
        error={sync.error}
        onClose={() => { setSyncOpen(false); sync.reset(); }}
      />
    </div>
  );
}
