import { AuditTypeResumenView } from "@/features/pedidos/pages/Auditorias/tipos/resumen/Resumen";

export default function AuditTypeResumenPage() {
  return <AuditTypeResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
