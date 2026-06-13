import RestriccionesEntregaResumenView from "@/features/delivery/pages/Configuraciones/Restricciones-entrega/Resumen/RestriccionesEntregaResumen";

export default function RestriccionesEntregaResumenPage() {
    return <RestriccionesEntregaResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
