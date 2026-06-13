// app/catalogo/plataforma-ecommerce/vtex/editor/[sku]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { VtexEditorView } from "@/features/catalogo/pages/plataforma-ecommerce/vtex/editor";

export default function VtexEditorPage() {
    const params = useParams();
    const sku = String(params?.sku ?? "");
    return <VtexEditorView sku={sku} />;
}
