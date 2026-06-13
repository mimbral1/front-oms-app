import StockDecisionResumen from "@/features/almacenes/pages/Inventario/StockDecision/Resumen/StockDecisionResumen";

export default function StockDecisionResumenPage() {
    return <StockDecisionResumen />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
