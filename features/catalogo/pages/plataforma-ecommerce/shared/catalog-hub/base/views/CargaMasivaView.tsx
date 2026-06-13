// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/views/CargaMasivaView.tsx
//
// Vista de PANTALLA COMPLETA de la "Carga masiva de imágenes" del Catalog Hub
// (Unit 3). Porta el prototipo (carga-masiva-de-imagnes/project/carga.jsx, App
// ~202-487) a TS + tipografía OMS y lo cablea al matcher (U1, matchFilesToSkus) y
// al hook (U2, useCargaMasiva).
//
// Esta vista NO se monta todavía (eso es U4): compila sola con sus props. NO toca
// ML ni hace red nueva — toda la subida/persistencia vive en el hook; aquí solo
// se arma la UI, se llama al matcher para previsualizar y al hook para subir.
//
// es5-safe: nada de for...of/spread sobre Map/Set; sobre arrays (.map/.reduce/
// índices) está OK.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  FolderUp,
  ImageUp,
  Info,
  Search,
  X,
} from "lucide-react";

import { GridDropdown } from "../components/GridDropdown";
import { SkuRow } from "../components/carga-masiva/SkuRow";
import { SkuGroup } from "../components/carga-masiva/SkuGroup";
import { UnmatchedSection } from "../components/carga-masiva/UnmatchedSection";
import { UploadOverlay } from "../components/carga-masiva/UploadOverlay";
import { ResultZone } from "../components/carga-masiva/ResultZone";
import { ManualZone } from "../components/carga-masiva/ManualZone";
import { useCargaMasiva, type CargaSku } from "../hooks/useCargaMasiva";
import { matchFilesToSkus, type MatchResult } from "../lib/bulk-image-match";

const LILA = "#E8EAF7";

/** Forma mínima de un flujo para esta vista (id + n3_id + nombre). */
export interface CargaMasivaFlujo {
  id: number;
  n3_id: string | null;
  nombre: string;
}

export interface CargaMasivaViewProps {
  flujo?: CargaMasivaFlujo | null;
  flujos: CargaMasivaFlujo[];
  /** true = abre en "Todos los flujos"; false = abre directo al flujo recibido. */
  initialTodos?: boolean;
  onSelectFlujo: (f: CargaMasivaFlujo) => void;
  onBack: () => void;
}

type View = "idle" | "preview" | "uploading" | "result";
type Filter = "todos" | "sin" | "con";

const FILTER_LABELS: Record<Filter, string> = {
  todos: "Todos",
  sin: "Sin fotos",
  con: "Con fotos",
};

