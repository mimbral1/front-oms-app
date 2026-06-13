import { BasePriceEditView } from "@/features/catalogo/pages/precios/PrecioBase/Resumen/PrecioBaseResumen";

export default function BasePriceEditPage() {
  return <BasePriceEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ priceList: "_" }];
}
