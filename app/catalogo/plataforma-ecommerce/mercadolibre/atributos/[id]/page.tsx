// app/catalogo/plataforma-ecommerce/mercadolibre/atributos/[id]/page.tsx
//
// En Next.js 15 (App Router), `params` y `searchParams` son `Promise<>`.
// Tenemos que await-earlos antes de pasarlos al client component.

import { MeliAtributosDetailView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/atributos";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MeliAtributosDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <MeliAtributosDetailView atributoId={id} />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
