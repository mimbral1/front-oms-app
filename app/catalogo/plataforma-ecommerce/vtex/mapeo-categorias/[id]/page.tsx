import React from "react";
import { VtexMapeoCategoriasDetail } from "@/features/catalogo/pages/plataforma-ecommerce/vtex/mapeo-categorias";

export default function Page() {
    return <VtexMapeoCategoriasDetail />;
}

// Static export (App Store): el detalle se renderiza en cliente vía la vista
// hija ("use client"); no se pre-generan páginas por id.
export function generateStaticParams() {
  return [{ id: "_" }];
}
