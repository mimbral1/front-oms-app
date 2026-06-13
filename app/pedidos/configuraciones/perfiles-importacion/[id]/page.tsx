import PerfilesImportacionResumenView from "@/features/pedidos/pages/Configuraciones/PerfilesImportacion/Resumen/PerfilesImportacionResumenView";

export default function PerfilesImportacionResumenViewPage() {
    return <PerfilesImportacionResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
