"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SprintFields, type SprintRecord } from "@/features/almacenes/components/gestion/sprints/SprintsFields";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { toast } from "react-hot-toast";

const initialRecord: SprintRecord = {
    destLocation: "",
    destWarehouse: "",
    destWarehouseGroupId: "",
    sourceLocationId: "",
    sourceGroup: "",
    sourceWarehouse: "",
    assigneeId: "",
};

const SPRINT_URL = `${BASE_WAREHOUSES}/sprint`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
    "Content-Type": "application/json",
});

type CreateSprintPayload = {
    assigneeId: string;
    source: {
        locationId: string;
        warehousesIds: string[];
        warehouseGroupsIds: string[];
        warehouseId: string;
        warehouseGroupId: string;
    };
    destination: {
        locationId: string;
        warehousesIds: string[];
        warehouseGroupsIds: string[];
        warehouseId: string;
        warehouseGroupId: string;
    };
};

type WarehouseByGroupApi = {
    id?: string | number;
    warehouseId?: string | number;
    referenceId?: string | number;
    location?: string | number;
    locationId?: string | number;
    group?: string | number;
    groupId?: string | number;
};

const normalizeArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.rows)) return payload.rows as T[];
    if (Array.isArray(payload?.results)) return payload.results as T[];
    return [];
};

const WAREHOUSES_BY_GROUP_URL = (groupId: string) => `${BASE_WAREHOUSES}/warehouse?filters[group]=${encodeURIComponent(groupId)}`;
const WAREHOUSES_BY_REFERENCE_ID_URL = (referenceId: string) => `${BASE_WAREHOUSES}/warehouse?filters[referenceId]=${encodeURIComponent(referenceId)}`;

const getCreatedSprintId = (payload: any): string => {
    const value =
        payload?.id ??
        payload?.ID ??
        payload?.sprintId ??
        payload?.data?.id ??
        payload?.data?.ID ??
        payload?.data?.sprintId;
    return String(value ?? "").trim();
};

