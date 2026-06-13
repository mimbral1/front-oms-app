import SlotsResumenView from "@/features/delivery/pages/Transportistas/Slots/Resumen/SlotsResumen";

export default function SlotsResumenViewPage() {
    return <SlotsResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
