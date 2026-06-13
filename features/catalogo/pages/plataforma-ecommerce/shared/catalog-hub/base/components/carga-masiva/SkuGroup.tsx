// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/SkuGroup.tsx
//
// Grupo de un SKU en la previsualización del lote (Unit 3). Port 1:1 del
// `SkuGroup` del prototipo (carga-masiva-de-imagnes/project/carga.jsx ~128-148)
// con tipografía OMS. Encabezado SKU(mono)+nombre + conteo + tag ámbar
// "reemplaza N" cuando el SKU ya tenía fotos, y la fila de miniaturas 1..files
// (la #1 = portada).
"use client";

import { Thumb } from "./Thumb";

export interface SkuGroupProps {
  code: string;
  name: string;
  /** Cantidad de fotos del lote para este SKU. */
  files: number;
  /** Si true, el SKU ya tenía imágenes y se reemplazan. */
  replaces?: boolean;
  /** Cantidad de fotos que tenía antes (para el tag "reemplaza N"). */
  replacesCount?: number;
}

export function SkuGroup({ code, name, files, replaces, replacesCount = 0 }: SkuGroupProps) {
  // es5-safe: construimos el rango 1..files con un array indexado (sin spread).
  const orders: number[] = [];
  for (let i = 1; i <= files; i++) orders.push(i);

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="min-w-0 flex items-baseline gap-2">
          <span className="font-mono text-[13px] font-semibold text-gray-800 tabular-nums shrink-0">{code}</span>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="text-[12px] text-gray-600 truncate">{name}</span>
        </div>
        <span className="text-[11px] text-gray-500 tabular-nums shrink-0 whitespace-nowrap flex items-center gap-2">
          {replaces && <span className="text-amber-600">reemplaza {replacesCount}</span>}
          {files} {files === 1 ? "foto" : "fotos"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {orders.map((o) => (
          <Thumb key={o} order={o} portada={o === 1} />
        ))}
      </div>
    </div>
  );
}
