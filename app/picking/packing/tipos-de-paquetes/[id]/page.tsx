import { PackageTypeResumenView } from "@/features/picking/pages/Picking/Packing/TiposPaquete/Resumen/TiposPaqueteResumen";

export default function PackageTypeResumenPage() {
  return <PackageTypeResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
