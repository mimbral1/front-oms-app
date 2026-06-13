// app\fetchWithAuth\picking\configuraciones\api-pickers\api-pickers.ts

import { useFetchWithAuthQA } from "@/lib/http/client";

type CreatePickerPayload = {
    userId: number;
    createdBy: number;
    status: string;
    userSnapshot: {
        userEmail: string;
        userName: string;
    };
    carrierIds: string[];
    locationIds: string[];
    shippingTypeCodes: string[];
    pickingPointIds: string[];
    enabledPickingZones: string[];
    restrictedPickingZones: string[];
};

type UpdatePickerPayload = {
    changedBy: number;
    status: string;
    carrierChanges: Array<{ carrierId: string; enabled: 0 | 1 }>;
    locationChanges: Array<{ locationId: string; enabled: 0 | 1 }>;
    shippingTypeChanges: Array<{ shippingTypeCode: string; enabled: 0 | 1 }>;
    pickingPointChanges: Array<{ pickingPointId: string; enabled: 0 | 1; isDefault?: 0 | 1 }>;
    zoneChanges: Array<{ zoneId: string; enabled: 0 | 1; restricted: 0 | 1 }>;
};

/* =========================================================================================
   API PICKERS
========================================================================================= */
export function useApiPickers() {
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    /* =======================
       DETALLE
    ======================= */
    const getPickerById = (id: string) =>
        fetchWithAuthQA(
            `picking-service/pickers/${id}`,
            { method: "GET" }
        );

    /* =======================
       CREAR / ACTUALIZAR
    ======================= */
    const createPicker = (payload: CreatePickerPayload) =>
        fetchWithAuthQA(
            `picking-service/pickers`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    const updatePicker = (id: string, payload: UpdatePickerPayload) =>
        fetchWithAuthQA(
            `picking-service/pickers/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            }
        );

    /* =======================
       SELECTS / SIMPLE
    ======================= */
    const getLocationsSimple = () =>
        fetchWithAuthQA(
            `comerce-service/locations/simple`,
            { method: "GET" }
        );

    const getShippingTypesSimple = () =>
        fetchWithAuthQA(
            `picking-service/shipping-types`,
            { method: "GET" }
        );

    const getPickingPointsSimple = () =>
        fetchWithAuthQA(
            `picking-service/points/picking-points/simple`,
            { method: "GET" }
        );

    const getPickingZonesSimple = () =>
        fetchWithAuthQA(
            `picking-service/zones`,
            { method: "GET" }
        );

    const getPickerRoleCandidates = () =>
        fetchWithAuthQA(
            `idservice/usuarios/picker-role-candidates`,
            { method: "GET" }
        );

    return {
        /* detalle */
        getPickerById,

        /* crear / actualizar */
        createPicker,
        updatePicker,

        /* selects */
        getLocationsSimple,
        getShippingTypesSimple,
        getPickingPointsSimple,
        getPickingZonesSimple,
        getPickerRoleCandidates,
    };
}
