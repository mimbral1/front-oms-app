// app\fetchWithAuth\api-waves\api-waves.ts

import { URL_BASE_QA } from "@/lib/http/endpoints";

const BASE_WAVES = `${URL_BASE_QA}/picking-service`;

/* =======================
   TIPOS
======================= */

export interface WaveSettingsResponse {
    ok: boolean;
    data: WaveSettings;
}

export interface WaveSettings {
    id: number;
    updatedAt: string;
    updatedAtCL: string;
    updatedBy: number;

    waves: {
        enabled: boolean;
        modes: {
            auto: boolean;
            manual: boolean;
        };
    };

    generation: {
        evaluationIntervalMinutes: number;
    };

    waveCutoffCriteria: {
        maxOrdersPerWave: number;
        maxItemsPerWave: number;
        maxOpenMinutes: number;
        maxWeightKg: number;
    };

    orderGroupingRules: {
        byZone: boolean;
        byShippingType: boolean;
        byWarehouse: boolean;
        byOrderType: boolean;
        byMarketplace: boolean;
    };

    additionalControls: {
        allowReopenWaves: boolean;
        allowSplitWaves: boolean;
        allowMergeWaves: boolean;
        allowSingleOrderWaves: boolean;
        allowMixedZones: boolean;
        allowPartialStock: boolean;
    };

    autoAssignment: {
        enabled: boolean;
        pickerStrategy: string;
    };

    wavePriority: {
        strategy: string;
    };

    notifications: {
        waveReady: boolean;
        waveStopped: boolean;
        waveFinished: boolean;
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

export async function getWaveSettings(): Promise<WaveSettings> {
    const res = await fetch(`${BASE_WAVES}/waves/settings`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Error ${res.status}: ${text || "No se pudo obtener configuración de olas"}`);
    }

    const json = (await res.json()) as WaveSettingsResponse;
    return json.data;
}

/* =======================
   PATCH
======================= */

export async function updateWaveSettings(payload: Partial<WaveSettings>) {
    const res = await fetch(`${BASE_WAVES}/waves/settings`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Error ${res.status}: ${text || "No se pudo actualizar configuración de olas"}`);
    }

    try {
        return await res.json();
    } catch {
        return {};
    }
}
