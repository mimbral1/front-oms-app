// features/olas/utils/ola-status.ts
// Helpers puros de estado para olas.
// Los estados se definen ACÁ y se registran en el registry.

import type { OlaStatus } from "@/features/olas/types/olas";
import type { StatusVariant } from "@/components/ui/badge/status";
import { registerStatusMap, resolveStatus } from "@/components/ui/badge/status-registry";

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
 * ESTADOS DE OLA
 * ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */

const OLA_STATUSES = {
    "Finalizada": { variant: "success" as const },
    "En curso": { variant: "processing" as const },
    "Pendiente": { variant: "pending" as const },
};

registerStatusMap("ola", OLA_STATUSES);

export const getOlaStatusVariant = (status: OlaStatus): StatusVariant => {
    return resolveStatus(status, "ola").variant as StatusVariant;
};
