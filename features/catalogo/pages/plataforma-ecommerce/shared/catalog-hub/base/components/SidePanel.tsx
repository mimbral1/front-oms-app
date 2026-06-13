// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/SidePanel.tsx
//
// Panel lateral de edición larga (Unit 3) — reemplaza al DescripcionModal. Adopta
// el diseño del prototipo (carga-masiva-de-imagnes/project/grid.jsx, SidePanel
// ~388-453) con TIPOGRAFÍA OMS: overlay + panel derecho de 460px con Título +
// Descripción. Edita las MISMAS keys que el inline de la grilla (titulo /
// descripcion), por lo que ambos editores comparten el mismo valor.
//
// Animación slide-in SIN CSS global: un estado `mounted` activa una transición de
// transform/opacity al primer render (no usa la keyframe `slideIn` del prototipo).
// Escape cierra. Solo presentación: el padre (FlujoGridView) controla el valor.
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface SidePanelProps {
  open: boolean;
  sku: string | null;
  nombre: string;
  titulo: string;
  descripcion: string;
  onChange: (key: "titulo" | "descripcion", value: string) => void;
  onClose: () => void;
}

export function SidePanel({
  open,
  sku,
  nombre,
  titulo,
  descripcion,
  onChange,
  onClose,
}: SidePanelProps) {
  // Escape cierra el panel (listener global mientras está montado).
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  // Slide-in sin CSS global: cada vez que `open` pasa a true arrancamos
  // desplazado/transparente y, en el siguiente frame, animamos a la posición
  // final (el rAF asegura que el navegador pinte el estado inicial antes de la
  // transición). Al cerrar reseteamos para que la próxima apertura vuelva a animar.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open || !sku) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div
        className={[
          "absolute inset-y-0 right-0 w-[460px] max-w-[94vw] bg-white border-l border-gray-200 shadow-2xl flex flex-col",
          "transition-transform duration-150 ease-out",
          shown ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        ].join(" ")}
      >
        {/* Encabezado */}
        <div
          className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-200"
          style={{ background: "#E8EAF7" }}
        >
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold text-gray-900 leading-tight">
              Editar publicación
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span className="font-mono text-[11px] text-gray-500 tabular-nums shrink-0">
                {sku}
              </span>
              <span className="text-[11px] text-gray-500 truncate">· {nombre}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto -mr-1 -mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white/60 shrink-0"
            title="Cerrar"
          >
            <X size={17} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => onChange("titulo", e.target.value)}
              placeholder="Escribe el título de la publicación"
              className="w-full h-9 px-2.5 text-[13px] border border-gray-300 rounded-md text-gray-800 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Descripción
              </label>
              <span className="text-[11px] text-gray-400 tabular-nums">
                {descripcion.length} caracteres
              </span>
            </div>
            <textarea
              value={descripcion}
              onChange={(e) => onChange("descripcion", e.target.value)}
              rows={13}
              placeholder="Describe el producto: material, medidas, color, usos recomendados…"
              className="w-full px-3 py-2.5 text-[13px] leading-relaxed border border-gray-300 rounded-md text-gray-800 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-y"
            />
            <p className="mt-2 text-[11.5px] text-gray-500 leading-snug">
              Una buena descripción mejora el posicionamiento en MercadoLibre. Incluye material,
              medidas, color y usos; evita mayúsculas sostenidas y datos de contacto.
            </p>
          </div>
        </div>

        {/* Pie */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50/60">
          <span className="text-[11.5px] text-gray-400">
            Los cambios se aplican a la grilla. Pulsa Guardar para guardarlos.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium shadow-sm"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
