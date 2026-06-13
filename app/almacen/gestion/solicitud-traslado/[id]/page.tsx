import TrasladosResumenView from "@/features/almacenes/pages/Gestion/SolicitudTraslado/Resumen/SolicitudTrasladoResumen";

export default function TrasladosResumenPage() {
  return <TrasladosResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
