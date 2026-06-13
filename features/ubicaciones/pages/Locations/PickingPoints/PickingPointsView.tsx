"use client";

import { useParams } from "next/navigation";
import PickingPointsReusableView from "@/features/ubicaciones/pages/PickingPoints/PickingPointsView";

export function PickingPointsView() {
    const { id } = useParams<{ id: string }>();
    const decodedId = decodeURIComponent(id ?? "");

    return <PickingPointsReusableView locationId={decodedId || undefined} />;
}
