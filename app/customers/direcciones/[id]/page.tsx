import { ResumenView } from "@/features/customers/pages/CustomersAddress/Resumen/CustomerAddressResumenView";

export default function ResumenPage() {
  return <ResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
