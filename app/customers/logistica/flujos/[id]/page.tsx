import { FlowResumenView } from "@/features/customers/pages/Logistica/FlujosView/Resumen/FlujosResumen";

export default function FlowResumenPage() {
  return <FlowResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
