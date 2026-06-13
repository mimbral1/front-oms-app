import MonitoreoIntegracionesResumen from "@/features/monitoreo/pages/MonitoreoIntegraciones/Resumen/MonitoreoIntegracionesResumen";

export default function MonitoreoIntegracionesResumenPage() {
    return <MonitoreoIntegracionesResumen />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
