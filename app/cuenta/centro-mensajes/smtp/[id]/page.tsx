import SmtpResumenView from "@/features/cuenta/pages/CentroMensajes/SmtpConfig/Resumen/SmtpResumen";

export default function SmtpResumenPage() {
    return <SmtpResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
