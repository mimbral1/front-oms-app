// app/catalogo/plataforma-ecommerce/mercadolibre/carga-masiva/[batchId]/page.tsx
//
// Detalle de un lote: productos (estado/asignación/publicación) + actividad.
// `batchId` se lee del path con useParams (client) para evitar el manejo de
// params async de Next 15 en server components.

"use client";

import { useParams } from "next/navigation";
import { MeliBatchDetailView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/carga-masiva";

const ACCOUNT_ID_ML = 1;

export default function MeliBatchDetailPage() {
    const params = useParams();
    const batchId = String(params?.batchId ?? "");
    return <MeliBatchDetailView accountId={ACCOUNT_ID_ML} batchId={batchId} />;
}
