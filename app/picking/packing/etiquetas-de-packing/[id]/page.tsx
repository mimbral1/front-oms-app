import TemplateResumenView from "@/features/picking/pages/Picking/Packing/EtiquetadePacking/Resumen/EtiquetaPackingResumen";

export default function PackageTypeResumenPage() {
  return <TemplateResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
