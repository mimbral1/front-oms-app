import GrupoAtributosResumenView from "@/features/catalogo/pages/grupo-atributos/Resumen/GrupoAtributosResumenView";

export default function GrupoAtributosResumenPage() {
    return <GrupoAtributosResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
