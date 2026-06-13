// app/catalogo/plataforma-ecommerce/falabella/atributos/[id]/page.tsx

import { FalaAtributosDetailView } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/atributos";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function FalaAtributosDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <FalaAtributosDetailView atributoId={id} />;
}

// Static export (App Store): las rutas dinámicas se renderizan en
// cliente; no se pre-generan páginas por id. Requerido por output: "export".
export function generateStaticParams() {
  return [{ id: "_" }];
}
