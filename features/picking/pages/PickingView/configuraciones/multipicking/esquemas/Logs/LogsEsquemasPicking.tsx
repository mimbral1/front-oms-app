// views\PickingView\configuraciones\multipicking\esquemas\Logs\LogsEsquemasPicking.tsx
"use client";

import { useParams } from "next/navigation";
import { useApiEsquemasPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/esquemas-picking/api-esquemas-picking";
import LogsBase from "@/components/presets/logs/LogsBase";

/* ──────────────────────────────
   Vista
────────────────────────────── */
export default function LogsEsquemasPicking() {
    const params = useParams();
    const schemaId = String(params?.id ?? "");

    const { getPickingSchemaLogs } = useApiEsquemasPicking();

    /* ──────────────────────────────
       Render
    ────────────────────────────── */
    return (
        <LogsBase
            entityId={schemaId}
            loadLogs={() => getPickingSchemaLogs(schemaId)}
            emptyText="No hay logs registrados para este esquema de picking."
            errorText="No se pudieron cargar los logs del esquema de picking."
        />
    );
}