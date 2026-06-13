import React from "react";
import { VtexMapeoAtributosDetail } from "@/features/catalogo/pages/plataforma-ecommerce/vtex/mapeo-atributos";

export default function Page() {
    return <VtexMapeoAtributosDetail />;
}

// Static export (App Store): el detalle se renderiza en cliente vía la vista
// hija ("use client"); no se pre-generan páginas por id.
export function generateStaticParams() {
  return [{ id: "_" }];
}
