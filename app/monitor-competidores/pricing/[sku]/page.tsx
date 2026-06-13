import ResumenPricingMonitorCompetenciaView from "@/features/monitoreo-competencia/pages/Pricing/Resumen/ResumenPricingMonitorCompetenciaView";

export default function ResumenPricingMonitorCompetenciaViewPage() {
    return <ResumenPricingMonitorCompetenciaView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ sku: "_" }];
}
