// app\fetchWithAuth\picking\configuraciones\multipicking\sectores-picking\api-sectores-picking.ts

import { useFetchWithAuthQA } from "@/lib/http/client";
import { URL_BASE_QA } from "@/lib/http/endpoints";

const BASE_URL = `${URL_BASE_QA}/picking-service`;

export function useApiSectoresPicking() {
    const { fetchWithAuthQA } = useFetchWithAuthQA();

    const getZones = (params: {
        id?: string;
        createdBy?: string;
        name?: string;
        schemaId?: string;
    }) =>
        fetchWithAuthQA(
            `picking-service/zones?id=${params.id ?? ""}&createdBy=${params.createdBy ?? ""}&name=${params.name ?? ""}&schemaId=${params.schemaId ?? ""}`,
            { method: "GET" }
        );

    const getZoneById = (id: string) =>
        fetchWithAuthQA(`picking-service/zones/${id}`, { method: "GET" });

    const createZone = (payload: any) =>
        fetchWithAuthQA(`picking-service/zones`, {
            method: "POST",
            body: JSON.stringify(payload),
        });


    const updateZone = (id: string, payload: any) =>
        fetchWithAuthQA(`picking-service/zones/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });

    const getZoneCreators = () =>
        fetchWithAuthQA(
            `picking-service/zones/creators`,
            { method: "GET" }
        );

    const getZoneComments = (
        zoneId: string,
        params?: { page?: number; pageSize?: number }
    ) =>
        fetchWithAuthQA(
            `picking-service/zones/${zoneId}/comments?page=${params?.page ?? 1}&pageSize=${params?.pageSize ?? 10}`,
            { method: "GET" }
        );

    const createZoneComment = (zoneId: string, payload: any) =>
        fetchWithAuthQA(
            `picking-service/zones/${zoneId}/comments`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );

    const getZonePickingSchemas = (zoneId: string) =>
        fetchWithAuthQA(
            `picking-service/zones/${zoneId}/picking-schemas`,
            { method: "GET" }
        );

    const getPickingSchemasSimple = () =>
        fetchWithAuthQA(
            `picking-service/picking-schemas/simple`,
            { method: "GET" }
        );

    return {
        getZones,
        getZoneById,
        createZone,
        updateZone,
        getZoneCreators,
        getZoneComments,
        createZoneComment,
        getZonePickingSchemas,
        getPickingSchemasSimple
    };

}
