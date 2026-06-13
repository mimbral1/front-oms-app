export type ConciliationStatus =
    | "conciliada"
    | "con_diferencias"
    | "pendiente"
    | "en_revision"
    | "lista_finance"
    | "rechazada";

export type ConciliationRow = {
    id: string;
    weekLabel: string;
    periodStart: string;
    periodEnd: string;
    status: ConciliationStatus;
    omsSales: number;
    mlBilling: number | null;
    difference: number | null;
    omsRecords: number;
    mlRecords: number;
    user: string;
    uploadedAt: string | null;
};

export type DifferenceStatus = "pendiente" | "revisando" | "resuelta" | "justificada";

export type DifferenceType = "monto" | "cantidad" | "comision" | "no_en_ml";

export type WeekDifference = {
    id: string;
    orderMl: string;
    orderOms: string;
    sku: string;
    differenceType: DifferenceType;
    amountValue: number | null;
    amountLabel: string;
    status: DifferenceStatus;
    comments: number;
    files: number;
    detectedAt: string;
    escalatedBy: string;
};

export const STATUS_META: Record<
    ConciliationStatus,
    { label: string; classes: string }
> = {
    conciliada: {
        label: "Conciliada",
        classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    con_diferencias: {
        label: "Con diferencias",
        classes: "bg-red-50 text-red-700 ring-red-200",
    },
    pendiente: {
        label: "Pendiente",
        classes: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    en_revision: {
        label: "En revision",
        classes: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    lista_finance: {
        label: "Lista para Finance",
        classes: "bg-violet-50 text-violet-700 ring-violet-200",
    },
    rechazada: {
        label: "Rechazada",
        classes: "bg-gray-100 text-gray-700 ring-gray-300",
    },
};

export const STATUS_LEFT_BORDER: Record<ConciliationStatus, string> = {
    conciliada: "#22c55e",
    con_diferencias: "#ef4444",
    pendiente: "#f59e0b",
    en_revision: "#3b82f6",
    lista_finance: "#8b5cf6",
    rechazada: "#9ca3af",
};

export const DIFF_STATUS_META: Record<DifferenceStatus, { label: string; classes: string }> = {
    pendiente: {
        label: "Pendiente",
        classes: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    revisando: {
        label: "Revisando",
        classes: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    resuelta: {
        label: "Resuelta",
        classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    justificada: {
        label: "Justificada",
        classes: "bg-gray-100 text-gray-700 ring-gray-300",
    },
};

export const DIFF_TYPE_LABEL: Record<DifferenceType, string> = {
    monto: "Diferencia de monto",
    cantidad: "Diferencia de cantidad",
    comision: "Diferencia de comision",
    no_en_ml: "No existe en ML",
};

const toMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return `$${value.toLocaleString("es-CL")}`;
};

export const buildWeekDifferences = (week: ConciliationRow): WeekDifference[] => {
    const baseNumericId = Number.parseInt(week.id.replace(/\D/g, ""), 10) || 1;
    const baseAmount = Math.max(week.difference ?? 90000, 60000);
    const omsBase = 1000 + baseNumericId * 4;
    const mlBase = 90000 + baseNumericId * 21;
    const diffBase = baseNumericId * 10;
    const detectedAt = week.uploadedAt ?? `${week.periodEnd}T23:59:59.999Z`;

    return [
        {
            id: `DIF-${String(diffBase + 1).padStart(6, "0")}`,
            orderMl: `ML-${mlBase}`,
            orderOms: `ORD-${omsBase}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}A`,
            differenceType: "monto",
            amountValue: baseAmount,
            amountLabel: toMoney(baseAmount),
            status: "pendiente",
            comments: 2,
            files: 1,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 2).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 1}`,
            orderOms: `ORD-${omsBase + 1}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}B`,
            differenceType: "no_en_ml",
            amountValue: null,
            amountLabel: "-",
            status: "pendiente",
            comments: 0,
            files: 0,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 3).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 2}`,
            orderOms: `ORD-${omsBase + 2}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}C`,
            differenceType: "cantidad",
            amountValue: 1,
            amountLabel: "1 unidad",
            status: "revisando",
            comments: 1,
            files: 0,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 4).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 3}`,
            orderOms: `ORD-${omsBase + 3}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}D`,
            differenceType: "comision",
            amountValue: Math.round(baseAmount * 0.42),
            amountLabel: toMoney(Math.round(baseAmount * 0.42)),
            status: "justificada",
            comments: 0,
            files: 1,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 5).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 4}`,
            orderOms: `ORD-${omsBase + 4}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}E`,
            differenceType: "monto",
            amountValue: Math.round(baseAmount * 0.25),
            amountLabel: toMoney(Math.round(baseAmount * 0.25)),
            status: "revisando",
            comments: 3,
            files: 1,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 6).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 5}`,
            orderOms: `ORD-${omsBase + 5}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}F`,
            differenceType: "cantidad",
            amountValue: 2,
            amountLabel: "2 unidades",
            status: "pendiente",
            comments: 1,
            files: 0,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 7).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 6}`,
            orderOms: `ORD-${omsBase + 6}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}G`,
            differenceType: "no_en_ml",
            amountValue: null,
            amountLabel: "-",
            status: "resuelta",
            comments: 2,
            files: 2,
            detectedAt,
            escalatedBy: week.user,
        },
        {
            id: `DIF-${String(diffBase + 8).padStart(6, "0")}`,
            orderMl: `ML-${mlBase + 7}`,
            orderOms: `ORD-${omsBase + 7}`,
            sku: `SKU-${String(baseNumericId).padStart(3, "0")}H`,
            differenceType: "comision",
            amountValue: Math.round(baseAmount * 0.18),
            amountLabel: toMoney(Math.round(baseAmount * 0.18)),
            status: "justificada",
            comments: 0,
            files: 1,
            detectedAt,
            escalatedBy: week.user,
        },
    ];
};
