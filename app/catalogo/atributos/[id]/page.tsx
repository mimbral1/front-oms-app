import AtributosResumenView from "@/features/catalogo/pages/atributos/Resumen/AtributosResumenView";

export default function AtributosResumenPage() {
    return <AtributosResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
