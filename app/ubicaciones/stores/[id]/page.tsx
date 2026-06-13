import StoreResumenView from "@/features/ubicaciones/pages/Stores/Resumen/StoresResumen";

export default function StoreResumenViewPage() {
    return <StoreResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
