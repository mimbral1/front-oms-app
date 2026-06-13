import { MetodoEntregaEditView } from "@/features/delivery/pages/Configuraciones/Metodos-entrega/Resumen/MetodosEntregaResumenView";

export default function MetodoEntregaEditPage() {
    return <MetodoEntregaEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
