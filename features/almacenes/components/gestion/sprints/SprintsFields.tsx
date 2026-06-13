"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
    UserCircleIcon,
    TruckIcon,
    BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { BASE_WAREHOUSES, URL_BASE } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

type OptionItem = {
    id: string;
    label: string;
};

type LocationApi = {
    id?: string | number;
    name?: string;
    referenceId?: string;
};

type WarehouseApi = {
    id?: string | number;
    name?: string;
    referenceId?: string;
    warehouseId?: string | number;
    groupId?: string | number;
    warehouseGroupId?: string | number;
    group?: string | number | { id?: string | number; name?: string };
    warehouseGroup?: string | number | { id?: string | number; name?: string };
    warehouse?: {
        id?: string | number;
        referenceId?: string;
        groupId?: string | number;
        warehouseGroupId?: string | number;
        group?: string | number | { id?: string | number; name?: string };
        warehouseGroup?: string | number | { id?: string | number; name?: string };
    };
};

type WarehouseGroupApi = {
    id?: string | number;
    name?: string;
    locationId?: string | number;
    location?: string;
    locationName?: string;
};

type UserApi = {
    id?: string | number;
    ID?: string | number;
    userId?: string | number;
    usuarioId?: string | number;
    username?: string;
    userName?: string;
    nombre?: string;
    name?: string;
    FIRSTNAME?: string;
    LASTNAME?: string;
    email?: string;
    EMAIL?: string;
};

const LOCATIONS_URL = `${URL_BASE}/comerce-service/locations`;
const WAREHOUSES_BY_LOCATION_URL = (locationId: string) => `${URL_BASE}/comerce-service/locations/${encodeURIComponent(locationId)}/warehouses`;
const WAREHOUSE_GROUP_URL = `${BASE_WAREHOUSES}/warehouse-group`;
const WAREHOUSES_BY_GROUP_URL = (groupId: string) => `${BASE_WAREHOUSES}/warehouse?filters[group]=${encodeURIComponent(groupId)}`;
const WAREHOUSE_BY_REFERENCE_ID_FILTER_URL = (referenceId: string) => `${BASE_WAREHOUSES}/warehouse?filters[referenceId]=${encodeURIComponent(referenceId)}`;
const USERS_URL = `${URL_BASE}/idservice/usuarios`;

const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
    "janis-api-key": "test-key",
    "janis-api-secret": "test-secret",
    "janis-client": "test-client",
    "Content-Type": "application/json",
});

const normalizeArray = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.rows)) return payload.rows as T[];
    if (Array.isArray(payload?.results)) return payload.results as T[];
    return [];
};

const normalizeId = (value: unknown): string => String(value ?? "").trim();

const extractWarehouseIdForDestination = (warehouse: WarehouseApi | null | undefined): string => {
    return normalizeId(
        warehouse?.referenceId ??
        warehouse?.warehouse?.referenceId ??
        warehouse?.warehouseId ??
        warehouse?.id ??
        warehouse?.warehouse?.id
    );
};

const extractWarehouseReferenceId = (warehouse: WarehouseApi | null | undefined): string => {
    return String(warehouse?.referenceId ?? warehouse?.warehouse?.referenceId ?? "").trim();
};

const normalizeGroupField = (
    value: string | number | { id?: string | number; name?: string } | undefined
): string | undefined => {
    const normalized = value && typeof value === "object"
        ? normalizeId(value.id)
        : normalizeId(value);
    return normalized || undefined;
};

const extractWarehouseGroupId = (warehouse: WarehouseApi | null | undefined): string => {
    return normalizeId(
        warehouse?.warehouseGroupId ??
        warehouse?.groupId ??
        normalizeGroupField(warehouse?.warehouseGroup) ??
        normalizeGroupField(warehouse?.group) ??
        warehouse?.warehouse?.warehouseGroupId ??
        warehouse?.warehouse?.groupId ??
        normalizeGroupField(warehouse?.warehouse?.warehouseGroup) ??
        normalizeGroupField(warehouse?.warehouse?.group)
    );
};

export interface SprintRecord {
    id?: string;
    title?: string;
    status?: string;
    // DESTINATION
    destLocation: string;
    destWarehouse: string;
    destWarehouseGroupId?: string;
    // SOURCE
    sourceGroup: string;
    sourceLocationId?: string;
    sourceWarehouse: string;
    assigneeId: string;
    // meta 
    creator?: { name: string; email: string; date?: string };
    assignee?: { name: string; email: string };
    startedAt?: string;
    endedAt?: string;
}

