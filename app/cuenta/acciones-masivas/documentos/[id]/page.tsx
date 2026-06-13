import DocumentoResumenView from "@/features/cuenta/pages/AccionesMasivas/Documentos/Resumen/DocumentosResumen";

export default function DocumentoResumenViewPage() {
    return <DocumentoResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
