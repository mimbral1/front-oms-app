// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/UnmatchedSection.tsx
//
// Sección colapsable de archivos SIN asociar en la previsualización (Unit 3).
// Port 1:1 del `UnmatchedSection` del prototipo (carga-masiva-de-imagnes/project/
// carga.jsx ~150-180) con tipografía OMS. Lista cada nombre + su razón. Recibe
// los items por props (el matcher de U1 los provee); arranca colapsada.
"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";

export interface UnmatchedSectionProps {
  items: { name: string; reason: string }[];
}

export function UnmatchedSection({ items }: UnmatchedSectionProps) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="mt-2 border-t border-gray-100 pt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 py-2 text-left"
      >
        <ChevronDown
          size={15}
          className={["text-gray-400 transition-transform", open ? "" : "-rotate-90"].join(" ")}
          aria-hidden
        />
        <AlertTriangle size={14} className="text-amber-500" aria-hidden />
        <span className="text-[12px] font-semibold text-gray-700">Sin asociar</span>
        <span className="text-[12px] text-gray-400 tabular-nums">({items.length})</span>
        <span className="ml-auto text-[11px] text-gray-400">{open ? "ocultar" : "mostrar"}</span>
      </button>
      {open && (
        <div className="pl-7 pb-2">
          <p className="text-[11.5px] text-amber-700 mb-2 leading-snug">
            No empezaron con ningún SKU de la lista. Renómbralos como{" "}
            <span className="font-mono text-amber-800">SKU_orden</span> y vuelve a soltarlos.
          </p>
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {items.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
                <span className="font-mono text-[12px] text-gray-700 truncate">{f.name}</span>
                <span className="ml-auto text-[11px] text-gray-400 shrink-0 hidden sm:block">{f.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
