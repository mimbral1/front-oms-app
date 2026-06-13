// app/views/PickingView/PickingPoints/Resumen/Resumen.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useFetchWithAuthQA } from "@/lib/http/client";
import {
  PickingPointFields,
  PickingPointRecord,
} from "@/features/ubicaciones/components/pickingpoints/PickingPointsFields";

type SelectOption = { label: string; value: string };
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

/* ===== helpers para parsear respuestas ===== */
const pickValue = (...values: unknown[]) => {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
};

const toOptions = (rows: unknown[], valueKeys: string[], labelKeys: string[]): SelectOption[] => {
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
  for (const item of mapped) if (!unique.has(item.value)) unique.set(item.value, item);
  return Array.from(unique.values());
};

const mapWindowsSchemaOptions = (res: unknown): SelectOption[] => {
  const resObj = asRecord(res);
  const dataObj = asRecord(resObj.data);
  const rows = asArray(dataObj.items);
  const mapped = rows
    .map((row) => {
      const rowObj = asRecord(row);
      const schema = asRecord(rowObj.schema ?? rowObj);
      const value = pickValue(schema?.id);
      const label = pickValue(schema?.name, value);
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item: SelectOption | null): item is SelectOption => Boolean(item));
  const unique = new Map<string, SelectOption>();
  for (const item of mapped) if (!unique.has(item.value)) unique.set(item.value, item);
  return Array.from(unique.values());
};

const mapPickingSchemaOptions = (res: unknown): SelectOption[] => {
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
      const value = pickValue(schema?.id, schema?.schemaId, schema?.pickingSchemaId, schema?.referenceId, schema?.value, schema?.Id);
      const label = pickValue(schema?.name, schema?.schemaName, schema?.nombre, schema?.label, schema?.description, value);
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item: SelectOption | null): item is SelectOption => Boolean(item));
  const unique = new Map<string, SelectOption>();
  for (const item of mapped) if (!unique.has(item.value)) unique.set(item.value, item);
  return Array.from(unique.values());
};