export default function SprintNuevoView() {
    const router = useRouter();
    const [record, setRecord] = useState<SprintRecord>({ ...initialRecord });
    const [submitting, setSubmitting] = useState(false);

    const set = (field: keyof SprintRecord, value: any) =>
        setRecord((p) => ({ ...p, [field]: value }));

    const createSprint = async (): Promise<string | null> => {
        const destinationLocationId = String(record.destLocation || "").trim();
        const destinationWarehouseReferenceId = String(record.destWarehouse || "").trim();
        const destinationWarehouseGroupId = String(record.destWarehouseGroupId || "").trim();
        const sourceGroupId = String(record.sourceGroup || "").trim();
        const assigneeId = String(record.assigneeId || "").trim();
        const sourceLocationId = String(record.sourceLocationId || destinationLocationId || "").trim();

        let sourceWarehouseIds: string[] = [];
        let destinationWarehouseIds: string[] = [];
        if (sourceGroupId) {
            try {
                const response = await fetch(WAREHOUSES_BY_GROUP_URL(sourceGroupId), {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const payload = await response.json();
                sourceWarehouseIds = normalizeArray<WarehouseByGroupApi>(payload)
                    .map((warehouse) => String(warehouse?.id ?? warehouse?.warehouseId ?? "").trim())
                    .filter(Boolean);
            } catch (error) {
                console.warn("[SprintNuevo] source warehouses by group failed", {
                    sourceGroupId,
                    error,
                });
            }
        }

        if (destinationWarehouseReferenceId) {
            try {
                const response = await fetch(WAREHOUSES_BY_REFERENCE_ID_URL(destinationWarehouseReferenceId), {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const payload = await response.json();
                const candidates = normalizeArray<WarehouseByGroupApi>(payload);
                const selectedWarehouse =
                    candidates.find((warehouse) => {
                        const referenceId = String(warehouse?.referenceId ?? "").trim();
                        const locationId = String(warehouse?.location ?? warehouse?.locationId ?? "").trim();
                        return referenceId === destinationWarehouseReferenceId && locationId === destinationLocationId;
                    }) ||
                    candidates.find((warehouse) => {
                        const referenceId = String(warehouse?.referenceId ?? "").trim();
                        return referenceId === destinationWarehouseReferenceId;
                    });

                const selectedWarehouseId = String(selectedWarehouse?.id ?? selectedWarehouse?.warehouseId ?? "").trim();
                destinationWarehouseIds = selectedWarehouseId ? [selectedWarehouseId] : [];
            } catch (error) {
                console.warn("[SprintNuevo] destination warehouses by reference failed", {
                    destinationWarehouseReferenceId,
                    destinationLocationId,
                    error,
                });
            }
        }

        console.info("[SprintNuevo] createSprint input", {
            destinationLocationId,
            destinationWarehouseReferenceId,
            destinationWarehouseIds,
            destinationWarehouseGroupId,
            sourceLocationId,
            sourceGroupId,
            sourceWarehouseIds,
            assigneeId,
        });

        if (!assigneeId) {
            toast.error("Selecciona un asignado");
            return null;
        }
        if (!destinationLocationId) {
            toast.error("Selecciona la ubicación destino");
            return null;
        }
        if (!destinationWarehouseReferenceId) {
            toast.error("Selecciona el almacén destino");
            return null;
        }
        if (!destinationWarehouseIds.length) {
            toast.error("No se pudieron resolver los almacenes destino del warehouse seleccionado");
            return null;
        }
        if (!destinationWarehouseGroupId) {
            console.warn("[SprintNuevo] destination warehouse group unresolved", {
                destinationLocationId,
                destinationWarehouseReferenceId,
                currentRecord: record,
            });
            toast.error("No se pudo resolver el grupo de almacén destino");
            return null;
        }
        if (!sourceGroupId) {
            toast.error("Selecciona el grupo de almacén source");
            return null;
        }
        if (!sourceWarehouseIds.length) {
            toast.error("No se pudieron resolver los almacenes source del grupo seleccionado");
            return null;
        }
        if (!sourceLocationId) {
            toast.error("No se pudo resolver la ubicación source");
            return null;
        }

        const payload: CreateSprintPayload = {
            assigneeId,
            source: {
                locationId: sourceLocationId,
                warehousesIds: sourceWarehouseIds,
                warehouseGroupsIds: [sourceGroupId],
                warehouseId: sourceWarehouseIds[0],
                warehouseGroupId: sourceGroupId,
            },
            destination: {
                locationId: destinationLocationId,
                warehousesIds: destinationWarehouseIds,
                warehouseGroupsIds: [destinationWarehouseGroupId],
                warehouseId: destinationWarehouseIds[0],
                warehouseGroupId: destinationWarehouseGroupId,
            },
        };

        console.info("[SprintNuevo] createSprint payload", payload);

        try {
            setSubmitting(true);
            const response = await fetch(SPRINT_URL, {
                method: "POST",
                headers: JANIS_HEADERS,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(text || `HTTP ${response.status}`);
            }

            const created = await response.json().catch(() => ({}));
            toast.success("Sprint creado correctamente");
            return getCreatedSprintId(created) || null;
        } catch (error: any) {
            toast.error(error?.message || "No se pudo crear el sprint");
            return null;
        } finally {
            setSubmitting(false);
        }
    };

    const headerActions = useMemo<Action[]>(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                onClick: async () => {
                    const createdId = await createSprint();
                    if (createdId) router.push(`/almacen/gestion/sprints/${encodeURIComponent(createdId)}`);
                },
                disabled: submitting,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: async () => {
                    const createdId = await createSprint();
                    if (createdId) router.push(`/almacen/gestion/sprints/${encodeURIComponent(createdId)}`);
                },
                disabled: submitting,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: async () => {
                    const createdId = await createSprint();
                    if (createdId) setRecord({ ...initialRecord });
                },
                disabled: submitting,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/almacen/gestion/sprints"),
                disabled: submitting,
            },
        ],
        [router, submitting, record]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Sprint</div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
            status: submitting ? { text: "Guardando...", variant: "info" } : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, submitting]
    );

    return <SprintFields record={record} readOnly={false} onChange={set} />;
}
