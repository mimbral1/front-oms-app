import TransicionesTicketsResumenView from "@/features/customers/pages/Csx/TransicionesTickets/Resumen/TransicionesTicketsResumen";

export default function TransicionesTicketsResumenViewPage() {
    return <TransicionesTicketsResumenView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