export function CargaMasivaView({ flujo, flujos, initialTodos = true, onSelectFlujo, onBack }: CargaMasivaViewProps) {
  const selectedFlujo = flujo ?? flujos[0] ?? null;
  // "Todos los flujos": opera sobre la UNIÓN de todos los flujos. La lista junta
  // los SKUs de los 7 flujos y, al guardar, cada foto se rutea a SU flujo
  // automáticamente. Si es false, opera solo sobre el flujo seleccionado.
  // El origen decide el alcance inicial: botón global = todos; grilla abierta =
  // solo el flujo actual. Luego el usuario puede cambiarlo desde el selector.
  const [todos, setTodos] = useState(initialTodos);
  const flujosArg = useMemo(
    () =>
      todos
        ? flujos.map((f) => ({ id: f.id, n3Id: f.n3_id ?? "" }))
        : selectedFlujo
          ? [{ id: selectedFlujo.id, n3Id: selectedFlujo.n3_id ?? "" }]
          : [],
    [todos, flujos, selectedFlujo],
  );
  const carga = useCargaMasiva({ flujos: flujosArg });

  // ── Estado de UI ─────────────────────────────────────────────────────────
  const [view, setView] = useState<View>("idle");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");

  // Manual: SKU abierto, etapa, y las fotos nuevas (orden = el del array; cada una
  // con un id estable de un contador para poder quitarlas/reordenarlas).
  const [manualSku, setManualSku] = useState<string | null>(null);
  const [manualStage, setManualStage] = useState<"pick" | "uploading" | "result">("pick");
  const [manualPhotos, setManualPhotos] = useState<{ id: number; file: File }[]>([]);
  const idRef = useRef(1);

  // Previsualización del lote (resultado del matcher) y estado de drag del dropzone.
  const [preview, setPreview] = useState<MatchResult<File> | null>(null);
  const [drag, setDrag] = useState(false);

  // Al cambiar de flujo (selector "Lista de destino"), reseteamos el estado de UI
  // para no arrastrar un preview/manual del flujo anterior — evita confirmar un
  // lote matcheado contra el flujo A usando el id del flujo B.
  useEffect(() => {
    setView("idle");
    setPreview(null);
    setManualSku(null);
    setManualStage("pick");
    setManualPhotos([]);
    setDrag(false);
  }, [selectedFlujo?.id, todos]);

  // ── Derivados de los SKUs del hook ────────────────────────────────────────
  const skuByCode = useMemo(() => {
    const map: Record<string, CargaSku> = {};
    for (let i = 0; i < carga.skus.length; i++) map[carga.skus[i].code] = carga.skus[i];
    return map;
  }, [carga.skus]);

  // Cuántos archivos asocia el lote a cada SKU (para el tag "+N" del rail).
  const batchByCode = useMemo(() => {
    const map: Record<string, number> = {};
    if (preview) {
      for (let i = 0; i < preview.matched.length; i++) {
        map[preview.matched[i].sku] = preview.matched[i].items.length;
      }
    }
    return map;
  }, [preview]);

  // Total de fotos asociadas y SKUs del lote.
  const fotosAsociadas = useMemo(
    () => (preview ? preview.matched.reduce((acc, g) => acc + g.items.length, 0) : 0),
    [preview],
  );
  const skusEnLote = preview ? preview.matched.length : 0;
  const sinAsociar = preview ? preview.unmatched.length : 0;

  // Rail filtrado (búsqueda + filtro).
  const rail = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\s/g, "");
    return carga.skus.filter((s) => {
      if (filter === "sin" && s.fotos > 0) return false;
      if (filter === "con" && s.fotos === 0) return false;
      if (q) {
        const byName = s.name.toLowerCase().indexOf(q) !== -1;
        const byCode = s.code.toLowerCase().indexOf(qDigits) !== -1;
        if (!byName && !byCode) return false;
      }
      return true;
    });
  }, [carga.skus, filter, query]);

  const manualCarga = manualSku != null ? skuByCode[manualSku] : null;

  // ── Acciones: dropzone masivo ─────────────────────────────────────────────
  const onPickFiles = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;
    const arr = Array.prototype.slice.call(files) as File[];
    const codes = carga.skus.map((s) => s.code);
    setPreview(matchFilesToSkus(arr, codes));
    setView("preview");
  };

  const confirmBulk = async () => {
    if (!preview) return;
    setView("uploading");
    await carga.runBulkUpload(preview.matched);
    setView("result");
  };

  // ── Acciones: manual ──────────────────────────────────────────────────────
  const openManual = (code: string) => {
    setManualSku(code);
    setManualPhotos([]);
    setManualStage("pick");
  };
  const closeManual = () => {
    setManualSku(null);
    setManualPhotos([]);
    setManualStage("pick");
  };
  const addManual = (files: File[]) => {
    setManualPhotos((prev) => prev.concat(files.map((f) => ({ id: idRef.current++, file: f }))));
  };
  const removeManual = (id: number) => {
    setManualPhotos((prev) => prev.filter((p) => p.id !== id));
  };
  const coverManual = (id: number) => {
    setManualPhotos((prev) => {
      const found = prev.filter((p) => p.id === id);
      const rest = prev.filter((p) => p.id !== id);
      return found.concat(rest);
    });
  };
  const confirmManual = async () => {
    if (manualSku == null) return;
    setManualStage("uploading");
    await carga.runManualUpload(manualSku, manualPhotos.map((p) => p.file));
    setManualStage("result");
  };
  const resetManual = () => {
    setManualPhotos([]);
    setManualStage("pick");
  };

  // ── Cabecera ──────────────────────────────────────────────────────────────
  const header = (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-800 mb-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Volver
      </button>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-bold text-white bg-blue-600 rounded px-1 py-0.5 leading-none">ML</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
          Catalog Hub · Carga masiva
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <h1 className="text-[22px] font-bold text-gray-900 leading-tight">Carga masiva de imágenes</h1>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">Lista de destino</span>
          <GridDropdown
            width={260}
            align="right"
            trigger={(_open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white text-[12.5px] text-gray-800 hover:bg-gray-50"
              >
                <span className="font-medium truncate max-w-[220px]">
                  {todos ? "Todos los flujos" : selectedFlujo?.nombre ?? "Selecciona un flujo"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              </button>
            )}
          >
            {(close) => (
              <div className="max-h-72 overflow-y-auto">
                {/* Opción de unión: trabaja sobre los SKUs de todos los flujos. */}
                <button
                  type="button"
                  onClick={() => {
                    setTodos(true);
                    close();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-gray-50 border-b border-gray-100"
                >
                  <span className={["w-3.5", todos ? "text-blue-600" : "text-transparent"].join(" ")}>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className={todos ? "text-gray-900 font-medium" : "text-gray-700"}>
                    Todos los flujos
                  </span>
                </button>
                {flujos.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setTodos(false);
                      onSelectFlujo(f);
                      close();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-gray-50"
                  >
                    <span className={["w-3.5", !todos && f.id === selectedFlujo?.id ? "text-blue-600" : "text-transparent"].join(" ")}>
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className={!todos && f.id === selectedFlujo?.id ? "text-gray-900 font-medium" : "text-gray-700"}>
                      {f.nombre}
                    </span>
                  </button>
                ))}
                {flujos.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-gray-400">No hay listas disponibles.</div>
                )}
              </div>
            )}
          </GridDropdown>
        </div>
      </div>
    </div>
  );

  // ── Franja de cobertura ───────────────────────────────────────────────────
  const cobertura = (
    <div
      className="px-4 py-3 border-b border-gray-200 flex items-center gap-5"
      style={{ background: LILA }}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-[18px] font-bold text-gray-900 tabular-nums leading-none">
          {carga.skus.length}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-gray-500">SKUs en la lista</span>
      </div>
      <span className="text-gray-300">|</span>
      <div className="flex items-center gap-3 text-[12.5px] tabular-nums">
        <span className="text-emerald-700">
          <b className="font-semibold">{carga.conFotos}</b> con fotos
        </span>
        <span className="text-gray-500">
          <b className="font-semibold">{carga.sinFotos}</b> sin fotos
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2.5 w-56">
        <div className="flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${carga.cobertura}%` }}
          />
        </div>
        <span className="text-[11.5px] text-gray-600 tabular-nums w-9 text-right">{carga.cobertura}%</span>
      </div>
    </div>
  );

  // ── Rail izquierdo ────────────────────────────────────────────────────────
  const aside = (
    <aside className="w-80 shrink-0 border-r border-gray-200 flex flex-col min-h-0">
      <div className="px-3 pt-3 pb-2 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-gray-300 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar SKU o producto…"
            className="w-full bg-transparent text-[12px] text-gray-800 placeholder:text-gray-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <GridDropdown
            width={170}
            trigger={(_open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              >
                <span className="text-gray-400">Mostrar:</span>{" "}
                <span className="font-medium">{FILTER_LABELS[filter]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              </button>
            )}
          >
            {(close) => (
              <div>
                {([
                  ["todos", "Todos", carga.skus.length],
                  ["sin", "Sin fotos", carga.sinFotos],
                  ["con", "Con fotos", carga.conFotos],
                ] as [Filter, string, number][]).map(([k, label, n]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setFilter(k);
                      close();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-gray-50"
                  >
                    <span className={["w-3", filter === k ? "text-blue-600" : "text-transparent"].join(" ")}>
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span className={filter === k ? "text-gray-900 font-medium" : "text-gray-700"}>{label}</span>
                    <span className="ml-auto text-[11px] text-gray-400 tabular-nums">{n}</span>
                  </button>
                ))}
              </div>
            )}
          </GridDropdown>
          <span className="text-[11px] text-gray-400 tabular-nums">{rail.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {rail.map((s) => (
          <SkuRow
            key={s.code}
            code={s.code}
            name={s.name}
            fotos={s.fotos}
            active={manualSku === s.code}
            batchTag={view === "preview" ? batchByCode[s.code] ?? null : null}
            onClick={() => openManual(s.code)}
          />
        ))}
        {rail.length === 0 && (
          <div className="px-3 py-10 text-center text-[12px] text-gray-400">Sin resultados.</div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-gray-100 text-[11px] text-gray-400 leading-snug">
        Haz clic en un SKU para subirle fotos de forma manual.
      </div>
    </aside>
  );

  // ── Zona principal ────────────────────────────────────────────────────────
  let main: React.ReactNode;
  if (manualCarga) {
    main = (
      <ManualZone
        sku={manualCarga}
        photos={manualPhotos}
        stage={manualStage}
        progress={carga.progress}
        onBack={closeManual}
        onAdd={addManual}
        onRemove={removeManual}
        onCover={coverManual}
        onReset={resetManual}
      />
    );
  } else if (view === "idle") {
    main = (
      <div className="flex-1 overflow-y-auto p-6">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onPickFiles(e.dataTransfer?.files);
          }}
          className={[
            "cursor-pointer rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center h-full min-h-[360px]",
            drag ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50/60",
          ].join(" ")}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onPickFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: LILA }}
          >
            <ImageUp size={26} className="text-blue-600" aria-hidden />
          </div>
          <p className="text-[15px] font-medium text-gray-800">
            Arrastra las fotos aquí o haz clic para elegir
          </p>
          <p className="text-[12.5px] text-gray-500 mt-1.5 max-w-md leading-snug">
            El nombre debe empezar con el SKU y terminar en el número de orden; la imagen{" "}
            <span className="font-medium text-gray-700">#1 es la portada</span>. Se asocian solas a los{" "}
            {carga.skus.length} SKUs de la lista.
          </p>
          <p className="mt-3.5 font-mono text-[12px] text-gray-600 bg-gray-100 border border-gray-200 rounded px-2 py-1">
            052032066_1.jpg
          </p>
          <p className="mt-4 text-[11.5px] text-gray-400 flex items-center gap-1.5">
            <FolderUp size={13} aria-hidden /> También puedes soltar una carpeta completa.
          </p>
        </label>
      </div>
    );
  } else if (view === "result") {
    main = (
      <ResultZone
        skusActualizados={preview ? preview.matched.length : 0}
        fotos={fotosAsociadas}
        conFotos={carga.conFotos}
        total={carga.skus.length}
        onReset={() => {
          setView("idle");
          setPreview(null);
        }}
      />
    );
  } else {
    // preview / uploading
    main = (
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={15} className="text-emerald-600" aria-hidden />
          <h3 className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">Asociadas</h3>
          <span className="text-[12px] text-gray-400 tabular-nums">
            ({fotosAsociadas} {fotosAsociadas === 1 ? "foto" : "fotos"} · {skusEnLote}{" "}
            {skusEnLote === 1 ? "SKU" : "SKUs"})
          </span>
        </div>
        {preview &&
          preview.matched.map((group) => {
            const s = skuByCode[group.sku];
            const prev = s ? s.fotos : 0;
            return (
              <SkuGroup
                key={group.sku}
                code={group.sku}
                name={s ? s.name : ""}
                files={group.items.length}
                replaces={prev > 0}
                replacesCount={prev}
              />
            );
          })}
        {preview && (
          <UnmatchedSection
            items={preview.unmatched.map((u) => ({ name: u.file.name, reason: u.reason }))}
          />
        )}
        <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-gray-500">
          <Info size={13} className="text-gray-400 shrink-0" aria-hidden /> Si un SKU ya tiene imágenes,
          se reemplazan.
        </div>
      </div>
    );
  }

  // ── Barra de acción (pie, contextual) ─────────────────────────────────────
  let actionBar: React.ReactNode;
  if (manualCarga) {
    if (manualStage === "result") {
      actionBar = (
        <span className="text-[12.5px] text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 size={15} aria-hidden /> Fotos cargadas a {manualCarga.code}.
        </span>
      );
    } else {
      actionBar = (
        <>
          <span className="text-[12px] text-gray-500 hidden sm:flex items-center gap-1.5 font-mono tabular-nums">
            {manualCarga.code}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={closeManual}
              className="h-9 px-3 rounded-md text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirmManual()}
              disabled={manualPhotos.length === 0 || manualStage === "uploading"}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium shadow-sm tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ImageUp size={14} aria-hidden /> Cargar {manualPhotos.length}{" "}
              {manualPhotos.length === 1 ? "foto" : "fotos"} a este SKU
            </button>
          </div>
        </>
      );
    }
  } else if (view === "idle") {
    actionBar = (
      <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
        <Info size={13} className="text-gray-400" aria-hidden /> Las fotos se asocian por el nombre del
        archivo a los SKUs de{" "}
        <b className="font-medium text-gray-700">{todos ? "todos los flujos" : selectedFlujo?.nombre ?? "un flujo"}</b>.
      </span>
    );
  } else if (view === "result") {
    actionBar = (
      <>
        <span className="text-[12.5px] text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 size={15} aria-hidden /> Carga finalizada.
        </span>
        <button
          type="button"
          onClick={() => {
            setView("idle");
            setPreview(null);
          }}
          className="ml-auto h-9 px-4 inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium shadow-sm"
        >
          <ImageUp size={14} aria-hidden /> Cargar otro lote
        </button>
      </>
    );
  } else {
    // preview / uploading
    const uploading = view === "uploading";
    actionBar = (
      <>
        <div className="flex items-baseline gap-3 text-[12.5px] tabular-nums">
          <span className="text-gray-700">
            <b className="font-semibold text-gray-900">{fotosAsociadas}</b> fotos
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-700">
            <b className="font-semibold text-gray-900">{skusEnLote}</b> SKUs
          </span>
          {sinAsociar > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-amber-600">
                <b className="font-semibold">{sinAsociar}</b> sin asociar
              </span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setView("idle");
              setPreview(null);
            }}
            disabled={uploading}
            className="h-9 px-3 rounded-md text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={() => void confirmBulk()}
            disabled={uploading || fotosAsociadas === 0}
            className="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium shadow-sm tabular-nums disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ImageUp size={14} aria-hidden /> Cargar {fotosAsociadas} fotos a {skusEnLote} SKUs
          </button>
        </div>
      </>
    );
  }

  // ── Estados de carga / error del hook ─────────────────────────────────────
  if (carga.loading) {
    return (
      <div className="min-h-full px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        {header}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center" style={{ height: "76vh", minHeight: 560 }}>
          <div className="flex items-center gap-3 text-gray-400 text-[13px]">
            <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
            Cargando lista…
          </div>
        </div>
      </div>
    );
  }

  if (carga.error) {
    return (
      <div className="min-h-full px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        {header}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6" style={{ minHeight: 240 }}>
          <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] text-rose-700">
            <div className="mb-2">
              <strong>Error:</strong> {carga.error}
            </div>
            <button
              type="button"
              onClick={() => void carga.reload()}
              className="h-8 px-3 rounded-md border border-rose-300 bg-white text-[12.5px] font-medium text-rose-700 hover:bg-rose-50"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Layout principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-full px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
      {header}

      <div
        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col"
        style={{ height: "76vh", minHeight: 560 }}
      >
        {cobertura}

        <div className="flex flex-1 min-h-0">
          {aside}

          <main className="flex-1 min-w-0 flex flex-col min-h-0 relative">
            {main}

            {/* Overlay de subida del flujo MASIVO (el manual lo renderiza ManualZone). */}
            {!manualCarga && view === "uploading" && (
              <UploadOverlay
                current={carga.progress.current}
                total={carga.progress.total}
                onCancel={() => setView("preview")}
              />
            )}
          </main>
        </div>

        <div className="border-t border-gray-200 bg-gray-50/70 px-4 py-3 flex items-center gap-3 min-h-[56px]">
          {actionBar}
        </div>
      </div>
    </div>
  );
}
