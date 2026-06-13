import ResumenCompetidorMonitorCompetenciaView from "@/features/monitoreo-competencia/pages/Competidor/Resumen/ResumenCompetidorMonitorCompetenciaView";

export default function ResumenCompetidorMonitorCompetenciaViewPage() {
    return <ResumenCompetidorMonitorCompetenciaView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ competidor: "_" }];
}
