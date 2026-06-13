import { VtexProductosDetail } from "@/features/catalogo/pages/plataforma-ecommerce/vtex/productos";

export default function VtexProductoDetailPage() {
    return <VtexProductosDetail />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
