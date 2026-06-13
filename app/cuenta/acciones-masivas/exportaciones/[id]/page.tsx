import ExportsResumenView from "@/features/cuenta/pages/AccionesMasivas/Exportaciones/Resumen/ExportacionesResumen";

export default function ExportsResumenPage() {
    return <ExportsResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
