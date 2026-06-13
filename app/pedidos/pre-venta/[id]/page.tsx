import { PreVentaResumenView } from "@/features/pedidos/pages/PreVentaView/PreVentaResumenView";

export default async function PedidosPreVentaDetallePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <PreVentaResumenView preOrderID={id} />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
