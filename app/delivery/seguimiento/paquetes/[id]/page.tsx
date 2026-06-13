import PaqueteResumenView from "@/features/delivery/pages/Seguimiento/Paquetes/Resumen/PaquetesResumen";

export default function PaqueteResumenViewPage() {
    return <PaqueteResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
