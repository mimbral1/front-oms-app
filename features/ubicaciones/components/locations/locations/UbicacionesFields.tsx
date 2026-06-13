// views\Ubicaciones\Locations\Locations\components\UbicacionesFields.tsx

"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  PencilIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { MapaDireccion } from "@/features/pedidos/components/detalles-pedido/MapaDireccion";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { Trash2Icon } from "lucide-react";

export type LocationStatus = "active" | "inactive";

export interface ApiLocation {
  id?: number;                // opcional en "nuevo"
  storeId: number;
  name: string;
  phoneNumber?: string;
  country: string;
  stateProvince: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;

  dateCreatedCL?: string;
  dateModifiedCL?: string;
  userCreatedProfile?: {
    email?: string;
    nombres?: string;
    apellidos?: string;
    urlImagenPerfil?: string;
  };
  userModifiedProfile?: {
    email?: string;
    nombres?: string;
    apellidos?: string;
    urlImagenPerfil?: string;
  };

  status: LocationStatus;
  user?: string | number;

  created?: {
    username: string;
    email: string;
    avatar?: string;
    date: string;
  };

  modified?: {
    username: string;
    email: string;
    avatar?: string;
    date: string;
  };

  warehouses?: {
    code: string;                 // warehouse.code
    name?: string;                // solo para UI
    referenceId?: string;
    group?: string;
    status: "active" | "inactive";

    tasks: string[];              // codes
    salesChannels: string[];      // referenceId
    limitedToSellers: string[];   // seller.id (string)
  }[];
}

