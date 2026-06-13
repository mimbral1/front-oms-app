// app/catalogo/plataforma-ecommerce/falabella/editor/[sku]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { FalaEditorView } from "@/features/catalogo/pages/plataforma-ecommerce/falabella/editor";

export default function FalaEditorPage() {
    const params = useParams();
    const sku = String(params?.sku ?? "");
    return <FalaEditorView sku={sku} />;
}
