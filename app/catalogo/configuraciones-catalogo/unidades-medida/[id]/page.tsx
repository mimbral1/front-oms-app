import { UnidadesMedidaEditView } from "@/features/catalogo/pages/configuraciones-catalogo/unidades-medida/Resumen/UnidadesMedidaResumenView";

export default function UnidadesMedidaEditPage() {
    return <UnidadesMedidaEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
