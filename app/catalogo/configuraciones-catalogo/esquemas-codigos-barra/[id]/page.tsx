import { EsquemaEditView } from "@/features/catalogo/pages/configuraciones-catalogo/esquemas-codigo-barras/Resumen/EsquemaCodigoBarrasResumen";

export default function BaseEsquemaEditPage() {
    return <EsquemaEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
