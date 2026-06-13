// app/catalogo/plataforma-ecommerce/mercadolibre/editor/[sku]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { MeliEditorView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/editor";

export default function MeliEditorPage() {
    const params = useParams();
    const sku = String(params?.sku ?? "");
    return <MeliEditorView sku={sku} />;
}
