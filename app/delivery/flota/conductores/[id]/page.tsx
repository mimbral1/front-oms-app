import { UserResumenView } from "@/features/delivery/pages/Flota/Conductores/Resumen/ConductoresResumen";

export default function CustomerResumenPage() {
  return <UserResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
