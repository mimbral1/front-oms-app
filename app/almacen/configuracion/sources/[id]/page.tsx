import SourcesResumenView from "@/features/almacenes/pages/Configuraciones/Sources/Resumen/SourcesResumen";

export default function SourcesResumenViewPage() {
    return <SourcesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
