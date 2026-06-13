import ImportarLogsResumenView from "@/features/cuenta/pages/Trace/ImportarLogs/Resumen/Resumen";

export default function ImportarLogsResumenViewPage() {
    return <ImportarLogsResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
