import TemplatesResumenView from "@/features/cuenta/pages/CentroMensajes/TemplatesFolder/Resumen/TemplatesResumen";

export default function BaseTemplatesEditPage() {
    return <TemplatesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
