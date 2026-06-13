// app/catalogo/plataforma-ecommerce/mercadolibre/ofertas/[id]/page.tsx
//
// Detalle de una oferta/campaña. Next.js 15 → params es Promise.

import { MeliOfertasDetailView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/ofertas";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MeliOfertasDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <MeliOfertasDetailView ofertaId={id} />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
