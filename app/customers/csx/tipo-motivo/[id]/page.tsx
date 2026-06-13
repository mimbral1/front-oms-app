import TipoMotivoResumenView from "@/features/customers/pages/Csx/TipoMotivo/Resumen/TipoMotivoResumen";

export default function TipoMotivoResumenViewPage() {
    return <TipoMotivoResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
