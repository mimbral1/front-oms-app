import SellersResumenView from "@/features/cuenta/pages/CuentasComercio/Sellers/Resumen/SellersResumen";

export default function SalesChannelPage() {
    return <SellersResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
