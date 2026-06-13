import EsquemaHorarioResumenView from "@/features/picking/pages/PickingView/olas/EsquemaHorario/Resumen/EsquemaHorarioResumen";

export default function EsquemaHorarioResumenViewPage() {
    return <EsquemaHorarioResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
