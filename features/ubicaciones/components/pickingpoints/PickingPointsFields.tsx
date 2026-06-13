// app/views/PickingView/PickingPoints/components/PickingPointsFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  UserCircleIcon,
  PencilSquareIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { ActiveStatusToggle } from "@/components/ui/togle";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Avatar } from "@/components/ui/user-avatar";

/** Chip simple */
const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
    {children}
  </span>
);

/* ================= Tipos ================= */
export interface PickingPointRecord {
  id?: string;

  /* Header */
  nombre: string;
  estado: "Activo" | "Inactivo";

  /* DETALLE (izquierda) */
  refId?: string;
  location?: string;
  tiendaNombre?: string; // link mostrable
  zonaHoraria?: string; // ej: America/Argentina/Buenos_Aires
  canalesVenta: string[]; // chips
  prioridad?: number | string;

  esquemaHorario?: string | null; // selector
  esquemaPicking?: string | null; // selector

  /* RONDAS */
  limiteDefaultPedidosRonda1?: number | string;
  limitePedidosRonda2?: number | string;
  limiteDefaultItemsRonda?: number | string;
  limiteItemsRonda?: number | string;
  limitarRondasPorTransportista?: boolean;

  /* ======= NUEVOS CAMPOS (RONDAS) ======= */
  optimizarAgrupamientoRondas?: boolean;
  cantidadMinimaUnidadesPorPedido?: number | string;
  cantidadMaximaUnidadesPorPedido?: number | string;
  cantidadMaximaPedidos?: number | string;
  restriccionPorGrupoProductos?: string[];

  /* Lado derecho */
  ubicacionTexto?: string; // placeholder/mapa
  ubicacionLat?: number | null;
  ubicacionLng?: number | null;
  creador?: { name: string; email?: string };
  fechaCreacion?: string; // ISO
  modificador?: { name: string; email?: string };
  fechaModificacion?: string; // ISO
}

type SelectOption = {
  label: string;
  value: string;
};