export default function LocationFields({
  record,
  onChange,
  isNew,
  warehousesOpts,
  tasksOpts,
  sellersOpts,
  salesChannelsOpts,
  onAddWarehouse,
  onRemoveWarehouse,
  onUpdateWarehouse,
  storeOpts,
  storeSearch,
  onStoreSearch
}: {
  record: ApiLocation;
  onChange?: <K extends keyof ApiLocation>(field: K, value: ApiLocation[K]) => void;

  // ===== SOLO PARA NUEVO =====
  isNew?: boolean;
  warehousesOpts?: { label: string; value: string }[];
  tasksOpts?: { label: string; value: string }[];
  sellersOpts?: { label: string; value: string }[];
  salesChannelsOpts?: { label: string; value: string }[];

  // stores
  storeOpts?: { label: string; value: string }[];
  storeSearch?: string;
  onStoreSearch?: (q: string) => void;

  onAddWarehouse?: () => void;
  onRemoveWarehouse?: (index: number) => void;
  onUpdateWarehouse?: (
    index: number,
    field: "tasks" | "salesChannels" | "limitedToSellers",
    value: string[]
  ) => void;
}) {
  const handle =
    <K extends keyof ApiLocation>(field: K) =>
      (value: ApiLocation[K]) =>
        onChange?.(field, value);

  // Dirección a mostrar en el mapa: prioriza lo buscado; si no, arma desde los campos
  const addressToGeocode = useMemo(() => {
    return [
      record.addressLine1,
      record.addressLine2 || "",
      record.city,
      record.stateProvince,
      record.country,
      record.postalCode,
    ]
      .filter(Boolean)
      .join(", ")
      .trim();
  }, [
    record.addressLine1,
    record.addressLine2,
    record.city,
    record.stateProvince,
    record.country,
    record.postalCode,
  ]);

  /* ===================== UI ===================== */
  return (
    <div className="space-y-6">
      {/* GRID PRINCIPAL: 2 columnas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* IZQUIERDA */}
        <div className="lg:col-span-4 space-y-6">
          {/* card detalle  */}
          <Card
            title="DETALLE"
            icon={ClipboardDocumentListIcon}
            hasTitleDivider
            noDefaultStyles
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* Nombre */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.name}
                  onChange={(e) => handle("name")(e.target.value)}
                  placeholder="Nombre de la ubicación"
                />
              </div>

              {/* Store */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Tienda</span>
              <div className="col-span-5">
                <SelectSearchInline
                  id="store"
                  label="Tienda"
                  options={storeOpts ?? []}
                  value={record.storeId ? String(record.storeId) : ""}
                  searchQuery={storeSearch ?? ""}
                  onSearch={onStoreSearch ?? (() => { })}
                  onChange={(value) => {
                    if (!value) return;
                    handle("storeId")(Number(value));
                  }}
                />
              </div>

              {/* Estado */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
              <div className="col-span-5">
                <select
                  className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                  value={record.status}
                  onChange={(e) =>
                    handle("status")(e.target.value as LocationStatus)
                  }
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              {/* Teléfono */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Teléfono</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.phoneNumber || ""}
                  onChange={(e) => handle("phoneNumber")(e.target.value)}
                  placeholder="Teléfono de contacto"
                />
              </div>
            </div>
          </Card>

          {/* warehouses */}
          {isNew && (
            <Card
              title="ALMACENES"
              icon={ClipboardDocumentListIcon}
              hasTitleDivider
              noDefaultStyles
              className="rounded-xl p-6"
            >
              {/* Bloques de almacenes */}
              <div className="space-y-6">
                {(record.warehouses ?? []).map((wh, index) => (
                  <div
                    key={`warehouse-${index}`}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    {/* Header almacén */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        Almacén {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemoveWarehouse?.(index)}
                        className="text-gray-400 hover:text-red-600"
                        title="Eliminar almacén"
                      >
                        <Trash2Icon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Selector almacén */}
                    <SelectSearchInline
                      id={`warehouse-${index}`}
                      label="Almacén"
                      options={warehousesOpts ?? []}
                      value={wh.code}
                      searchQuery=""
                      onSearch={() => { }}
                      onChange={(value, label) => {
                        if (!value) return;

                        onChange?.(
                          "warehouses",
                          (record.warehouses ?? []).map((w, i) =>
                            i === index
                              ? {
                                ...w,
                                code: value,
                                name: label ?? value,
                              }
                              : w
                          )
                        );
                      }}
                    />

                    {/* TASKS */}
                    <span className="text-xs text-gray-600 font-semibold">Tareas</span>
                    <SelectSearchInline
                      id={`tasks-${index}`}
                      label="Tareas"
                      options={tasksOpts ?? []}
                      value=""
                      searchQuery=""
                      onSearch={() => { }}
                      onChange={(value) => {
                        if (!value) return;
                        if (!wh.tasks.includes(value)) {
                          onUpdateWarehouse?.(index, "tasks", [...wh.tasks, value]);
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {(wh.tasks ?? []).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                        >
                          {tasksOpts?.find(o => o.value === t)?.label ?? t}
                          <button
                            type="button"
                            className="ml-2 text-gray-500 hover:text-gray-800"
                            onClick={() =>
                              onUpdateWarehouse?.(
                                index,
                                "tasks",
                                wh.tasks.filter((x) => x !== t)
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* SALES CHANNELS */}
                    <span className="text-xs text-gray-600 font-semibold">
                      Canales de venta
                    </span>
                    <SelectSearchInline
                      id={`sales-${index}`}
                      label="Canales de venta"
                      options={salesChannelsOpts ?? []}
                      value=""
                      searchQuery=""
                      onSearch={() => { }}
                      onChange={(value) => {
                        if (!value) return;
                        if (!wh.salesChannels.includes(value)) {
                          onUpdateWarehouse?.(
                            index,
                            "salesChannels",
                            [...wh.salesChannels, value]
                          );
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {(wh.salesChannels ?? []).map((sc) => (
                        <span
                          key={sc}
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                        >
                          {salesChannelsOpts?.find(o => o.value === sc)?.label ?? sc}
                          <button
                            type="button"
                            className="ml-2 text-gray-500 hover:text-gray-800"
                            onClick={() =>
                              onUpdateWarehouse?.(
                                index,
                                "salesChannels",
                                wh.salesChannels.filter((x) => x !== sc)
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* SELLERS */}
                    <span className="text-xs text-gray-600 font-semibold">
                      Vendedores permitidos
                    </span>
                    <SelectSearchInline
                      id={`sellers-${index}`}
                      label="Vendedores permitidos"
                      options={sellersOpts ?? []}
                      value=""
                      searchQuery=""
                      onSearch={() => { }}
                      onChange={(value) => {
                        if (!value) return;
                        if (!wh.limitedToSellers.includes(value)) {
                          onUpdateWarehouse?.(
                            index,
                            "limitedToSellers",
                            [...wh.limitedToSellers, value]
                          );
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {(wh.limitedToSellers ?? []).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                        >
                          {sellersOpts?.find(o => o.value === s)?.label ?? s}
                          <button
                            type="button"
                            className="ml-2 text-gray-500 hover:text-gray-800"
                            onClick={() =>
                              onUpdateWarehouse?.(
                                index,
                                "limitedToSellers",
                                wh.limitedToSellers.filter((x) => x !== s)
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>


              {/* Botón agregar almacén (AL FINAL) */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => onAddWarehouse?.()}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  + Agregar almacén
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* DERECHA: dirección + mapa */}
        <div className="lg:col-span-3 space-y-6">
          {/* card direccion  */}
          <Card
            title="DIRECCIÓN"
            icon={MapPinIcon}
            hasTitleDivider
            noDefaultStyles
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* addressLine1 */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Calle</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.addressLine1}
                  onChange={(e) => handle("addressLine1")(e.target.value)}
                  placeholder="Calle y número"
                />
              </div>

              {/* addressLine2 */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Detalle dirección
              </span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.addressLine2 || ""}
                  onChange={(e) => handle("addressLine2")(e.target.value)}
                  placeholder="Piso / Depto / Local"
                />
              </div>

              {/* postalCode */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Código postal
              </span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.postalCode}
                  onChange={(e) => handle("postalCode")(e.target.value)}
                  placeholder="C.P."
                />
              </div>

              {/* city */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Ciudad</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.city}
                  onChange={(e) => handle("city")(e.target.value)}
                  placeholder="Ciudad"
                />
              </div>

              {/* stateProvince */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Región
              </span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.stateProvince}
                  onChange={(e) => handle("stateProvince")(e.target.value)}
                  placeholder="Provincia / Región"
                />
              </div>

              {/* country */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">País</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.country}
                  onChange={(e) => handle("country")(e.target.value)}
                  placeholder="País"
                />
              </div>
            </div>
            {/* Mapa: usa SIEMPRE el componente ya hecho */}
            <div className="mt-6">
              {/* Mapa: solo si hay algo para geocodificar */}
              {addressToGeocode ? (
                <div className="mt-6">
                  <MapaDireccion direccion={addressToGeocode} />
                  <div className="mt-2 text-xs text-gray-500">{addressToGeocode}</div>
                </div>
              ) : (
                <div className="mt-6 rounded border bg-gray-50 p-4 text-sm text-gray-600">
                  Completa la dirección para ubicar en el mapa.
                </div>
              )}
            </div>
          </Card>
          {record.id && (
            <>
              {/* card usuario creador  */}
              <Card
                title="USUARIO CREADOR"
                icon={UserIcon}
                noDefaultStyles
                hasTitleDivider
                className="rounded-xl p-6"
              >
                {record.created ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {record.created.avatar ? (
                        <Image
                          src={record.created.avatar}
                          width={28}
                          height={28}
                          unoptimized
                          className="h-7 w-7 rounded-full object-cover"
                          alt="Avatar usuario creador"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                          {(record.created.username.match(/\b\w/g) || [])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {record.created.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {record.created.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {record.created.date}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">—</div>
                )}
              </Card>
            </>
          )}
          {/* card ultima modificacion  */}
          {record.id && record.modified && (
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={PencilIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {record.modified.avatar ? (
                    <Image
                      src={record.modified.avatar}
                      width={28}
                      height={28}
                      unoptimized
                      className="h-7 w-7 rounded-full object-cover"
                      alt="Avatar usuario modificador"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                      {(record.modified.username.match(/\b\w/g) || [])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {record.modified.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {record.modified.email}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {record.modified.date}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}