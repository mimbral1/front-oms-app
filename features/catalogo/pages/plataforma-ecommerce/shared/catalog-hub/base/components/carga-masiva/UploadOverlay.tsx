// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/carga-masiva/UploadOverlay.tsx
//
// Overlay de subida en curso (Unit 3). Port 1:1 del `UploadOverlay` del prototipo
// (carga-masiva-de-imagnes/project/carga.jsx ~490-504) con tipografía OMS. Cubre
// la zona principal con un spinner + "Subiendo current/total…" + barra + cancelar.
// El progreso lo provee el hook (U2); este componente solo lo dibuja.
"use client";

import { Loader2 } from "lucide-react";

export interface UploadOverlayProps {
  current: number;
  total: number;
  onCancel: () => void;
}

export function UploadOverlay({ current, total, onCancel }: UploadOverlayProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
      <div className="w-[min(420px,86%)] rounded-lg border border-gray-200 bg-white shadow-lg p-6 text-center">
        <Loader2 size={26} className="text-blue-600 mx-auto animate-spin" aria-hidden />
        <p className="mt-3 text-[14px] font-medium text-gray-800 tabular-nums">
          Subiendo {current}/{total}…
        </p>
        <p className="text-[12px] text-gray-500 mt-0.5">No cierres esta ventana.</p>
        <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-gray-400 tabular-nums text-right">{pct}%</div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-[12px] text-gray-500 hover:text-rose-600 font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
