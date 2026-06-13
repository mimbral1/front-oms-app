// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/views/FlujoWizardView.tsx
//
// Wizard de creación de flujos (Pieza B · U4). 3 steps:
//   1. Conexiones — MercadoLibre preseleccionado (implícito, no persiste nada).
//   2. Productos  — selección desde la bandeja "Productos a publicar"
//      (Disponibles). El usuario marca productos; el backend agrupa por categoría
//      N3 y crea N flujos (auto-split). Acá previsualizamos ese split resolviendo
//      la N3 de cada SKU.
//   3. Trabajando — prefijo (opcional) + modo (Publicar/Editar) + resumen del
//      split → "Crear N flujos".
//
// Al crear, llamamos `crearFlujosDesdeSeleccion` (un flujo por categoría) y, best
// effort, hacemos `claim` de las filas seleccionadas por lote. Abrimos la grilla
// del primer flujo creado.
//
// HARD CONSTRAINT: no hay writes a ML ni a ningún marketplace. Las llamadas de red
// son al PIM propio: getPool (bandeja), resolveN3 (lectura), crearFlujosDesdeSeleccion
// y claim (DB propia de imports).

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Link2, ListChecks, Pencil, Check } from "lucide-react";

import { ActionButton, Input, Select } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcommercePageHeader, FieldRow } from "../../../../_shared/ui";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useCatalogHubApi } from "../api/catalog-hub-api";
import { useCargaMasivaApi } from "../../../carga-masiva/base/api/carga-masiva-api";
import type { BulkRow } from "../../../carga-masiva/base/types/carga-masiva-types";
import type { GridModo } from "../hooks/useFlujoGrid";
import type { Flujo } from "../types/flujo-types";

export interface FlujoWizardViewProps {
  /** Cuenta ML activa — define el universo de la bandeja "Productos a publicar". */
  accountId: number;
  onCancel: () => void;
  /** Pieza G — además del flujo creado, devolvemos el modo elegido (Publicar /
   *  Editar). El modo NO se persiste: es estado de grilla que el orquestador
   *  pasa a `FlujoGridView`. */
  onCreated: (flujo: Flujo, modo: GridModo) => void;
  cupo: { activos: number; max: number };
}

/** Opciones del selector de modo (Pieza G). Dropdown — NADA de pills. */
const MODO_OPTIONS: ReadonlyArray<{ value: GridModo; label: string }> = [
  { value: "publicar", label: "Publicar — productos sin publicar (categoría sugerida)" },
  { value: "editar", label: "Editar — productos ya publicados (categoría actual)" },
];

type WizardStep = "conexiones" | "productos" | "trabajando";
const STEP_ORDER: WizardStep[] = ["conexiones", "productos", "trabajando"];

const STEPS: TabItem[] = [
  { id: "conexiones", label: "Conexiones", icon: Link2 },
  { id: "productos", label: "Productos", icon: ListChecks },
  { id: "trabajando", label: "Trabajando", icon: Pencil },
];

/** N3 resuelta por SKU (para la columna Categoría y el resumen del split). */
type N3Info = { n3_id: string | null; n3_nombre: string | null };

/** Key estable de una fila cross-lote (batchId:rowNumber). */
function rowKey(r: BulkRow): string {
  return `${r.batchId ?? "?"}:${r.rowNumber}`;
}

/** Una línea del resumen del split: categoría → cantidad. */
type SplitLine = { n3_id: string; nombre: string; count: number };

