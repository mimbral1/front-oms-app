import GrupoClientesResumenView from "@/features/customers/pages/GrupoClientes/Resumen/GrupoClientesResumenView";

export default function GrupoClientesResumenViewPage() {
  return <GrupoClientesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
