// app\fetchWithAuth\picking\configuraciones\multipicking\esquemas-picking\api-esquemas-picking.ts

import { useFetchWithAuthQA } from "@/lib/http/client";

export function useApiEsquemasPicking() {
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    /* =======================
       LISTADO / FILTROS
    ======================= */
    const getPickingSchemas = (params?: {
        id?: string;
        name?: string;
        createdBy?: string;
        status?: string;
    }) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas?id=${params?.id ?? ""}&name=${params?.name ?? ""}&createdBy=${params?.createdBy ?? ""}&status=${params?.status ?? ""}`,
            { method: "GET" }
        );

    const getPickingSchemasDetailed = () =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/detailed`,
            { method: "GET" }
        );

    const getPickingSchemaById = (id: string) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/${id}`,
            { method: "GET" }
        );

    /* =======================
       CREAR / ACTUALIZAR
    ======================= */
    const createPickingSchema = (payload: {
        name: string;
        isDefault: boolean;
        pickingZoneIds: string[];
        status: string;
        userCreated: number;
    }) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    const updatePickingSchema = (
        id: string,
        payload: {
            name: string;
            isDefault: boolean;
            status: string;
            pickingZoneIds: string[];
            userModified: number;
        }
    ) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            }
        );

    /* =======================
       SIMPLE (selects)
    ======================= */
    const getPickingSchemasSimple = () =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/simple`,
            { method: "GET" }
        );

    /* =======================
       LOGS / AUDITORÍA
    ======================= */
    const getPickingSchemaLogs = (
        schemaId: string,
        params?: { page?: number; pageSize?: number }
    ) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/${schemaId}/audit?page=${params?.page ?? 1}&pageSize=${params?.pageSize ?? 10}`,
            { method: "GET" }
        );

    /* =======================
       COMENTARIOS
    ======================= */
    const getPickingSchemaComments = (
        schemaId: string,
        params?: { page?: number; pageSize?: number }
    ) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/${schemaId}/comments?page=${params?.page ?? 1}&pageSize=${params?.pageSize ?? 10}`,
            { method: "GET" }
        );

    const createPickingSchemaComment = (
        schemaId: string,
        payload: {
            comment: string;
            createdBy: number;
        }
    ) =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/${schemaId}/comments`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    return {
        /* listado */
        getPickingSchemas,
        getPickingSchemasDetailed,
        getPickingSchemaById,

        /* crear / actualizar */
        createPickingSchema,
        updatePickingSchema,

        /* selects */
        getPickingSchemasSimple,

        /* logs */
        getPickingSchemaLogs,

        /* comentarios */
        getPickingSchemaComments,
        createPickingSchemaComment,
    };
}

export function useApiZonasPicking() {
    const { fetchWithAuthQA } = useFetchWithAuthQA();


    const getZones = (params?: {
        id?: string;
        name?: string;
        createdBy?: string;
    }) =>
        fetchWithAuthQA(
            `picking-service/zones/simple`,
            { method: "GET" }
        );


    return { getZones };
}