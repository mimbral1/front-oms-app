// app/catalogo/plataforma-ecommerce/vtex/atributos/[id]/page.tsx

import { VtexAtributosDetailView } from "@/features/catalogo/pages/plataforma-ecommerce/vtex/atributos";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function VtexAtributosDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <VtexAtributosDetailView atributoId={id} />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
