import { TypeVehicleEditView } from "@/features/delivery/pages/Flota/Tipo-Vehiculo/Resumen/TipoVehiculoResumen";

export default function TypeVehicleEditPage() {
    return <TypeVehicleEditView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
