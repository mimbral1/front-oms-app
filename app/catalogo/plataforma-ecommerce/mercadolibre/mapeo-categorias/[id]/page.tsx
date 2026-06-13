import React from "react";
import { MeliMapeoCategoriasDetail } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-categorias/MeliMapeoCategoriasDetail";

export default function Page() {
    return <MeliMapeoCategoriasDetail />;
}

// Static export (App Store): el detalle se renderiza en cliente vía la vista
// hija ("use client"); no se pre-generan páginas por id.
export function generateStaticParams() {
  return [{ id: "_" }];
}
