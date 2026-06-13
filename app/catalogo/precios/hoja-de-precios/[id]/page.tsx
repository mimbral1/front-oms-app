import { PriceSheetEditView } from "@/features/catalogo/pages/precios/HojaPrecios/Resumen/PriceSheetResumenView";
export default function PriceSheetEditPage() {
  return <PriceSheetEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