/** Props */
export function PickingPointFields({
  record,
  isCreate = false, // opcional: para ocultar Ref ID/usuarios en "Nuevo"
  onChange,
  locationOptions = [],
  storeOptions = [],
  salesChannelOptions = [],
  windowSchemaOptions = [],
  pickingSchemaOptions = [],
  optionsLoading = false,
}: {
  record: PickingPointRecord;
  isCreate?: boolean;
  onChange?: <K extends keyof PickingPointRecord>(field: K, value: PickingPointRecord[K]) => void;
  locationOptions?: SelectOption[];
  storeOptions?: SelectOption[];
  salesChannelOptions?: SelectOption[];
  windowSchemaOptions?: SelectOption[];
  pickingSchemaOptions?: SelectOption[];
  optionsLoading?: boolean;
}) {
  const set =
    <K extends keyof PickingPointRecord>(field: K) =>
      (value: PickingPointRecord[K]) =>
        onChange?.(field, value);

  // helpers chips (Canales de venta)
  const removeCanal = (value: string) =>
    set("canalesVenta")((record.canalesVenta || []).filter((v) => v !== value));
  const addCanal = (selectedLabel: string) => {
    if (!selectedLabel) return;
    const option = salesChannelOptions.find((o) => o.label === selectedLabel || o.value === selectedLabel);
    const value = option?.value || selectedLabel;
    const arr = record.canalesVenta || [];
    if (arr.includes(value)) return;
    set("canalesVenta")([...arr, value]);
  };

  // helpers para resolver labels desde values
  const getSalesChannelLabel = (val: string) =>
    salesChannelOptions.find((o) => o.value === val || o.label === val)?.label || val;
  const getPickingSchemaLabel = (val: string) =>
    pickingSchemaOptions.find((o) => o.value === val || o.label === val)?.label || val;
  const getWindowSchemaLabel = (val: string) =>
    windowSchemaOptions.find((o) => o.value === val || o.label === val)?.label || val;
  const getLocationLabel = (val: string) =>
    locationOptions.find((o) => o.value === val || o.label === val)?.label || val;
  const getStoreLabel = (val: string) =>
    storeOptions.find((o) => o.value === val || o.label === val)?.label || val;

  const fmt = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("es-CL");
    } catch {
      return d;
    }
  };

  // para que al crear el registro parta con valores coherentes (evita “undefined”)
  React.useEffect(() => {
    if (isCreate) {
      if (!record.estado) set("estado")("Activo");
      if (typeof record.limitarRondasPorTransportista === "undefined") {
        set("limitarRondasPorTransportista")(false);
      }
      if (typeof record.optimizarAgrupamientoRondas === "undefined") {
        set("optimizarAgrupamientoRondas")(false);
      }
      if (!Array.isArray(record.restriccionPorGrupoProductos)) {
        set("restriccionPorGrupoProductos")([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate]);

  const locationLabels = locationOptions.map((o) => o.label);
  const storeLabels = storeOptions.map((o) => o.label);
  const salesChannelLabels = salesChannelOptions.map((o) => o.label);
  const windowSchemaLabels = windowSchemaOptions.map((o) => o.label);
  const pickingSchemaLabels = pickingSchemaOptions.map((o) => o.label);
  const priorityValue = Math.min(10, Math.max(1, Number(record.prioridad || 1)));
  const priorityPercent = ((priorityValue - 1) / 9) * 100;
  const priorityLabel = priorityValue <= 3 ? "Baja" : priorityValue <= 7 ? "Media" : "Alta";
  const parseMetric = (value?: number | string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const defaultOrdersPerRound = parseMetric(record.limiteDefaultPedidosRonda1);
  const maxOrdersPerRound = parseMetric(record.limitePedidosRonda2);
  const defaultItemsPerRound = parseMetric(record.limiteDefaultItemsRonda);
  const maxItemsPerRound = parseMetric(record.limiteItemsRonda);
  const maxOrdersTotal = parseMetric(record.cantidadMaximaPedidos);
  const hasOrdersRangeWarning = maxOrdersPerRound > 0 && defaultOrdersPerRound > maxOrdersPerRound;
  const hasItemsRangeWarning = maxItemsPerRound > 0 && defaultItemsPerRound > maxItemsPerRound;

  const LoadingHint = () => (
    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 animate-pulse">
      <span className="h-2 w-2 rounded-full bg-blue-500" />
      Cargando opciones...
    </div>
  );

  const hasCoordinates =
    typeof record.ubicacionLat === "number" && Number.isFinite(record.ubicacionLat) &&
    typeof record.ubicacionLng === "number" && Number.isFinite(record.ubicacionLng);

  const mapCenter = hasCoordinates
    ? { lat: Number(record.ubicacionLat), lng: Number(record.ubicacionLng) }
    : { lat: -33.4489, lng: -70.6693 };

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places", "drawing"],
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ================= Columna izquierda ================= */}
        <div className="space-y-6">
          {/* DETALLE */}
          <Card
            title="DETALLE"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-x-4 gap-y-5">
              {/* Nombre */}
              <span className="col-span-1 text-sm text-gray-600">Nombre</span>
              <div className="col-span-5">
                <input
                  type="text"
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.nombre}
                  onChange={(e) => set("nombre")(e.target.value)}
                />
              </div>

              {/* Ref ID */}
              <span className="col-span-1 text-sm text-gray-600">Ref ID</span>
              <div className="col-span-5">
                <input
                  type="text"
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.refId || ""}
                  onChange={(e) => set("refId")(e.target.value)}
                  placeholder=""
                />
              </div>

              {/* Location */}
              <span className="col-span-1 text-sm text-gray-600">Location</span>
              <div className="col-span-5">
                <CollapsibleField
                  label=""
                  value=""
                  options={locationLabels}
                  onChange={(v) => {
                    const opt = locationOptions.find((o) => o.label === String(v) || o.value === String(v));
                    set("location")(opt?.value || String(v));
                  }}
                  inline
                />
                {record.location && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Chip>
                      {getLocationLabel(record.location)}
                      <button type="button" onClick={() => set("location")("")} className="ml-1 text-gray-500 hover:text-gray-700" title="Quitar">×</button>
                    </Chip>
                  </div>
                )}
                {optionsLoading && locationLabels.length === 0 && <LoadingHint />}
              </div>

              {/* Tienda */}
              <span className="col-span-1 text-sm text-gray-600">Tienda</span>
              <div className="col-span-5">
                <CollapsibleField
                  label=""
                  value=""
                  options={storeLabels}
                  onChange={(v) => {
                    const opt = storeOptions.find((o) => o.label === String(v) || o.value === String(v));
                    set("tiendaNombre")(opt?.value || String(v));
                  }}
                  inline
                />
                {record.tiendaNombre && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Chip>
                      {getStoreLabel(record.tiendaNombre)}
                      <button type="button" onClick={() => set("tiendaNombre")("")} className="ml-1 text-gray-500 hover:text-gray-700" title="Quitar">×</button>
                    </Chip>
                  </div>
                )}
                {optionsLoading && storeLabels.length === 0 && <LoadingHint />}
              </div>

              {/* Zona horaria */}
              <span className="col-span-1 text-sm text-gray-600">Zona horaria</span>
              <div className="col-span-5">
                <div className="flex items-center justify-between border-b border-gray-300 py-1">
                  <span className="text-sm text-gray-800">America/Chile/Santiago</span>
                  <span className="text-xs text-gray-500">Fija</span>
                </div>
              </div>

              {/* Canales de venta (chips + selector inline) */}
              <span className="col-span-1 text-sm text-gray-600">Canales de venta</span>
              <div className="col-span-5">
                <div className="flex flex-col gap-2">
                  <CollapsibleField
                    label=""
                    value=""
                    options={salesChannelLabels}
                    onChange={(v) => addCanal(String(v))}
                    inline
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {record.canalesVenta?.map((g, idx) => (
                      <Chip key={g || `canal-${idx}`}>
                        {getSalesChannelLabel(g)}
                        <button
                          type="button"
                          onClick={() => removeCanal(g)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                          title="Quitar"
                        >
                          ×
                        </button>
                      </Chip>
                    ))}
                  </div>
                </div>
                {optionsLoading && salesChannelLabels.length === 0 && <LoadingHint />}
              </div>

              {/* Prioridad */}
              <span className="col-span-1 text-sm text-gray-600">Prioridad</span>
              <div className="col-span-5">
                <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-3 py-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Nivel de prioridad</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityValue <= 3
                        ? "bg-emerald-50 text-emerald-700"
                        : priorityValue <= 7
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                        }`}
                    >
                      {priorityValue} · {priorityLabel}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={priorityValue}
                    onChange={(e) => set("prioridad")(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgb(37 99 235), rgb(59 130 246))",
                      backgroundSize: `${priorityPercent}% 100%`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={`priority-${i + 1}`} className="w-3 text-center">
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Esquema horario */}
              <span className="col-span-1 text-sm text-gray-600">Esquema horario</span>
              <div className="col-span-5">
                <CollapsibleField
                  label=""
                  value=""
                  options={windowSchemaLabels}
                  onChange={(v) => {
                    const opt = windowSchemaOptions.find((o) => o.label === String(v) || o.value === String(v));
                    set("esquemaHorario")(opt?.value || String(v));
                  }}
                  inline
                />
                {record.esquemaHorario && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Chip>
                      {getWindowSchemaLabel(record.esquemaHorario)}
                      <button type="button" onClick={() => set("esquemaHorario")("")} className="ml-1 text-gray-500 hover:text-gray-700" title="Quitar">×</button>
                    </Chip>
                  </div>
                )}
                {optionsLoading && windowSchemaLabels.length === 0 && <LoadingHint />}
              </div>

              {/* Esquema de picking */}
              <span className="col-span-1 text-sm text-gray-600">Esquema de picking</span>
              <div className="col-span-5">
                <CollapsibleField
                  label=""
                  value=""
                  options={pickingSchemaLabels}
                  onChange={(v) => {
                    const opt = pickingSchemaOptions.find((o) => o.label === String(v) || o.value === String(v));
                    set("esquemaPicking")(opt?.value || String(v));
                  }}
                  inline
                />
                {record.esquemaPicking && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Chip>
                      {getPickingSchemaLabel(record.esquemaPicking)}
                      <button type="button" onClick={() => set("esquemaPicking")("")} className="ml-1 text-gray-500 hover:text-gray-700" title="Quitar">×</button>
                    </Chip>
                  </div>
                )}
                {optionsLoading && pickingSchemaLabels.length === 0 && <LoadingHint />}
              </div>

              {/* Estado */}
              <span className="col-span-1 text-sm text-gray-600">Estado</span>
              <div className="col-span-5">
                <ActiveStatusToggle
                  active={record.estado === "Activo"}
                  onActiveChange={(active) => set("estado")(active ? "Activo" : "Inactivo")}
                  showStateLabel={false}
                />
              </div>
            </div>
          </Card>

          {/* RONDAS */}
          <Card
            title="RONDAS"
            icon={TagIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-blue-700">Pedidos / Ronda</div>
                  <div className="mt-1 text-base font-semibold text-blue-900">
                    {defaultOrdersPerRound} / {maxOrdersPerRound || "-"}
                  </div>
                </div>
                <div className="rounded-lg border border-cyan-100 bg-cyan-50/70 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-cyan-700">Items / Ronda</div>
                  <div className="mt-1 text-base font-semibold text-cyan-900">
                    {defaultItemsPerRound} / {maxItemsPerRound || "-"}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                  <div className="text-xs uppercase tracking-wide text-emerald-700">Capacidad Total</div>
                  <div className="mt-1 text-base font-semibold text-emerald-900">{maxOrdersTotal || "Sin límite"}</div>
                </div>
              </div>

              {(hasOrdersRangeWarning || hasItemsRangeWarning) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Revisa los límites: el valor default no debería superar el valor máximo por ronda.
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">Límite default de pedidos por ronda</label>
                  <p className="mt-1 text-xs text-gray-500">Base inicial sugerida para la creación de rondas.</p>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={record.limiteDefaultPedidosRonda1 ?? ""}
                    onChange={(e) => set("limiteDefaultPedidosRonda1")(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">Límite máximo de pedidos por ronda</label>
                  <p className="mt-1 text-xs text-gray-500">Tope operativo permitido para cada ronda.</p>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={record.limitePedidosRonda2 ?? ""}
                    onChange={(e) => set("limitePedidosRonda2")(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">Límite default de ítems por ronda</label>
                  <p className="mt-1 text-xs text-gray-500">Cantidad estándar de ítems por defecto.</p>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={record.limiteDefaultItemsRonda ?? ""}
                    onChange={(e) => set("limiteDefaultItemsRonda")(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">Límite máximo de ítems por ronda</label>
                  <p className="mt-1 text-xs text-gray-500">Tope de carga de ítems para cada ronda.</p>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={record.limiteItemsRonda ?? ""}
                    onChange={(e) => set("limiteItemsRonda")(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">Cantidad mínima de unidades por pedido</label>
                  <p className="mt-1 text-xs text-gray-500">Evita pedidos muy pequeños en la ronda.</p>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={record.cantidadMinimaUnidadesPorPedido ?? ""}
                    onChange={(e) => set("cantidadMinimaUnidadesPorPedido")(e.target.value)}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">Cantidad máxima de unidades por pedido</label>
                  <p className="mt-1 text-xs text-gray-500">Limita pedidos demasiado grandes por unidad.</p>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={record.cantidadMaximaUnidadesPorPedido ?? ""}
                    onChange={(e) => set("cantidadMaximaUnidadesPorPedido")(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <label className="text-sm font-medium text-gray-700">Cantidad máxima de pedidos total</label>
                <p className="mt-1 text-xs text-gray-500">Capacidad máxima acumulada para el punto de picking.</p>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={record.cantidadMaximaPedidos ?? ""}
                  onChange={(e) => set("cantidadMaximaPedidos")(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="mb-2 text-sm font-medium text-gray-700">Limitar rondas por transportista</div>
                  <ActiveStatusToggle
                    active={!!record.limitarRondasPorTransportista}
                    onActiveChange={(active) => set("limitarRondasPorTransportista")(active)}
                    showStateLabel={false}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="mb-2 text-sm font-medium text-gray-700">Optimizar agrupamiento de pedidos en rondas</div>
                  <ActiveStatusToggle
                    active={!!record.optimizarAgrupamientoRondas}
                    onActiveChange={(active) => set("optimizarAgrupamientoRondas")(active)}
                    showStateLabel={false}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ================= Columna derecha ================= */}
        <div className="space-y-6">
          {/* UBICACIÓN */}
          <Card
            title="UBICACIÓN"
            icon={MapPinIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="text-sm text-gray-600">{record.ubicacionTexto || "Selecciona una ubicación para ver el mapa."}</div>
            <div className="mt-4 h-[36rem] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {!hasCoordinates ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-500">
                  Sin coordenadas disponibles para esta ubicación.
                </div>
              ) : mapLoadError ? (
                <div className="flex h-full items-center justify-center text-xs text-red-500">
                  No se pudo cargar Google Maps.
                </div>
              ) : !isMapLoaded ? (
                <div className="h-full w-full animate-pulse bg-gray-100" />
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={16}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
              )}
            </div>
          </Card>

          {/* USUARIO CREADOR */}
          {!isCreate && (
            <Card
              title="USUARIO CREADOR"
              icon={UserCircleIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={record.creador?.name || "Usuario"}
                    className="h-8 w-8 bg-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{record.creador?.name || "—"}</span>
                    <span className="text-xs text-gray-500">{record.creador?.email || "—"}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{fmt(record.fechaCreacion)}</span>
              </div>
            </Card>
          )}

          {/* ÚLTIMA MODIFICACIÓN */}
          {!isCreate && (
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={PencilSquareIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={record.modificador?.name || "Usuario"}
                    className="h-8 w-8 bg-gray-400"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{record.modificador?.name || "—"}</span>
                    <span className="text-xs text-gray-500">{record.modificador?.email || "—"}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{fmt(record.fechaModificacion)}</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default PickingPointFields;
