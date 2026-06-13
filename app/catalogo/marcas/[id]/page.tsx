import { BrandResumenPage } from "@/features/catalogo/pages/marcas/Resumen/MarcasResumen";

export default function ResumenBrandPage() {
  return <BrandResumenPage />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
