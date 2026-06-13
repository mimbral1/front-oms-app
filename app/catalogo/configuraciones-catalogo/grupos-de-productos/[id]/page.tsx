import GruposProductoResumenView from "@/features/catalogo/pages/configuraciones-catalogo/grupos-de-productos/Resumen/GruposProductosResumen";

export default function GruposProductoResumenViewMain() {
    return <GruposProductoResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
