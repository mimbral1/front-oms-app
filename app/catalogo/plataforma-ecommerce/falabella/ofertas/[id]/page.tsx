// app/catalogo/plataforma-ecommerce/falabella/ofertas/[id]/page.tsx
//
// Detalle de una campaña de ofertas Falabella.

import { FalaOfertaDetailView } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/ofertas";

export default function FalaOfertaDetailPage() {
    return <FalaOfertaDetailView />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
