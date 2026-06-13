import React from "react";
import { MeliMapeoAtributosDetail } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-atributos/MeliMapeoAtributosDetail";

export default function Page() {
    return <MeliMapeoAtributosDetail />;
}

// Static export (App Store): el detalle se renderiza en cliente vía la vista
// hija ("use client"); no se pre-generan páginas por id.
export function generateStaticParams() {
  return [{ id: "_" }];
}
