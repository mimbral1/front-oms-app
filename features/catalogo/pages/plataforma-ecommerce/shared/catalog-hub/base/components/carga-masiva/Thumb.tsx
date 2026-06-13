// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/Thumb.tsx
//
// Miniatura placeholder de la carga masiva de imágenes (Unit 3). Port 1:1 del
// `Thumb` del prototipo (carga-masiva-de-imagnes/project/carga.jsx ~108-126) con
// TIPOGRAFÍA OMS (clases de tamaño del repo, sin la fuente del prototipo).
//
// v1 NO renderiza la imagen real: dibuja un patrón a rayas + ícono + badge de
// orden + etiqueta/botón portada + botón quitar (en hover). Solo presentación.
"use client";

import { Image as ImageIcon, X } from "lucide-react";

export interface ThumbProps {
  /** Número de orden (1 = portada). */
  order: number;
  /** Si true, muestra la etiqueta fija "portada". */
  portada?: boolean;
  /** Lado del cuadrado en px (default 56). */
  size?: number;
  /** URL de la imagen a previsualizar. Si no se pasa, dibuja el placeholder. */
  src?: string;
  /** Si se pasa, muestra el botón "quitar" en hover. */
  onRemove?: () => void;
  /** Si se pasa (y no es portada), muestra "hacer portada" en hover. */
  onCover?: () => void;
}

export function Thumb({ order, portada, size = 56, src, onRemove, onCover }: ThumbProps) {
  return (
    <div
      className="relative rounded-md overflow-hidden border border-gray-200 shrink-0 group/th"
      style={{
        width: size,
        height: size,
        backgroundImage: "repeating-linear-gradient(45deg,#f3f3f6 0 7px,#eaeaf0 7px 14px)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Foto ${order}`} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <ImageIcon size={size > 56 ? 20 : 18} strokeWidth={1.75} aria-hidden />
        </div>
      )}
      <div className="absolute top-1 left-1 h-4 min-w-[16px] px-1 rounded-[3px] bg-black/55 text-white text-[10px] font-semibold leading-4 text-center tabular-nums">
        {order}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Quitar"
          className="absolute top-1 right-1 w-4 h-4 rounded-[3px] bg-black/55 hover:bg-rose-600 text-white items-center justify-center hidden group-hover/th:flex"
        >
          <X size={11} aria-hidden />
        </button>
      )}
      {portada ? (
        <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[9px] leading-[14px] text-center tracking-wide">
          portada
        </div>
      ) : onCover ? (
        <button
          type="button"
          onClick={onCover}
          className="absolute bottom-0 inset-x-0 bg-black/60 hover:bg-blue-600 text-white text-[9px] leading-[14px] text-center hidden group-hover/th:block"
        >
          hacer portada
        </button>
      ) : null}
    </div>
  );
}
