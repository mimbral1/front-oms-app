import MotivosResumenView from "@/features/customers/pages/Csx/Motivos/Resumen/MotivosResumen";

export default function MotivosResumenViewPage() {
  return <MotivosResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
