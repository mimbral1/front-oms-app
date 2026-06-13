// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/ManualZone.tsx
//
// Zona de carga MANUAL de un SKU (Unit 3). Port 1:1 del `ManualZone` del prototipo
// (carga-masiva-de-imagnes/project/carga.jsx ~522-592) con tipografía OMS. Banner
// "Carga manual · SKU", fotos actuales (solo lectura), fotos nuevas (reordenables /
// quitables), dropzone (clic o drag → onAdd(Array.from(files))) y la pantalla de
// éxito (stage "result"). El overlay de subida se muestra con stage "uploading".
//
// En modo manual el nombre del archivo NO importa: el orden lo define el usuario
// y la #1 es la portada. La subida/persistencia las hace el hook (U2); aquí solo
// se arma la UI y se delega vía callbacks.
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Plus } from "lucide-react";

import type { CargaSku } from "../../hooks/useCargaMasiva";
import { Thumb } from "./Thumb";
import { UploadOverlay } from "./UploadOverlay";

export interface ManualZoneProps {
  sku: CargaSku;
  /** Fotos nuevas elegidas por el usuario (orden = el del array; #1 = portada). */
  photos: { id: number; file: File }[];
  stage: "pick" | "uploading" | "result";
  progress: { current: number; total: number };
  onBack: () => void;
  onAdd: (files: File[]) => void;
  onRemove: (id: number) => void;
  onCover: (id: number) => void;
  onReset: () => void;
}

export function ManualZone({
  sku,
  photos,
  stage,
  progress,
  onBack,
  onAdd,
  onRemove,
  onCover,
  onReset,
}: ManualZoneProps) {
  const [drag, setDrag] = useState(false);

  // Previews de las fotos NUEVAS: object URLs derivadas de los File. Se regeneran
  // al cambiar la lista y se revocan en el cleanup para no filtrar memoria.
  const newUrls = useMemo(() => photos.map((p) => URL.createObjectURL(p.file)), [photos]);
  useEffect(
    () => () => {
      newUrls.forEach((u) => URL.revokeObjectURL(u));
    },
    [newUrls],
  );

  // Extrae los File de un evento de drop / input y los pasa a onAdd.
  const emit = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;
    onAdd(Array.prototype.slice.call(files) as File[]);
  };

  if (stage === "result") {
    return (
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-600" aria-hidden />
        </div>
        <h3 className="mt-3 text-[16px] font-semibold text-gray-900">Fotos cargadas</h3>
        <p className="mt-1 text-[12.5px] text-gray-600 tabular-nums">
          El SKU <span className="font-mono">{sku.code}</span> quedó con{" "}
          <b className="font-semibold text-emerald-700">{sku.fotos}</b> {sku.fotos === 1 ? "foto" : "fotos"}.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="h-9 px-3 rounded-md text-[13px] font-medium text-gray-700 hover:bg-gray-100"
          >
            Subir más a este SKU
          </button>
          <button
            type="button"
            onClick={onBack}
            className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium shadow-sm"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  // URL de preview de una imagen ya cargada (Cloudinary / CDN del backend).
  const srcOf = (img: { secureUrl?: string; url?: string; dataUrl?: string }): string | undefined =>
    img.secureUrl ?? img.url ?? img.dataUrl;

  return (
    <div className="flex-1 overflow-y-auto p-5 relative">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-gray-500 hover:text-gray-800 mb-3"
      >
        <ArrowLeft size={14} aria-hidden /> Volver a carga masiva
      </button>

      <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2.5 mb-4 flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-blue-700 font-semibold">Carga manual</span>
        <span className="text-gray-300">·</span>
        <span className="font-mono text-[13px] font-semibold text-gray-900 tabular-nums">{sku.code}</span>
        <span className="text-[12px] text-gray-600 truncate">{sku.name}</span>
        <span className="ml-auto text-[11px] text-gray-500 tabular-nums shrink-0">
          ya tiene {sku.fotos} {sku.fotos === 1 ? "foto" : "fotos"}
        </span>
      </div>

      {sku.fotos > 0 ? (
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[12px] font-semibold text-gray-700">Fotos actuales</span>
            <span className="text-[11px] text-gray-500 tabular-nums">
              {sku.fotos} {sku.fotos === 1 ? "foto" : "fotos"} · la #1 es la portada
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sku.images.map((img, i) => (
              <Thumb key={i} order={i + 1} portada={i === 0} size={64} src={srcOf(img)} />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400 leading-snug">
            Las fotos nuevas se agregan al final de estas. Para reemplazarlas, vuelve a cargar el lote
            completo del SKU.
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-md border border-dashed border-gray-200 bg-gray-50/60 px-3 py-2.5 text-[12px] text-gray-500 flex items-center gap-2">
          <ImageIcon size={14} className="text-gray-400" aria-hidden /> Este SKU aún no tiene fotos.
        </div>
      )}

      {photos.length > 0 && (
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-[12px] font-semibold text-gray-700">Fotos nuevas</span>
            <span className="text-[11px] text-gray-500 tabular-nums">
              {photos.length} {photos.length === 1 ? "foto" : "fotos"} · la #1 es la portada
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <Thumb
                key={p.id}
                order={i + 1}
                portada={i === 0}
                size={64}
                src={newUrls[i]}
                onRemove={() => onRemove(p.id)}
                onCover={() => onCover(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          emit(e.dataTransfer?.files);
        }}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center px-6 py-8",
          drag ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-300 hover:bg-gray-50",
        ].join(" ")}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            emit(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-2 text-gray-700">
          <Plus size={16} className="text-blue-600" aria-hidden />
          <span className="text-[13px] font-medium">
            {photos.length > 0 ? "Agregar más fotos" : "Arrastra las fotos aquí o haz clic para elegir"}
          </span>
        </div>
        <p className="text-[11.5px] text-gray-500 mt-1.5 max-w-sm leading-snug">
          En modo manual el nombre del archivo no importa: el orden lo defines tú arrastrando, y la
          primera es la portada.
        </p>
      </label>

      {stage === "uploading" && (
        <UploadOverlay current={progress.current} total={progress.total} onCancel={onReset} />
      )}
    </div>
  );
}
