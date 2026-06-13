import GruposAlmacenesResumenView from "@/features/almacenes/pages/Configuraciones/GrupoAlmacen/Resumen/GruposAlmacenesResumen";

export default function GruposAlmacenesResumenPage() {
    return <GruposAlmacenesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