const mapLocationOptions = (res: unknown): LocationOption[] => {
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
      const value = pickValue(row?.id, row?.locationId, row?.referenceId);
      const label = pickValue(row?.name, row?.locationName, value);
      if (!value || !label) return null;
      return {
        value, label,
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
  for (const item of mapped) if (!unique.has(item.value)) unique.set(item.value, item);
  return Array.from(unique.values());
};

/* ===== mapeo API → record ===== */
function mapApiToRecord(res: unknown): PickingPointRecord {
  const resObj = asRecord(res);
  const dataObj = asRecord(resObj.data);
  const pp = asRecord(dataObj.pickingPoint);
  const rc = asRecord(dataObj.roundConfig);
  const profiles = asRecord(dataObj.profiles);
  const salesChannelIds = asArray(dataObj.salesChannelIds);
  const productGroupIds = asArray(dataObj.productGroupIds);

  const createdBy = asRecord(profiles.createdBy);
  const updatedBy = asRecord(profiles.updatedBy);
  const hasCreatedBy = Object.keys(createdBy).length > 0;
  const hasUpdatedBy = Object.keys(updatedBy).length > 0;
  const asNumberOrString = (value: unknown, fallback: number | string = ""): number | string =>
    typeof value === "number" || typeof value === "string" ? value : fallback;
  const asBoolean = (value: unknown, fallback = false): boolean =>
    typeof value === "boolean" ? value : fallback;

  return {
    id: pickValue(pp.id),
    nombre: pickValue(pp.name),
    estado: pp.status === "active" ? "Activo" : "Inactivo",
    refId: pickValue(pp.referenceId),
    location: pickValue(pp.locationId),
    tiendaNombre: pp.storeId != null ? String(pp.storeId) : "",
    zonaHoraria: pickValue(pp.timeZone),
    canalesVenta: salesChannelIds.filter((v) => v != null).map(String),
    prioridad: asNumberOrString(pp.priority),
    esquemaHorario: pickValue(pp.windowSchemaId),
    esquemaPicking: pickValue(pp.pickingSchemaId),

    /* Rondas */
    limiteDefaultPedidosRonda1: asNumberOrString(rc.defaultMaxOrdersPerRound),
    limitePedidosRonda2: asNumberOrString(rc.maxOrdersPerRound),
    limiteDefaultItemsRonda: asNumberOrString(rc.defaultMaxItemsPerRound),
    limiteItemsRonda: asNumberOrString(rc.maxItemsPerRound),
    limitarRondasPorTransportista: asBoolean(rc.limitRoundsByCarrier),
    optimizarAgrupamientoRondas: asBoolean(rc.optimizeGrouping),
    cantidadMinimaUnidadesPorPedido: asNumberOrString(rc.minUnitsPerOrder),
    cantidadMaximaUnidadesPorPedido: asNumberOrString(rc.maxUnitsPerOrder),
    cantidadMaximaPedidos: asNumberOrString(rc.maxOrdersTotal),
    restriccionPorGrupoProductos: productGroupIds.filter((v) => v != null).map(String),

    ubicacionTexto: "",
    creador: hasCreatedBy
      ? { name: `${pickValue(createdBy.nombres)} ${pickValue(createdBy.apellidos)}`.trim(), email: pickValue(createdBy.email) || undefined }
      : undefined,
    fechaCreacion: pickValue(pp.dateCreated),
    modificador: hasUpdatedBy
      ? { name: `${pickValue(updatedBy.nombres)} ${pickValue(updatedBy.apellidos)}`.trim(), email: pickValue(updatedBy.email) || undefined }
      : undefined,
    fechaModificacion: pickValue(pp.dateModified),
  };
}

const EMPTY_RECORD: PickingPointRecord = {
  nombre: "",
  estado: "Inactivo",
  canalesVenta: [],
  restriccionPorGrupoProductos: [],
};

export default function PickingPointResumenView() {
  const router = useRouter();
  const { id } = useParams();
  const { fetchWithAuthQA } = useFetchWithAuthQA();

  const [record, setRecord] = useState<PickingPointRecord>({ ...EMPTY_RECORD });
  const [loading, setLoading] = useState(true);

  /* ===== Opciones para dropdowns ===== */
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [storeOptions, setStoreOptions] = useState<SelectOption[]>([]);
  const [salesChannelOptions, setSalesChannelOptions] = useState<SelectOption[]>([]);
  const [windowSchemaOptions, setWindowSchemaOptions] = useState<SelectOption[]>([]);
  const [pickingSchemaOptions, setPickingSchemaOptions] = useState<SelectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  /* ===== Cargar opciones ===== */
  useEffect(() => {
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
          : Array.isArray(storesDataObj.items) ? storesDataObj.items
            : asArray(storesObj.items);

        const salesChannelsObj = asRecord(salesChannelsRes);
        const salesChannelsData = salesChannelsObj.data;
        const salesChannelRows = Array.isArray(salesChannelsData)
          ? salesChannelsData
          : asArray(salesChannelsObj.items);

        setLocationOptions(mapLocationOptions(locationsRes));
        setStoreOptions(toOptions(storesRows, ["Id", "id", "storeId"], ["Name", "name", "storeName"]));
        setSalesChannelOptions(toOptions(salesChannelRows, ["referenceId", "id", "code"], ["name", "description", "referenceId"]));
        setWindowSchemaOptions(mapWindowsSchemaOptions(windowsRes));
        setPickingSchemaOptions(mapPickingSchemaOptions(pickingSchemasRes));
      } catch (error) {
        console.error("Error cargando opciones de Picking Point:", error);
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    };
    loadOptions();
    return () => { mounted = false; };
  }, [fetchWithAuthQA]);

  /* ===== Cargar datos del picking point ===== */
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuthQA(
          `picking-service/points/picking-points/${id}`,
          { method: "GET" },
        );
        if (mounted) setRecord(mapApiToRecord(res));
      } catch (error) {
        console.error("Error cargando Picking Point:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id, fetchWithAuthQA]);

  const handleChange = <K extends keyof PickingPointRecord>(
    field: K,
    value: PickingPointRecord[K]
  ) => {
    setRecord((prev) => {
      if (field !== "location") return { ...prev, [field]: value };

      const raw = String(value || "");
      if (!raw) {
        return { ...prev, location: "", ubicacionTexto: "", ubicacionLat: null, ubicacionLng: null };
      }
      const selectedLocation = locationOptions.find(
        (o) => o.label === raw || o.value === raw,
      );
      if (!selectedLocation) {
        return { ...prev, location: raw, ubicacionTexto: "", ubicacionLat: null, ubicacionLng: null };
      }
      const addressParts = [
        selectedLocation.addressLine1, selectedLocation.addressLine2,
        selectedLocation.city, selectedLocation.stateProvince, selectedLocation.country,
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

  /* Resolver coordenadas cuando se cargan las opciones de location */
  useEffect(() => {
    if (!record.location || locationOptions.length === 0) return;
    if (record.ubicacionLat != null && record.ubicacionLng != null) return;
    const loc = locationOptions.find(
      (o) => o.value === record.location || o.label === record.location,
    );
    if (!loc) return;
    const addressParts = [
      loc.addressLine1, loc.addressLine2,
      loc.city, loc.stateProvince, loc.country,
    ].filter(Boolean);
    setRecord((prev) => ({
      ...prev,
      ubicacionTexto: addressParts.join(", "),
      ubicacionLat: loc.latitude ?? null,
      ubicacionLng: loc.longitude ?? null,
    }));
  }, [record.location, record.ubicacionLat, record.ubicacionLng, locationOptions]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-4 w-4" />,
        onClick: () => console.log("Aplicar cambios", record),
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: () => console.log("Guardar", record),
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-4 w-4" />,
        onClick: () => router.push("/ubicaciones/picking-points"),
      },
    ],
    [record, router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Puntos de picking
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {record.nombre || (id as string) || "Detalle"}
          </div>
        </div>
      ),
      action: headerActions,
      status: record.estado
        ? {
          text: record.estado,
          variant: record.estado === "Activo" ? "success" : "warning",
        }
        : undefined,
    } as unknown as PageHeaderProps),
    [headerActions, record.nombre, record.estado, id]
  );

  if (loading) {
    return (
      <div className="p-6 bg-white flex items-center justify-center min-h-[200px]">
        <span className="text-gray-500">Cargando picking point…</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white">
      <PickingPointFields
        record={record}
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
