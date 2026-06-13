import EsquemaEntregaResumen from "@/features/delivery/pages/Configuraciones/Esquemas-entrega/Resumen/EsquemaEntregaResumen";

export default function EsquemaEntregaResumenPage() {
    return <EsquemaEntregaResumen />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
