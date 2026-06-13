import PerfilesFulfillmentResumen from "@/features/pedidos/pages/Configuraciones/PerfilesFulfillment/Resumen/PerfilesFulfillmentResumen";

export default function PerfilesFulfillmentResumenPage() {
    return <PerfilesFulfillmentResumen />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
