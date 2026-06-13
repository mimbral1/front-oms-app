import AbmMotivoView from "@/features/cuenta/pages/Abm-motivos/Resumen/AbmResumen";

export default function BasePriceEditPage() {
    return <AbmMotivoView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
