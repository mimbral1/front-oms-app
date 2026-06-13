import EmailPendienteRetiroResumenView from "@/features/cuenta/pages/CentroMensajes/EmailPendientesRetiro/Resumen/EmailPendientesRetiroResumen";

export default function EmailPendienteRetiroResumenViewPage() {
    return <EmailPendienteRetiroResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
