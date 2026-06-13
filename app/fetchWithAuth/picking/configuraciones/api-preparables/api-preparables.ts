// app\fetchWithAuth\picking\configuraciones\api-preparables\api-preparables.ts

import { URL_BASE_QA } from "@/lib/http/endpoints";

const BASE_PREPARABLES = `${URL_BASE_QA}/picking-service`;

/* =======================
   TIPOS
======================= */

export interface PreparableSettingsResponse {
    ok: boolean;
    data: PreparableSettings;
}

export interface PreparableSettings {
    id: number;
    updatedAt: string;
    updatedBy: number;
    updatedAtUtc?: string;
    updatedAtCL: string;

    generalConditions: {
        requirePaymentApproved: boolean;
        allowFraudPending: boolean;
        requireReceiptGenerated: boolean;
        allowBalancePending: boolean;
    };

    preparation: {
        windowHoursBeforeSLA: number;
        allowFutureOrders: {
            enabled: boolean;
            days: number;
        };
        allowExpiredOrders: boolean;
    };

    preparableOrderTypes: string[];
    omsStatusesThatEnablePreparation: string[];

    deliveryRules: {
        homeDelivery: {
            enabled: boolean;
            prepareUntilHoursBeforeCutoff: number;
        };
        pickupPoint: {
            enabled: boolean;
            prepareUntilHoursBeforeCutoff: number;
        };
    };

    exclusionFilters: {
        excludeServiceOrders: boolean;
        excludeDigitalItems: boolean;
        excludeOrdersWithNotes: boolean;
        lowValue: {
            enabled: boolean;
            thresholdAmount: number;
        };
    };

    updatedByUser?: {
        email: string;
        nombres: string;
        apellidos: string;
        urlImagenPerfil?: string;
    };
}

/* =======================
   GET
======================= */

export async function getPreparableSettings(): Promise<PreparableSettings> {
    const res = await fetch(`${BASE_PREPARABLES}/preparable/settings`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo obtener configuración de preparables"}`
        );
    }

    const json = (await res.json()) as PreparableSettingsResponse;
    return json.data;
}

/* =======================
   PATCH
======================= */

export async function updatePreparableSettings(
    payload: Partial<PreparableSettings>
) {
    const res = await fetch(`${BASE_PREPARABLES}/preparable/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Error ${res.status}: ${text || "No se pudo actualizar configuración de preparables"}`
        );
    }

    try {
        return await res.json();
    } catch {
        return {};
    }
}
