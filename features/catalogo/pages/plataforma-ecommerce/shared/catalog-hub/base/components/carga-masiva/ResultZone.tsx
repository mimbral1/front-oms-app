// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/ResultZone.tsx
//
// Pantalla de éxito tras una carga masiva (Unit 3). Port 1:1 del `ResultZone` del
// prototipo (carga-masiva-de-imagnes/project/carga.jsx ~507-519) con tipografía
// OMS. Resume SKUs actualizados + fotos subidas + cobertura, y recuerda Guardar /
// Sincronizar para publicar. Los conteos vienen calculados por la vista.
"use client";

import { CheckCircle2 } from "lucide-react";

export interface ResultZoneProps {
  /** SKUs que recibieron fotos en este lote. */
  skusActualizados: number;
  /** Fotos subidas en el lote. */
  fotos: number;
  /** SKUs con fotos tras la carga (cobertura). */
  conFotos: number;
  /** Total de SKUs de la lista. */
  total: number;
  onReset: () => void;
}

export function ResultZone({ skusActualizados, fotos, conFotos, total, onReset }: ResultZoneProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
        <CheckCircle2 size={28} className="text-emerald-600" aria-hidden />
      </div>
      <h3 className="mt-3 text-[16px] font-semibold text-gray-900 tabular-nums">
        Listo: {skusActualizados} {skusActualizados === 1 ? "SKU actualizado" : "SKUs actualizados"}
      </h3>
      <p className="mt-1 text-[12.5px] text-gray-600 max-w-md leading-snug tabular-nums">
        {fotos} {fotos === 1 ? "foto subida" : "fotos subidas"}. La lista quedó con{" "}
        <b className="font-semibold text-emerald-700">
          {conFotos} de {total}
        </b>{" "}
        SKUs con imágenes. Recuerda{" "}
        <span className="font-medium text-gray-800">Guardar / Sincronizar</span> para publicarlas.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 h-9 px-4 rounded-md text-[13px] font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
      >
        Cargar otro lote
      </button>
    </div>
  );
}
