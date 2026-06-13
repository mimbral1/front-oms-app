// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/SkuRow.tsx
//
// Fila del rail izquierdo de la carga masiva (Unit 3). Port 1:1 del `SkuRow` del
// prototipo (carga-masiva-de-imagnes/project/carga.jsx ~183-199) con tipografía
// OMS. Punto de estado (verde si tiene fotos), código mono + nombre, conteo con
// ícono y, en preview, un tag azul "+N" con los archivos que le llegarían.
"use client";

import { Image as ImageIcon } from "lucide-react";

export interface SkuRowProps {
  code: string;
  name: string;
  fotos: number;
  /** SKU actualmente abierto en modo manual. */
  active?: boolean;
  /** Archivos que el lote actual asocia a este SKU (preview). null = sin tag. */
  batchTag?: number | null;
  onClick: () => void;
}

export function SkuRow({ code, name, fotos, active, batchTag, onClick }: SkuRowProps) {
  const has = fotos > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-2 text-left border-l-2 transition-colors",
        active ? "border-blue-600 bg-blue-50/70" : "border-transparent hover:bg-gray-50",
      ].join(" ")}
    >
      <span
        className={["w-1.5 h-1.5 rounded-full shrink-0", has ? "bg-emerald-500" : "bg-gray-300"].join(" ")}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="font-mono text-[12px] text-gray-800 tabular-nums leading-tight">{code}</div>
        <div className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">{name}</div>
      </div>
      <span className="ml-auto shrink-0 flex items-center gap-1 text-[11px] tabular-nums">
        {batchTag ? <span className="text-blue-600 font-semibold mr-0.5">+{batchTag}</span> : null}
        <span className={has ? "text-gray-600 font-medium" : "text-gray-300"}>{fotos}</span>
        <ImageIcon size={12} className={has ? "text-gray-400" : "text-gray-300"} aria-hidden />
      </span>
    </button>
  );
}
