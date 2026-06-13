import PickupPointResumenView from "@/features/ubicaciones/pages/Locations/PickupPoints/Resumen/PickupPointsResumen";

export default function PackageTypeResumenPage() {
    return <PickupPointResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
