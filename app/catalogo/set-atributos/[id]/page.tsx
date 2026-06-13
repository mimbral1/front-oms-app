import SetAtributosResumenView from "@/features/catalogo/pages/set-atributos/Resumen/SetAtributosResumenView";

export default function SetAtributosResumenPage() {
    return <SetAtributosResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
