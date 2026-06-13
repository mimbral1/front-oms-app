// features/delivery/utils/delivery-status.ts
// Helpers puros de estado para delivery (rutas).
// Los estados se definen ACÁ y se registran en el registry.

import type { RutaEstado } from "@/features/delivery/types/delivery";
import type { StatusVariant } from "@/components/ui/badge/status";
import { registerStatusMap, resolveStatus } from "@/components/ui/badge/status-registry";

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * ESTADOS DE RUTA
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */

const RUTA_STATUSES = {
    "Pendiente": { variant: "pending" as const },
    "En Proceso": { variant: "processing" as const },
    "Finalizada": { variant: "success" as const },
    "Cancelada": { variant: "error" as const },
};

registerStatusMap("ruta", RUTA_STATUSES);

export const getDeliveryStatusVariant = (status: RutaEstado): StatusVariant => {
    return resolveStatus(status, "ruta").variant as StatusVariant;
};
