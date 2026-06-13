import SolicitudesRmsResumenView from "@/features/customers/pages/Logistica/SolicitudesView/Resumen/SolicitudesRmsResumen";

export default function SolicitudesRmsResumenViewPage() {
    return <SolicitudesRmsResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
