import TrackeoPaquetesResumenView from "@/features/picking/pages/Picking/TrackeoPaquetes/Resumen/TrackeoPaquetesResumen";

export default function TrackeoPaquetesResumenViewPage() {
    return <TrackeoPaquetesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
