import { VehiculosEditView } from "@/features/delivery/pages/Vehiculos/Resumen/VehiculosResumen";
export default function VehiculosEditPage() {
    return <VehiculosEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
