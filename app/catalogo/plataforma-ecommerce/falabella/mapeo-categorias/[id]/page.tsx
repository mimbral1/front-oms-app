import React from "react";
import { FalabellaMapeoCategoriasDetail } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/mapeo-categorias";

export default function Page() {
    return <FalabellaMapeoCategoriasDetail />;
}

// Static export (App Store): el detalle se renderiza en cliente vía la vista
// hija ("use client"); no se pre-generan páginas por id.
export function generateStaticParams() {
  return [{ id: "_" }];
}