export function SprintFields({
    record,
    readOnly = false,
    onChange,
}: {
    record: SprintRecord;
    readOnly?: boolean;
    onChange?: <K extends keyof SprintRecord>(field: K, value: SprintRecord[K]) => void;
}) {
    const [locationOptions, setLocationOptions] = useState<OptionItem[]>([]);
    const [warehouseOptions, setWarehouseOptions] = useState<OptionItem[]>([]);
    const [groupOptions, setGroupOptions] = useState<OptionItem[]>([]);
    const [sourceWarehouseOptions, setSourceWarehouseOptions] = useState<OptionItem[]>([]);
    const [assigneeOptions, setAssigneeOptions] = useState<OptionItem[]>([]);
    const [destinationWarehouseGroupByWarehouseId, setDestinationWarehouseGroupByWarehouseId] = useState<Record<string, string>>({});
    const [destinationWarehouseReferenceByWarehouseId, setDestinationWarehouseReferenceByWarehouseId] = useState<Record<string, string>>({});
    const [sourceLocationByGroupId, setSourceLocationByGroupId] = useState<Record<string, string>>({});

    const set =
        <K extends keyof SprintRecord>(field: K) =>
            (v: SprintRecord[K]) =>
                onChange?.(field, v);

    const locationLabelById = useMemo(
        () => new Map(locationOptions.map((option) => [option.id, option.label])),
        [locationOptions]
    );
    const warehouseLabelById = useMemo(
        () => new Map(warehouseOptions.map((option) => [option.id, option.label])),
        [warehouseOptions]
    );
    const groupLabelById = useMemo(
        () => new Map(groupOptions.map((option) => [option.id, option.label])),
        [groupOptions]
    );
    const sourceWarehouseLabelById = useMemo(
        () => new Map(sourceWarehouseOptions.map((option) => [option.id, option.label])),
        [sourceWarehouseOptions]
    );
    const assigneeLabelById = useMemo(
        () => new Map(assigneeOptions.map((option) => [option.id, option.label])),
        [assigneeOptions]
    );

    const locationValue = locationLabelById.get(String(record.destLocation || "")) || "Seleccionar";
    const warehouseValue = warehouseLabelById.get(String(record.destWarehouse || "")) || "Seleccionar";
    const groupValue = groupLabelById.get(String(record.sourceGroup || "")) || "Seleccionar";
    const assigneeValue = assigneeLabelById.get(String(record.assigneeId || "")) || "Seleccionar";

    const locationSelectOptions = useMemo(
        () => ["Seleccionar", ...locationOptions.map((option) => option.label)],
        [locationOptions]
    );
    const warehouseSelectOptions = useMemo(
        () => ["Seleccionar", ...warehouseOptions.map((option) => option.label)],
        [warehouseOptions]
    );
    const groupSelectOptions = useMemo(
        () => ["Seleccionar", ...groupOptions.map((option) => option.label)],
        [groupOptions]
    );
    const assigneeSelectOptions = useMemo(
        () => ["Seleccionar", ...assigneeOptions.map((option) => option.label)],
        [assigneeOptions]
    );

    useEffect(() => {
        let mounted = true;

        const loadLocations = async () => {
            try {
                const response = await fetch(LOCATIONS_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const options = normalizeArray<LocationApi>(payload)
                    .map((location) => {
                        const id = normalizeId(location?.id);
                        if (!id) return null;
                        const name = String(location?.name || "").trim();
                        const reference = String(location?.referenceId || "").trim();
                        const labelBase = name || reference || id;
                        return { id, label: labelBase };
                    })
                    .filter((option): option is OptionItem => Boolean(option));

                if (mounted) setLocationOptions(options);
            } catch {
                if (mounted) setLocationOptions([]);
            }
        };

        const loadWarehouseGroups = async () => {
            try {
                const response = await fetch(WAREHOUSE_GROUP_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const locationByGroup: Record<string, string> = {};
                const options = normalizeArray<WarehouseGroupApi>(payload)
                    .map((group) => {
                        const id = normalizeId(group?.id);
                        if (!id) return null;
                        const locationId = normalizeId(group?.locationId ?? group?.location);
                        if (locationId) locationByGroup[id] = locationId;
                        const name = String(group?.name || "").trim();
                        const labelBase = name || id;
                        return { id, label: labelBase };
                    })
                    .filter((option): option is OptionItem => Boolean(option));

                if (mounted) {
                    setGroupOptions(options);
                    setSourceLocationByGroupId(locationByGroup);
                }
            } catch {
                if (mounted) setGroupOptions([]);
            }
        };

        const loadAssignees = async () => {
            try {
                const response = await fetch(USERS_URL, {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const options = normalizeArray<UserApi>(payload)
                    .map((user) => {
                        const id = normalizeId(user?.id ?? user?.ID ?? user?.userId ?? user?.usuarioId);
                        if (!id) return null;

                        const fullName = `${String(user?.FIRSTNAME ?? "").trim()} ${String(user?.LASTNAME ?? "").trim()}`.trim();
                        const name = String(user?.username ?? user?.userName ?? user?.nombre ?? user?.name ?? fullName).trim();
                        const email = String(user?.email ?? user?.EMAIL ?? "").trim();
                        const labelBase = name || email || id;
                        const label = name && email ? `${name} (${email})` : labelBase;

                        return { id, label };
                    })
                    .filter((option): option is OptionItem => Boolean(option));

                const unique = Array.from(new Map(options.map((option) => [option.id, option])).values());
                if (mounted) setAssigneeOptions(unique);
            } catch {
                if (mounted) setAssigneeOptions([]);
            }
        };

        void loadLocations();
        void loadWarehouseGroups();
        void loadAssignees();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const selectedLocationId = String(record.destLocation || "").trim();

        if (!selectedLocationId) {
            setWarehouseOptions([]);
            if (record.destWarehouse) onChange?.("destWarehouse", "" as SprintRecord["destWarehouse"]);
            return;
        }

        const loadWarehousesByLocation = async () => {
            try {
                const response = await fetch(WAREHOUSES_BY_LOCATION_URL(selectedLocationId), {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const warehouseGroupByWarehouse: Record<string, string> = {};
                const warehouseReferenceByWarehouse: Record<string, string> = {};
                const options = normalizeArray<WarehouseApi>(payload)
                    .map((warehouse) => {
                        const id = extractWarehouseIdForDestination(warehouse);
                        if (!id) return null;
                        const referenceId = extractWarehouseReferenceId(warehouse);
                        if (referenceId) warehouseReferenceByWarehouse[id] = referenceId;
                        const groupId = extractWarehouseGroupId(warehouse);
                        if (groupId) warehouseGroupByWarehouse[id] = groupId;
                        const name = String(warehouse?.name || "").trim();
                        const reference = String(referenceId || warehouse?.referenceId || "").trim();
                        const labelBase = name && reference ? `${name} (${reference})` : name || reference || id;
                        return { id, label: labelBase };
                    })
                    .filter((option): option is OptionItem => Boolean(option));

                if (mounted) {
                    setWarehouseOptions(options);
                    setDestinationWarehouseGroupByWarehouseId(warehouseGroupByWarehouse);
                    setDestinationWarehouseReferenceByWarehouseId(warehouseReferenceByWarehouse);
                    const hasSelectedWarehouse = options.some((option) => option.id === String(record.destWarehouse || "").trim());
                    if (!hasSelectedWarehouse && record.destWarehouse) {
                        onChange?.("destWarehouse", "" as SprintRecord["destWarehouse"]);
                        onChange?.("destWarehouseGroupId", "" as SprintRecord["destWarehouseGroupId"]);
                    }
                }
            } catch {
                if (mounted) setWarehouseOptions([]);
            }
        };

        void loadWarehousesByLocation();

        return () => {
            mounted = false;
        };
    }, [record.destLocation]);

    useEffect(() => {
        let mounted = true;
        const selectedGroupId = String(record.sourceGroup || "").trim();

        if (!selectedGroupId) {
            setSourceWarehouseOptions([]);
            if (record.sourceWarehouse) onChange?.("sourceWarehouse", "" as SprintRecord["sourceWarehouse"]);
            if (record.sourceLocationId) onChange?.("sourceLocationId", "" as SprintRecord["sourceLocationId"]);
            return;
        }

        const sourceLocationId = sourceLocationByGroupId[selectedGroupId] || "";
        if (sourceLocationId !== String(record.sourceLocationId || "")) {
            onChange?.("sourceLocationId", sourceLocationId as SprintRecord["sourceLocationId"]);
        }

        const loadWarehousesByGroup = async () => {
            try {
                const response = await fetch(WAREHOUSES_BY_GROUP_URL(selectedGroupId), {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const options = normalizeArray<WarehouseApi>(payload)
                    .map((warehouse) => {
                        const id = normalizeId(warehouse?.warehouseId ?? warehouse?.id);
                        if (!id) return null;
                        const name = String(warehouse?.name || "").trim();
                        const reference = String(warehouse?.referenceId || "").trim();
                        const labelBase = name || reference || id;
                        return { id, label: labelBase };
                    })
                    .filter((option): option is OptionItem => Boolean(option));

                if (mounted) {
                    setSourceWarehouseOptions(options);
                    const hasSelectedWarehouse = options.some((option) => option.id === String(record.sourceWarehouse || "").trim());
                    if (!hasSelectedWarehouse) {
                        const fallback = options[0]?.id || "";
                        if (fallback !== String(record.sourceWarehouse || "")) {
                            onChange?.("sourceWarehouse", fallback as SprintRecord["sourceWarehouse"]);
                        }
                    }
                }
            } catch {
                if (mounted) setSourceWarehouseOptions([]);
            }
        };

        void loadWarehousesByGroup();

        return () => {
            mounted = false;
        };
    }, [record.sourceGroup, sourceLocationByGroupId]);

    useEffect(() => {
        const selectedWarehouseId = String(record.destWarehouse || "").trim();
        const derivedGroupId = selectedWarehouseId ? destinationWarehouseGroupByWarehouseId[selectedWarehouseId] || "" : "";
        if (derivedGroupId !== String(record.destWarehouseGroupId || "")) {
            onChange?.("destWarehouseGroupId", derivedGroupId as SprintRecord["destWarehouseGroupId"]);
        }
    }, [record.destWarehouse, destinationWarehouseGroupByWarehouseId]);

    useEffect(() => {
        let mounted = true;
        const selectedWarehouseId = String(record.destWarehouse || "").trim();
        const currentGroupId = String(record.destWarehouseGroupId || "").trim();
        const selectedWarehouseReferenceId = String(destinationWarehouseReferenceByWarehouseId[selectedWarehouseId] || "").trim();

        if (!selectedWarehouseId || currentGroupId) return;

        const resolveGroupFromWarehouse = async () => {
            const tryFromReferenceId = async (referenceId: string): Promise<string> => {
                if (!referenceId) return "";
                const response = await fetch(WAREHOUSE_BY_REFERENCE_ID_FILTER_URL(referenceId), {
                    method: "GET",
                    headers: JANIS_HEADERS,
                    cache: "no-store",
                });
                if (!response.ok) return "";
                const payload = await response.json();
                const candidates = normalizeArray<WarehouseApi>(payload);
                const warehouse = candidates.find((item) => extractWarehouseReferenceId(item) === referenceId) || candidates[0];
                return extractWarehouseGroupId(warehouse);
            };

            try {
                const referenceCandidates = Array.from(new Set([
                    selectedWarehouseReferenceId,
                    selectedWarehouseId,
                ].map((v) => String(v || "").trim()).filter(Boolean)));

                let groupId = "";
                for (const referenceId of referenceCandidates) {
                    groupId = await tryFromReferenceId(referenceId);
                    if (groupId) break;
                }
                if (!mounted || !groupId) return;

                onChange?.("destWarehouseGroupId", groupId as SprintRecord["destWarehouseGroupId"]);
                setDestinationWarehouseGroupByWarehouseId((prev) => ({
                    ...prev,
                    [selectedWarehouseId]: groupId,
                }));
            } catch {
                // keep empty and let validation surface the issue
            }
        };

        void resolveGroupFromWarehouse();

        return () => {
            mounted = false;
        };
    }, [record.destWarehouse, record.destWarehouseGroupId, destinationWarehouseReferenceByWarehouseId]);

    // Inicializamos valores por defecto
    const defaultRecord: SprintRecord = {
        ...record,
        destLocation: locationValue,
        destWarehouse: warehouseValue,
        sourceGroup: groupValue,
        assigneeId: assigneeValue,
    };


    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* DESTINATION */}
            <Card
                title="DESTINO"
                icon={BuildingOffice2Icon}
                noDefaultStyles
                hasTitleDivider
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <div className="grid grid-cols-12 gap-4">
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Ubicación</span>
                    <div className="col-span-11">
                        <CollapsibleField
                            label=""
                            value={defaultRecord.destLocation}
                            options={locationSelectOptions}
                            onChange={(selectedLabel) => {
                                if (selectedLabel === "Seleccionar") {
                                    set("destLocation")("" as SprintRecord["destLocation"]);
                                    set("destWarehouse")("" as SprintRecord["destWarehouse"]);
                                    set("destWarehouseGroupId")("" as SprintRecord["destWarehouseGroupId"]);
                                    return;
                                }
                                const selected = locationOptions.find((option) => option.label === selectedLabel);
                                set("destLocation")((selected?.id || "") as SprintRecord["destLocation"]);
                                set("destWarehouse")("" as SprintRecord["destWarehouse"]);
                                set("destWarehouseGroupId")("" as SprintRecord["destWarehouseGroupId"]);
                            }}
                            inline
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Almacén</span>
                    <div className="col-span-11">
                        <CollapsibleField
                            label=""
                            value={defaultRecord.destWarehouse}
                            options={warehouseSelectOptions}
                            onChange={(selectedLabel) => {
                                if (selectedLabel === "Seleccionar") {
                                    set("destWarehouse")("" as SprintRecord["destWarehouse"]);
                                    set("destWarehouseGroupId")("" as SprintRecord["destWarehouseGroupId"]);
                                    return;
                                }
                                const selected = warehouseOptions.find((option) => option.label === selectedLabel);
                                const selectedId = selected?.id || "";
                                set("destWarehouse")(selectedId as SprintRecord["destWarehouse"]);
                                set("destWarehouseGroupId")((destinationWarehouseGroupByWarehouseId[selectedId] || "") as SprintRecord["destWarehouseGroupId"]);
                            }}
                            inline
                        />
                    </div>
                </div>
            </Card>

            {/* SOURCE */}
            <Card
                title="SOURCE"
                icon={TruckIcon}
                noDefaultStyles
                hasTitleDivider
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <div className="grid grid-cols-12 gap-4">
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Grupo de almacén</span>
                    <div className="col-span-11">
                        <CollapsibleField
                            label=""
                            value={defaultRecord.sourceGroup}
                            options={groupSelectOptions}
                            onChange={(selectedLabel) => {
                                if (selectedLabel === "Seleccionar") {
                                    set("sourceGroup")("" as SprintRecord["sourceGroup"]);
                                    set("sourceWarehouse")("" as SprintRecord["sourceWarehouse"]);
                                    set("sourceLocationId")("" as SprintRecord["sourceLocationId"]);
                                    return;
                                }
                                const selected = groupOptions.find((option) => option.label === selectedLabel);
                                const selectedId = selected?.id || "";
                                set("sourceGroup")(selectedId as SprintRecord["sourceGroup"]);
                                set("sourceWarehouse")("" as SprintRecord["sourceWarehouse"]);
                                set("sourceLocationId")((sourceLocationByGroupId[selectedId] || "") as SprintRecord["sourceLocationId"]);
                            }}
                            inline
                        />
                    </div>

                </div>
            </Card>

            {/* ASSIGNEE */}
            <Card
                title="ASIGNADO"
                icon={UserCircleIcon}
                noDefaultStyles
                hasTitleDivider
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2"
            >
                <div className="grid grid-cols-12 gap-4">
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Asignado</span>
                    <div className="col-span-11">
                        <CollapsibleField
                            label=""
                            value={defaultRecord.assigneeId}
                            options={assigneeSelectOptions}
                            onChange={(selectedLabel) => {
                                if (selectedLabel === "Seleccionar") {
                                    set("assigneeId")("" as SprintRecord["assigneeId"]);
                                    return;
                                }
                                const selected = assigneeOptions.find((option) => option.label === selectedLabel);
                                set("assigneeId")((selected?.id || "") as SprintRecord["assigneeId"]);
                            }}
                            inline
                        />
                    </div>
                </div>
            </Card>

        </div>
    );
}