export function FlujoWizardView({ accountId, onCancel, onCreated, cupo }: FlujoWizardViewProps) {
  const [step, setStep] = useState<WizardStep>("conexiones");
  const [prefijo, setPrefijo] = useState("");
  const [modo, setModo] = useState<GridModo>("publicar");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pool (bandeja "Productos a publicar", filtro Disponibles).
  const [poolRows, setPoolRows] = useState<BulkRow[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);
  // N3 resuelta por SKU (una sola llamada a resolveN3).
  const [n3BySku, setN3BySku] = useState<Record<string, N3Info>>({});
  // Selección de productos (keys `${batchId}:${rowNumber}`).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const catalogHubApi = useCatalogHubApi();
  const cargaMasivaApi = useCargaMasivaApi();
  const { user } = useAuth();
  const userId = Number(user?.id) || 0;

  const cupoLleno = cupo.activos >= cupo.max && cupo.max > 0;

  // Carga del pool + resolución de N3 (una sola vez al entrar al paso).
  const loadPool = useCallback(async () => {
    setPoolLoading(true);
    setPoolError(null);
    try {
      const rows = await cargaMasivaApi.getPool({ accountId, status: "disponible" });
      setPoolRows(rows);
      // SKUs no nulos para resolver categorías en una sola llamada.
      const skus: string[] = [];
      rows.forEach((r) => { if (r.sku) skus.push(String(r.sku)); });
      if (skus.length > 0) {
        const res = await catalogHubApi.resolveN3(skus);
        const map: Record<string, N3Info> = {};
        res.data.forEach((e) => { map[e.sku] = { n3_id: e.n3_id, n3_nombre: e.n3_nombre }; });
        setN3BySku(map);
      } else {
        setN3BySku({});
      }
    } catch (e) {
      setPoolError((e as Error)?.message ?? "No se pudo cargar la bandeja.");
    } finally {
      setPoolLoading(false);
    }
  }, [cargaMasivaApi, catalogHubApi, accountId]);

  // Dispara la carga al entrar al paso "productos" (una vez).
  const [poolRequested, setPoolRequested] = useState(false);
  useEffect(() => {
    if (step === "productos" && !poolRequested) {
      setPoolRequested(true);
      void loadPool();
    }
  }, [step, poolRequested, loadPool]);

  // Filas filtradas por búsqueda (sku/título).
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return poolRows;
    return poolRows.filter((r) => {
      const sku = (r.sku ?? "").toLowerCase();
      const title = (r.title ?? "").toLowerCase();
      return sku.indexOf(q) !== -1 || title.indexOf(q) !== -1;
    });
  }, [poolRows, search]);

  const toggle = useCallback((r: BulkRow) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = rowKey(r);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  // Seleccionar/deseleccionar todo lo FILTRADO.
  const toggleAllFiltered = useCallback(() => {
    setSelected((prev) => {
      const allSelected = filteredRows.length > 0 && filteredRows.every((r) => prev.has(rowKey(r)));
      const next = new Set(prev);
      if (allSelected) {
        filteredRows.forEach((r) => next.delete(rowKey(r)));
      } else {
        filteredRows.forEach((r) => next.add(rowKey(r)));
      }
      return next;
    });
  }, [filteredRows]);

  const allFilteredChecked = filteredRows.length > 0 && filteredRows.every((r) => selected.has(rowKey(r)));

  // Filas seleccionadas (con sku).
  const selectedRows = useMemo(
    () => poolRows.filter((r) => r.sku && selected.has(rowKey(r))),
    [poolRows, selected],
  );

  // Resumen del split: agrupa los SELECCIONADOS por n3_id resuelto. Los que no
  // resolvieron N3 cuentan como "sin categoría".
  const split = useMemo(() => {
    const byN3: Record<string, SplitLine> = {};
    let sinCategoria = 0;
    selectedRows.forEach((r) => {
      const info = r.sku ? n3BySku[String(r.sku)] : undefined;
      const n3 = info?.n3_id ?? null;
      if (!n3) {
        sinCategoria += 1;
        return;
      }
      if (!byN3[n3]) {
        byN3[n3] = { n3_id: n3, nombre: info?.n3_nombre ?? n3, count: 0 };
      }
      byN3[n3].count += 1;
    });
    const lines = Object.keys(byN3).map((k) => byN3[k]);
    return { lines, sinCategoria };
  }, [selectedRows, n3BySku]);

  const nFlujos = split.lines.length;
  // Al menos 1 producto seleccionado CON categoría.
  const canSubmit = nFlujos > 0;

  // Navegación entre steps. Atrás siempre libre; avanzar a "trabajando" exige
  // al menos un producto seleccionado con categoría.
  const handleStepChange = useCallback(
    (id: string) => {
      const target = id as WizardStep;
      const targetIdx = STEP_ORDER.indexOf(target);
      const curIdx = STEP_ORDER.indexOf(step);
      if (targetIdx <= curIdx) {
        setStep(target);
        return;
      }
      if (target === "trabajando" && !canSubmit) return; // gate: requiere split válido
      setStep(target);
    },
    [step, canSubmit],
  );

  const handleCrear = useCallback(async () => {
    if (!canSubmit || creating) return;
    const selRows = poolRows.filter((r) => r.sku && selected.has(rowKey(r)));
    const items = selRows.map((r) => ({ sku: String(r.sku) }));
    setCreating(true);
    setError(null);
    try {
      const { flujos, sinCategoria } = await catalogHubApi.crearFlujosDesdeSeleccion(
        items,
        prefijo.trim() || null,
      );
      // Claim best-effort (no aborta si falla): agrupar por batchId y claimear por batch.
      try {
        const byBatch: Record<string, number[]> = {};
        selRows.forEach((r) => {
          if (!r.batchId) return;
          (byBatch[r.batchId] = byBatch[r.batchId] || []).push(r.rowNumber);
        });
        const batchIds = Object.keys(byBatch);
        for (let i = 0; i < batchIds.length; i++) {
          await cargaMasivaApi.claim(batchIds[i], byBatch[batchIds[i]], userId);
        }
      } catch (_) {
        /* claim best-effort: el flujo ya se creó */
      }
      if (flujos && flujos.length > 0) {
        onCreated(flujos[0], modo); // abre el primero (como hoy)
      } else {
        const extra = sinCategoria.length > 0 ? ` (${sinCategoria.length} sin categoría)` : "";
        setError(`No se creó ningún flujo (¿todos sin categoría?).${extra}`);
      }
    } catch (e) {
      setError((e as Error)?.message ?? "No se pudieron crear los flujos.");
    } finally {
      setCreating(false);
    }
  }, [canSubmit, creating, poolRows, selected, prefijo, modo, userId, catalogHubApi, cargaMasivaApi, onCreated]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <EcommercePageHeader
          eyebrow="Catalog Hub · Nuevo flujo"
          title="Crear flujo"
          actions={
            <ActionButton variant="secondary" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" /> Volver
            </ActionButton>
          }
        />
        <div className="bg-white px-6 border-b border-gray-200">
          <Tabs tabs={STEPS} value={step} onChange={handleStepChange} />
        </div>
      </div>

      <div className="flex-1 bg-gray-100 px-6 py-6">
        {step === "conexiones" && (
          <WizardConexiones onNext={() => setStep("productos")} cupoLleno={cupoLleno} />
        )}

        {step === "productos" && (
          <WizardProductos
            rows={filteredRows}
            n3BySku={n3BySku}
            selected={selected}
            search={search}
            loading={poolLoading}
            error={poolError}
            allFilteredChecked={allFilteredChecked}
            split={split}
            nFlujos={nFlujos}
            canSubmit={canSubmit}
            onSearch={setSearch}
            onToggle={toggle}
            onToggleAll={toggleAllFiltered}
            onReload={loadPool}
            onBack={() => setStep("conexiones")}
            onNext={() => setStep("trabajando")}
          />
        )}

        {step === "trabajando" && (
          <WizardTrabajando
            prefijo={prefijo}
            modo={modo}
            split={split}
            nFlujos={nFlujos}
            seleccionados={selectedRows.length}
            creating={creating}
            error={error}
            onPrefijo={setPrefijo}
            onModo={setModo}
            onBack={() => setStep("productos")}
            onCrear={handleCrear}
          />
        )}
      </div>
    </div>
  );
}

