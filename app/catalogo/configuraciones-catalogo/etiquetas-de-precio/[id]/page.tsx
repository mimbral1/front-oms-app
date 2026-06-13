import PriceLabelsResumen from "@/features/catalogo/pages/configuraciones-catalogo/etiquetas-de-precio/Resumen/EtiquetasPrecioResumen";

export default function PriceLabelsResumenPage() {
    return <PriceLabelsResumen />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
