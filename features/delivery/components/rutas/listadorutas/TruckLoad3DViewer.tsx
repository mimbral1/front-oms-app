// features/delivery/components/rutas/listadorutas/TruckLoad3DViewer.tsx
// ============================================================================
// VISOR 3D DE CARGA DEL CAMIÓN (aislado)
//
// Render 3D real con three.js (vía @react-three/fiber + drei). La escena WebGL
// vive en TruckScene y se carga SOLO en cliente con next/dynamic(ssr:false),
// de modo que three.js nunca se ejecuta durante el render del servidor.
//
// Respeta las reglas de negocio visuales (pesados abajo, frágiles arriba,
// color por parada) y expone un contrato de props estable para el resto de la
// vista de Carga.
// ============================================================================

"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { Maximize2, RotateCcw } from "lucide-react";
import type { LoadPlanPackage, LoadPlanStop } from "./loadPlan";

export type LoadViewMode = "packages" | "stops";

export interface TruckLoad3DViewerProps {
  packages: LoadPlanPackage[];
  stops: LoadPlanStop[];
  /** Diferencia los bultos por bulto individual o agrupados por parada. */
  viewMode: LoadViewMode;
  /** Opacidad de las cajas, 0–100. */
  transparency: number;
}

// La escena 3D se importa solo en cliente (WebGL no existe en SSR).
const TruckScene = dynamic(() => import("./TruckScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      Cargando vista 3D…
    </div>
  ),
});

export function TruckLoad3DViewer({
  packages,
  viewMode,
  transparency,
}: TruckLoad3DViewerProps) {
  const controlsRef = useRef<any | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const handleReset = () => controlsRef.current?.reset();
  const handleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  return (
    <div
      ref={wrapperRef}
      className="relative h-full min-h-[380px] w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100"
    >
      {/* Controles visuales */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleReset}
          title="Restablecer vista"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Restablecer vista"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleFullscreen}
          title="Pantalla completa"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Pantalla completa"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Indicador de orientación */}
      <div className="absolute right-3 top-3 z-10 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Frontal · Derecha
      </div>

      {/* Escena 3D (cliente) */}
      <TruckScene
        packages={packages}
        viewMode={viewMode}
        transparency={transparency}
        controlsRef={controlsRef}
      />

      {/* Pie con conteo de bultos */}
      <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-[10px] text-slate-400">
        Carga 3D · {packages.length} bultos · arrastra para rotar
      </div>
    </div>
  );
}

export default TruckLoad3DViewer;
