import EstadoTicketsResumenView from "@/features/customers/pages/Csx/EstadoTickets/Resumen/EstadoTicketsResumen";

export default function EstadoTicketsResumenViewPage() {
    return <EstadoTicketsResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
