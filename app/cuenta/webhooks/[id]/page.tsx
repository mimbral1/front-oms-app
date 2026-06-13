import WebhookResumenPage from "@/features/cuenta/pages/Webhooks/Resumen/WebhookResumen";

export default function WebhookResumenViewPage() {
    return <WebhookResumenPage />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
