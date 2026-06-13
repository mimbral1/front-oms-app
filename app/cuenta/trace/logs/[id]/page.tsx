import LogResumenView from "@/features/cuenta/pages/Trace/Logs/Resumen/Resumen";

export default function LogsResumenPage() {
    return <LogResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
