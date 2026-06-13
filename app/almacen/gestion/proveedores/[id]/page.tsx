import ProveedoresResumenView from "@/features/almacenes/pages/Gestion/Proveedores/Resumen/ProveedoresResumen";

export default function ProveedoresResumenViewPage() {
    return <ProveedoresResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
