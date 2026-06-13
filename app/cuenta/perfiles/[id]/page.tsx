import PerfilesResumenView from "@/features/customers/pages/CustomersAddress/Perfiles/Resumen/PerfilesResumen";

export default function PerfilesCustomerPage() {
    return <PerfilesResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
