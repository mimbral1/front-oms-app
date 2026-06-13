// app/views/PickingView/PickingPoints/Nuevo/Nuevo.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuthQA } from "@/lib/http/client";
import {
    PickingPointFields,
    PickingPointRecord,
} from "@/features/ubicaciones/components/pickingpoints/PickingPointsFields";

type SelectOption = {
    label: string;
    value: string;
};

type LocationOption = SelectOption & {
    city?: string;
    stateProvince?: string;
    country?: string;
    addressLine1?: string;
    addressLine2?: string;
    latitude?: number | null;
    longitude?: number | null;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
    value && typeof value === "object" ? (value as UnknownRecord) : {};

const asArray = (value: unknown): unknown[] =>
    Array.isArray(value) ? value : [];

const FIXED_TIMEZONE = "America/Chile/Santiago";

/* Registro inicial vacío */
const createInitialRecord = (): PickingPointRecord => ({
    nombre: "",
    estado: "Inactivo",
    refId: "",
    location: "",
    tiendaNombre: "",
    zonaHoraria: FIXED_TIMEZONE,
    canalesVenta: [],
    prioridad: "",
    esquemaHorario: "",
    esquemaPicking: "",
    limiteDefaultPedidosRonda1: "",
    limitePedidosRonda2: "",
    limiteDefaultItemsRonda: "",
    limiteItemsRonda: "",
    limitarRondasPorTransportista: false,

    /* ===== NUEVOS CAMPOS ===== */
    optimizarAgrupamientoRondas: false,
    cantidadMinimaUnidadesPorPedido: "",
    cantidadMaximaUnidadesPorPedido: "",
    cantidadMaximaPedidos: "",
    restriccionPorGrupoProductos: [],

    ubicacionTexto: "",
    ubicacionLat: null,
    ubicacionLng: null,
    creador: undefined,
    fechaCreacion: undefined,
    modificador: undefined,
    fechaModificacion: undefined,
});

export default function PickingPointNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuthQA } = useFetchWithAuthQA();
    const [record, setRecord] = useState<PickingPointRecord>(() => createInitialRecord());
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
    const [storeOptions, setStoreOptions] = useState<SelectOption[]>([]);
    const [salesChannelOptions, setSalesChannelOptions] = useState<SelectOption[]>([]);
    const [windowSchemaOptions, setWindowSchemaOptions] = useState<SelectOption[]>([]);
    const [pickingSchemaOptions, setPickingSchemaOptions] = useState<SelectOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const pickValue = useCallback((...values: unknown[]) => {
        for (const value of values) {
            if (value === null || value === undefined) continue;
            const parsed = String(value).trim();
            if (parsed) return parsed;
        }
        return "";
    }, []);

    const toOptions = useCallback((rows: unknown[], valueKeys: string[], labelKeys: string[]): SelectOption[] => {
        const mapped = rows
            .map((row) => {
                const rowObj = asRecord(row);
                const value = pickValue(...valueKeys.map((k) => rowObj[k]));
                const label = pickValue(...labelKeys.map((k) => rowObj[k]), value);
                if (!value || !label) return null;
                return { value, label };
            })
            .filter((item): item is SelectOption => Boolean(item));

        const unique = new Map<string, SelectOption>();
        for (const item of mapped) {
            if (!unique.has(item.value)) unique.set(item.value, item);
        }

        return Array.from(unique.values());
    }, [pickValue]);

    const mapWindowsSchemaOptions = useCallback((res: unknown): SelectOption[] => {
        const resObj = asRecord(res);
        const dataObj = asRecord(resObj.data);
        const rows = asArray(dataObj.items);
        const mapped = rows
            .map((row) => {
                const rowObj = asRecord(row);
                const schema = asRecord(rowObj.schema ?? rowObj);
                const value = pickValue(schema.id);
                const label = pickValue(schema.name, value);
                if (!value || !label) return null;
                return { value, label };
            })
            .filter((item: SelectOption | null): item is SelectOption => Boolean(item));

        const unique = new Map<string, SelectOption>();
        for (const item of mapped) {
            if (!unique.has(item.value)) unique.set(item.value, item);
        }

        return Array.from(unique.values());
    }, [pickValue]);

    const mapPickingSchemaOptions = useCallback((res: unknown): SelectOption[] => {
        const resObj = asRecord(res);
        const dataValue = resObj.data;
        const dataObj = asRecord(dataValue);
        const rows = Array.isArray(dataValue)
            ? dataValue
            : Array.isArray(dataObj.items)
                ? dataObj.items
                : asArray(resObj.items);

        const mapped = rows
            .map((row) => {
                const rowObj = asRecord(row);
                const schema = asRecord(rowObj.schema ?? rowObj.pickingSchema ?? rowObj);

                const value = pickValue(
                    schema.id,
                    schema.schemaId,
                    schema.pickingSchemaId,
                    schema.referenceId,
                    schema.value,
                    schema.Id,
                );

                const label = pickValue(
                    schema.name,
                    schema.schemaName,
                    schema.nombre,
                    schema.label,
                    schema.description,
                    value,
                );

                if (!value || !label) return null;
                return { value, label };
            })
            .filter((item: SelectOption | null): item is SelectOption => Boolean(item));

        const unique = new Map<string, SelectOption>();
        for (const item of mapped) {
            if (!unique.has(item.value)) unique.set(item.value, item);
        }

        return Array.from(unique.values());
    }, [pickValue]);

    const mapLocationOptions = useCallback((res: unknown): LocationOption[] => {
        const resObj = asRecord(res);
        const dataValue = resObj.data;
        const dataObj = asRecord(dataValue);
        const rows = Array.isArray(resObj.items)
            ? resObj.items
            : Array.isArray(dataObj.items)
                ? dataObj.items
                : Array.isArray(dataValue)
                    ? dataValue
                    : [];

        const mapped = rows
            .map((row) => {
                const rowObj = asRecord(row);
                const value = pickValue(rowObj.id, rowObj.locationId, rowObj.referenceId);
                const label = pickValue(rowObj.name, rowObj.locationName, value);
                if (!value || !label) return null;

                return {
                    value,
                    label,
                    city: pickValue(rowObj.city),
                    stateProvince: pickValue(rowObj.stateProvince),
                    country: pickValue(rowObj.country),
                    addressLine1: pickValue(rowObj.addressLine1),
                    addressLine2: pickValue(rowObj.addressLine2),
                    latitude: typeof rowObj.latitude === "number" ? rowObj.latitude : null,
                    longitude: typeof rowObj.longitude === "number" ? rowObj.longitude : null,
                } as LocationOption;
            })
            .filter((item: LocationOption | null): item is LocationOption => Boolean(item));

        const unique = new Map<string, LocationOption>();
        for (const item of mapped) {
            if (!unique.has(item.value)) unique.set(item.value, item);
        }

        return Array.from(unique.values());
    }, [pickValue]);

    React.useEffect(() => {
        let mounted = true;

        const loadOptions = async () => {
            try {
                const [locationsRes, storesRes, salesChannelsRes, windowsRes, pickingSchemasRes] = await Promise.all([
                    fetchWithAuthQA<unknown>("comerce-service/locations", { method: "GET" }),
                    fetchWithAuthQA<unknown>("comerce-service/store", { method: "GET" }),
                    fetchWithAuthQA<unknown>("comerce-service/sales-channel/ListarSimple", { method: "GET" }),
                    fetchWithAuthQA<unknown>("picking-service/windows/schemas?page=1&pageSize=200", { method: "GET" }),
                    fetchWithAuthQA<unknown>("picking-service/picking-schemas/simple", { method: "GET" }),
                ]);

                if (!mounted) return;

                const storesObj = asRecord(storesRes);
                const storesData = storesObj.data;
                const storesDataObj = asRecord(storesData);
                const storesRows = Array.isArray(storesData)
                    ? storesData
                    : Array.isArray(storesDataObj.items)
                        ? storesDataObj.items
                        : asArray(storesObj.items);

                const salesChannelsObj = asRecord(salesChannelsRes);
                const salesChannelsData = salesChannelsObj.data;
                const salesChannelRows = Array.isArray(salesChannelsData)
                    ? salesChannelsData
                    : asArray(salesChannelsObj.items);

                setLocationOptions(mapLocationOptions(locationsRes));
                setStoreOptions(
                    toOptions(storesRows, ["Id", "id", "storeId"], ["Name", "name", "storeName"])
                );
                setSalesChannelOptions(
                    toOptions(salesChannelRows, ["referenceId", "id", "code"], ["name", "description", "referenceId"])
                );
                setWindowSchemaOptions(mapWindowsSchemaOptions(windowsRes));
                setPickingSchemaOptions(mapPickingSchemaOptions(pickingSchemasRes));
            } catch (error) {
                console.error("Error cargando opciones de Picking Point:", error);
            } finally {
                if (mounted) setOptionsLoading(false);
            }
        };

        loadOptions();

        return () => {
            mounted = false;
        };
    }, [
        fetchWithAuthQA,
        mapLocationOptions,
        mapPickingSchemaOptions,
        mapWindowsSchemaOptions,
        toOptions,
    ]);

    const handleChange = <K extends keyof PickingPointRecord>(
        field: K,
        value: PickingPointRecord[K]
    ) => {
        setRecord((prev) => {
            if (field !== "location") {
                return { ...prev, [field]: value };
            }

            const raw = String(value || "");
            const selectedLocation = locationOptions.find(
                (option) => option.label === raw || option.value === raw,
            );

            if (!selectedLocation) {
                return {
                    ...prev,
                    location: raw,
                    ubicacionTexto: "",
                    ubicacionLat: null,
                    ubicacionLng: null,
                };
            }

            const addressParts = [
                selectedLocation.addressLine1,
                selectedLocation.addressLine2,
                selectedLocation.city,
                selectedLocation.stateProvince,
                selectedLocation.country,
            ].filter(Boolean);

            return {
                ...prev,
                location: selectedLocation.value,
                ubicacionTexto: addressParts.join(", "),
                ubicacionLat: selectedLocation.latitude ?? null,
                ubicacionLng: selectedLocation.longitude ?? null,
            };
        });
    };

    const toNumber = useCallback((value: number | string | undefined, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }, []);

    const buildPayload = useCallback((current: PickingPointRecord) => ({
        referenceId: (current.refId || "").trim(),
        name: (current.nombre || "").trim(),
        locationId: (current.location || "").trim(),
        storeId: toNumber(current.tiendaNombre, 0),
        timeZone: FIXED_TIMEZONE,
        priority: toNumber(current.prioridad, 0),
        windowSchemaId: (current.esquemaHorario || "").trim(),
        status: current.estado === "Activo" ? "active" : "inactive",
        userId: toNumber(user?.id, 0),
        pickingSchemaId: (current.esquemaPicking || "").trim(),
        salesChannelIds: (current.canalesVenta || []).filter(Boolean),
        productGroupIds: (current.restriccionPorGrupoProductos || [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value)),
        roundConfig: {
            defaultMaxOrdersPerRound: toNumber(current.limiteDefaultPedidosRonda1, 0),
            maxOrdersPerRound: toNumber(current.limitePedidosRonda2, 0),
            defaultMaxItemsPerRound: toNumber(current.limiteDefaultItemsRonda, 0),
            maxItemsPerRound: toNumber(current.limiteItemsRonda, 0),
            limitRoundsByCarrier: Boolean(current.limitarRondasPorTransportista),
            optimizeGrouping: Boolean(current.optimizarAgrupamientoRondas),
            minUnitsPerOrder: toNumber(current.cantidadMinimaUnidadesPorPedido, 0),
            maxUnitsPerOrder: toNumber(current.cantidadMaximaUnidadesPorPedido, 0),
            maxOrdersTotal: toNumber(current.cantidadMaximaPedidos, 0),
        },
    }), [
        toNumber,
        user?.id,
    ]);

    const validatePayload = useCallback((payload: ReturnType<typeof buildPayload>) => {
        const errors: string[] = [];
        if (!payload.referenceId) errors.push("Ref ID es obligatorio.");
        if (!payload.name) errors.push("Nombre es obligatorio.");
        if (!payload.locationId) errors.push("Location es obligatorio.");
        if (!payload.windowSchemaId) errors.push("Esquema horario es obligatorio.");
        if (!payload.pickingSchemaId) errors.push("Esquema de picking es obligatorio.");
        if (!payload.userId) errors.push("No se pudo resolver el usuario actual.");
        return errors;
    }, []);

    const createPickingPoint = useCallback(async (resetAfterSave = false) => {
        const payload = buildPayload(record);
        const errors = validatePayload(payload);

        if (errors.length) {
            console.warn("Validación antes de crear Picking Point:", errors);
            return;
        }

        try {
            console.log("Payload a enviar:", JSON.stringify(payload, null, 2));
            await fetchWithAuthQA("picking-service/points/picking-points", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (resetAfterSave) {
                setRecord(createInitialRecord());
                return;
            }

            router.push("/ubicaciones/picking-points");
        } catch (error) {
            console.error("Error creando Picking Point:", error);
        }
    }, [
        buildPayload,
        fetchWithAuthQA,
        record,
        router,
        validatePayload,
    ]);

    const handleSave = useCallback(() => {
        createPickingPoint(false);
    }, [createPickingPoint]);

    const handleSaveAndCreate = useCallback(() => {
        createPickingPoint(true);
    }, [createPickingPoint]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "primary",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: handleSaveAndCreate,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-4 w-4" />,
                onClick: () => router.push("/ubicaciones/picking-points"),
            },
        ],
        [handleSave, handleSaveAndCreate, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
                        Puntos de picking
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    return (
        <div className="p-6 bg-white">
            <PickingPointFields
                record={record}
                isCreate
                onChange={handleChange}
                locationOptions={locationOptions}
                storeOptions={storeOptions}
                salesChannelOptions={salesChannelOptions}
                windowSchemaOptions={windowSchemaOptions}
                pickingSchemaOptions={pickingSchemaOptions}
                optionsLoading={optionsLoading}
            />
        </div>
    );
}