// ── Step 1: Conexiones ──────────────────────────────────────────────────────
// ML preseleccionado (fijo). No persiste nada; el marketplace es implícito.
function WizardConexiones({ onNext, cupoLleno }: { onNext: () => void; cupoLleno: boolean }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-md border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900">Conexión del flujo</h2>
        <p className="text-[12.5px] text-gray-500 mt-1">
          Por ahora los flujos trabajan sobre MercadoLibre. La conexión queda
          preseleccionada.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-md border-2 border-blue-500 bg-blue-50 px-4 py-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold">
            ML
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">MercadoLibre</div>
            <div className="text-[11.5px] text-gray-500">Marketplace conectado</div>
          </div>
          <Check className="w-5 h-5 text-blue-600 shrink-0" />
        </div>

        {cupoLleno && (
          <div className="mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2.5 text-[12.5px] text-rose-700">
            Cupo de flujos activos lleno. Pausa o elimina uno para poder crear otro.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <ActionButton variant="primary" size="sm" onClick={onNext}>
            Siguiente
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Productos ───────────────────────────────────────────────────────
// Selección de productos de la bandeja "Productos a publicar" (Disponibles). El
// backend agrupará por categoría N3 y creará N flujos; acá previsualizamos ese
// split con la N3 resuelta por SKU.
function WizardProductos({
  rows,
  n3BySku,
  selected,
  search,
  loading,
  error,
  allFilteredChecked,
  split,
  nFlujos,
  canSubmit,
  onSearch,
  onToggle,
  onToggleAll,
  onReload,
  onBack,
  onNext,
}: {
  rows: BulkRow[];
  n3BySku: Record<string, N3Info>;
  selected: Set<string>;
  search: string;
  loading: boolean;
  error: string | null;
  allFilteredChecked: boolean;
  split: { lines: SplitLine[]; sinCategoria: number };
  nFlujos: number;
  canSubmit: boolean;
  onSearch: (v: string) => void;
  onToggle: (r: BulkRow) => void;
  onToggleAll: () => void;
  onReload: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Productos a publicar</h2>
          <p className="text-[12.5px] text-gray-500 mt-1">
            Elige los productos disponibles en la bandeja. Al crear, se agrupan por
            categoría y se genera un flujo por cada una.
          </p>
        </div>

        <div className="px-6 pt-4 pb-3 flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por SKU o título…"
            className="w-full max-w-sm h-8 px-2.5 text-[12.5px] bg-gray-50 border border-gray-200 rounded outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <span className="ml-auto text-[11.5px] text-gray-500 tabular-nums">
            {loading ? "Cargando…" : `${rows.length.toLocaleString("es-CL")} productos`}
          </span>
        </div>

        {error && (
          <div className="mx-6 mb-3 rounded-md bg-rose-50 border border-rose-200 px-4 py-2.5 text-[12.5px] text-rose-700 flex items-center justify-between gap-3">
            <span><strong>Error:</strong> {error}</span>
            <button type="button" onClick={onReload} className="text-[11.5px] text-rose-800 underline shrink-0">
              Reintentar
            </button>
          </div>
        )}

        <div className="max-h-[420px] overflow-auto border-t border-gray-100">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-[10.5px] uppercase tracking-wide text-gray-500 border-b border-gray-200">
                <th className="py-2 pl-5 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredChecked}
                    onChange={onToggleAll}
                    aria-label="Seleccionar todo"
                    disabled={rows.length === 0}
                  />
                </th>
                <th className="text-left py-2 px-2">SKU</th>
                <th className="text-left py-2 px-2">Título</th>
                <th className="text-left py-2 px-2 w-56">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400 text-[12.5px]">
                    Cargando…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-500 text-[12.5px]">
                    {search.trim()
                      ? "Sin resultados para la búsqueda."
                      : "No hay productos disponibles en la bandeja."}
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const k = rowKey(r);
                  const info = r.sku ? n3BySku[String(r.sku)] : undefined;
                  const catLabel = info?.n3_nombre ?? null;
                  const sinCat = !info?.n3_id;
                  return (
                    <tr
                      key={k}
                      className={[
                        "border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 cursor-pointer",
                        selected.has(k) ? "bg-blue-50/40" : "",
                      ].join(" ")}
                      onClick={() => onToggle(r)}
                    >
                      <td className="py-2 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(k)}
                          onChange={() => onToggle(r)}
                          aria-label={`Seleccionar ${r.sku ?? ""}`}
                        />
                      </td>
                      <td className="py-2 px-2 font-medium text-gray-900 tabular-nums">
                        {r.sku || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="py-2 px-2 text-gray-700">
                        {r.title ?? <span className="text-gray-400 italic">(sin título)</span>}
                      </td>
                      <td className="py-2 px-2">
                        {sinCat ? (
                          <span className="text-amber-700">Sin categoría</span>
                        ) : (
                          <span className="text-gray-700">{catLabel}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen del split */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-[10.5px] uppercase tracking-wide text-gray-500">Resumen</div>
          {canSubmit ? (
            <div className="mt-1 text-[12.5px] text-gray-700">
              Tu selección crea <strong className="text-gray-900">{nFlujos} flujo{nFlujos === 1 ? "" : "s"}</strong>:{" "}
              {split.lines.map((l, i) => (
                <span key={l.n3_id}>
                  {i > 0 ? ", " : ""}
                  {l.nombre} ({l.count})
                </span>
              ))}
              {split.sinCategoria > 0 && (
                <span className="text-amber-700"> · {split.sinCategoria} sin categoría</span>
              )}
            </div>
          ) : (
            <p className="mt-1 text-[12.5px] text-gray-400">
              Selecciona al menos un producto con categoría para continuar.
              {split.sinCategoria > 0 && (
                <span className="text-amber-700"> ({split.sinCategoria} sin categoría no entran en ningún flujo.)</span>
              )}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <ActionButton variant="secondary" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Atrás
          </ActionButton>
          <ActionButton variant="primary" size="sm" onClick={onNext} disabled={!canSubmit}>
            Siguiente
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Trabajando ──────────────────────────────────────────────────────
// Prefijo (opcional) + modo (Publicar/Editar) + resumen del split → "Crear N flujos".
function WizardTrabajando({
  prefijo,
  modo,
  split,
  nFlujos,
  seleccionados,
  creating,
  error,
  onPrefijo,
  onModo,
  onBack,
  onCrear,
}: {
  prefijo: string;
  modo: GridModo;
  split: { lines: SplitLine[]; sinCategoria: number };
  nFlujos: number;
  seleccionados: number;
  creating: boolean;
  error: string | null;
  onPrefijo: (v: string) => void;
  onModo: (v: GridModo) => void;
  onBack: () => void;
  onCrear: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-md border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900">Datos del flujo</h2>

        <div className="mt-4 space-y-1">
          <FieldRow label="Prefijo">
            <Input
              value={prefijo}
              onChange={(e) => onPrefijo(e.target.value)}
              placeholder="Prefijo para el nombre (opcional)"
              autoFocus
            />
          </FieldRow>
          {/* Pieza G — modo Publicar/Editar (dropdown, NADA de pills). Enmarca
              qué SKUs trabaja la grilla y de dónde sale la categoría. */}
          <FieldRow label="¿Publicar o editar?">
            <Select
              options={MODO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={modo}
              onValueChange={(v) => onModo(v as GridModo)}
              placeholder="Selecciona el modo…"
            />
          </FieldRow>
        </div>

        {/* Resumen */}
        <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-[12.5px] text-gray-700 space-y-1">
          <div className="text-[10.5px] uppercase tracking-wide text-gray-500">Resumen</div>
          <div>
            Conexión: <strong className="text-gray-900">MercadoLibre</strong>
          </div>
          <div>
            Modo:{" "}
            <strong className="text-gray-900">
              {modo === "editar" ? "Editar" : "Publicar"}
            </strong>
          </div>
          <div>
            Productos seleccionados: <strong className="text-gray-900 tabular-nums">{seleccionados}</strong>
          </div>
          <div>
            Flujos a crear:{" "}
            <strong className="text-gray-900">
              {nFlujos}
            </strong>{" "}
            ({split.lines.map((l, i) => (
              <span key={l.n3_id}>
                {i > 0 ? ", " : ""}
                {l.nombre} ({l.count})
              </span>
            ))})
          </div>
          {split.sinCategoria > 0 && (
            <div className="text-amber-700">
              {split.sinCategoria} producto{split.sinCategoria === 1 ? "" : "s"} sin categoría no entran en ningún flujo.
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2.5 text-[12.5px] text-rose-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <ActionButton variant="secondary" size="sm" onClick={onBack} disabled={creating}>
            <ArrowLeft className="w-4 h-4" /> Atrás
          </ActionButton>
          <ActionButton
            variant="primary"
            size="sm"
            onClick={onCrear}
            loading={creating}
            disabled={nFlujos === 0 || creating}
          >
            Crear {nFlujos} flujo{nFlujos === 1 ? "" : "s"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
