import ImportacionesResumenView from "@/features/cuenta/pages/AccionesMasivas/Importaciones/Resumen/ImportacionesResumen";

export default function ImportacionesResumenPage() {
    return <ImportacionesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
