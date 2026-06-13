import PickerResumenView from "@/features/picking/pages/PickingView/configuraciones/Resumen/PickerResumenView";

export default function PickerResumenViewPage() {
  return <PickerResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
