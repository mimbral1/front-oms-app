// app/views/Almacen/Gestion/Ingreso/components/OrderFields.tsx
"use client";

import React, { useState } from "react";
import Card from "@/components/ui/card/Card";
import {
  HomeIcon,
  UserIcon,
  PencilIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { FaClipboardList } from "react-icons/fa";
import CodeBlock from "@/components/ui/code/CodeBlock";
import { Switch } from "@mui/material";

export interface Order {
  id?: string;
  inventory: string;
  slot: string;
  estimatedFrom: string;
  estimatedTo: string;
  deliveryNote: string;
  invoice: string;
  supplier: string;
  assignedTo: string;
  status: "Active" | "Inactive";
  items: {
    sku: string;
    quantity: string;
    batch?: string;
    elabDate?: string;
    expDate?: string;
  };
  created: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
  comments?: string;
}

export interface Slot {
  id?: string;
  inventory: string;
  schemaType: string;
  schemaName: string;
  positionCode: string;
  state: "ACTIVO" | "INACTIVO" | "PENDIENTE";
  config: {
    positionType: "Picking" | "Packing";
    allowMultipleSkus: boolean;
    allowSkuVariations: boolean;
    highRotation: boolean;
    pickingOrder: string;
  };
  created: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
  comments?: string;
}

interface OrderFieldsProps {
  order: Order;
  isReadOnly?: boolean;
  onChange?: (field: keyof Order, value: string) => void;
}

export interface SlotConfig {
  positionType: "Picking" | "Packing";
  allowMultipleSkus: boolean;
  allowSkuVariations: boolean;
  highRotation: boolean;
  pickingOrder: string;
}

interface SlotFieldsProps {
  slot: Slot;
  isReadOnly?: boolean;
  /** recibe el campo y su valor correcto: Slot[K] */
  onChange?: <K extends keyof Slot>(field: K, value: Slot[K]) => void;
}
export const SlotsFields: React.FC<SlotFieldsProps> = ({
  slot,
  isReadOnly,
  onChange,
}) => {
  const isisReadOnly = isReadOnly ?? !onChange;
  const handle =
    <K extends keyof Slot>(field: K) =>
    (value: Slot[K]) => {
      onChange?.(field, value);
    };

  const isNew = !slot.created.username;
  const [snippet, setSnippet] = useState(
    JSON.stringify(
      {
        Pasillo: slot.positionCode.split("-")[0] ?? "",
        Ubicacion: slot.positionCode.split("-")[1] ?? "",
        Altura: slot.positionCode.split("-")[2] ?? "",
      },
      null,
      2
    )
  );
  return (
    <div className="space-y-6">
      {/* ─── DETALLE ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="DETALLE"
            icon={FaClipboardList}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6 "
          >
            <div className="space-y-8">
              <div className="flex items-center border-b border-gray-300 pb-2">
                <span className="text-sm text-gray-600 mr-4">Inventario</span>
                <div className="flex items-center flex-1 gap-2">
                  <HomeIcon className="h-5 w-5 text-gray-400" />
                  {isReadOnly ? (
                    <a
                      href="#"
                      className="flex-1 text-sm font-medium text-blue-600  truncate"
                    >
                      {slot.inventory}
                    </a>
                  ) : (
                    <input
                      type="text"
                      value={slot.inventory}
                      onChange={(e) => handle("inventory")(e.target.value)}
                      className="flex-1 border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    />
                  )}
                </div>
                {/*  <div className="flex items-center gap-2 mr-2">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Slot de descarga
                  </span>
                </div>
                <div className="w-36">
                  {isReadOnly ? (
                    <span className="text-sm font-medium text-gray-900">
                      {order.slot || "—"}
                    </span>
                  ) : (
                    <CollapsibleField
                      label=""
                      value={order.slot}
                      options={["A1", "B2", "C3"]}
                      onChange={handle("slot")}
                    />
                  )}
                </div> */}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-between  pb-2">
                  <span className="text-sm text-gray-900">Esquema</span>
                  {isReadOnly ? (
                    <span className="text-sm font-medium text-blue-600">
                      {slot.schemaType}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={slot.schemaType}
                      onChange={(e) => handle("schemaType")(e.target.value)}
                      className="w-1/2 border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    />
                  )}
                </div>
                <div className="flex justify-between  pb-2">
                  <span className="text-sm text-gray-900">Tipo de Esquema</span>
                  {isReadOnly ? (
                    <span className="text-sm font-medium text-gray-700">
                      {slot.schemaName || "—"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={slot.schemaName}
                      onChange={(e) => handle("schemaName")(e.target.value)}
                      className="w-1/2 border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-between  pb-2">
                  <span className="text-sm text-gray-900">Posicion</span>
                  {isReadOnly ? (
                    <span className="text-sm font-medium text-gray-600 ">
                      {slot.positionCode}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={slot.positionCode}
                      onChange={(e) => handle("positionCode")(e.target.value)}
                      className="w-1/2 border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between  pb-2">
                  <span className="text-sm text-gray-600">Slot</span>
                  <div className={`mt-4 ${isReadOnly ? "ml-2" : ""} w-full `}>
                    <CodeBlock
                      code={snippet}
                      language="json"
                      editable={!isReadOnly}
                      onChange={(txt) => setSnippet(txt)}
                      className="w-full max-h-48 overflow-auto"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between  pb-2">
                  <div className="flex items-center gap-2 mr-2">
                    <span className=" text-gray-900">Estado</span>
                  </div>
                  <div className="w-full ml-6">
                    {isReadOnly ? (
                      <CollapsibleField
                        label=""
                        value={"ACTIVO"} //cambiar por slot.state
                        options={["ACTIVO", "INACTIVO", "PENDIENTE"]}
                        onChange={(v) => handle("state")(v as Slot["state"])}
                      />
                    ) : (
                      <CollapsibleField
                        label=""
                        value={slot.state}
                        options={["ACTIVO", "INACTIVO", "PENDIENTE"]}
                        onChange={(v) => handle("state")(v as Slot["state"])}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/*  <div className="grid grid-cols-2 gap-6 border-b border-gray-300 pb-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Remito #</span>
                  <span className="text-sm font-medium text-gray-900">
                    {order.deliveryNote}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Factura #</span>
                  <span className="text-sm font-medium text-gray-900">
                    {order.invoice}
                  </span>
                </div>
              </div> */}

              {/* <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-between border-b border-gray-300 pb-2">
                  <span className="text-sm text-gray-600">Proveedor</span>
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline"
                  >
                    {order.supplier}
                  </a>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-2">
                  <span className="text-sm text-gray-600">Asignado</span>
                  <span className="text-sm font-medium text-gray-900">
                    {order.assignedTo || "–"}
                  </span>
                </div>
              </div> */}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* <Card
            title="CREACIÓN"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                {order.created.username}
              </span>
              <span className="text-xs text-gray-500">
                {order.created.date}
              </span>
            </div>
            <span className="text-sm text-gray-500">{order.created.email}</span>
          </Card>

          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6 "
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                  {order.created.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {order.created.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {order.created.email}
                  </span>
                </div>
              </div>

              <span className="text-xs text-gray-500">
                {order.created.date}
              </span>
            </div>
          </Card> */}
          {isNew ? (
            <Card
              title="CONFIGURACIÓN"
              icon={Cog6ToothIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="space-y-4">
                {/* Usuario */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Usuario</label>
                  <select
                    value={slot.created.username}
                    onChange={(e) =>
                      handle("created")({
                        ...slot.created,
                        username: e.target.value,
                      })
                    }
                    className="mt-1 border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  >
                    <option value="">Seleccione...</option>
                    <option value="juan.perez">Juan Perez</option>
                    <option value="ana.lopez">Ana Lopez</option>
                    {/* … más opciones … */}
                  </select>
                </div>
                {/* Fecha */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Fecha</label>
                  <input
                    type="date"
                    value={slot.created.date}
                    onChange={(e) =>
                      handle("created")({
                        ...slot.created,
                        date: e.target.value,
                      })
                    }
                    className="mt-1 border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                </div>
                {/* Comentarios */}
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Comentarios</label>
                  <input
                    type="text"
                    value={slot.comments || ""}
                    onChange={(e) => handle("comments")(e.target.value)}
                    className="mt-1 border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    placeholder="Agrega algún comentario"
                  />
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Si ya existe creador, muestro los cards de sólo-lectura */}
              <Card
                title="CONFIGURACIÓN"
                icon={Cog6ToothIcon}
                noDefaultStyles
                hasTitleDivider
                className="rounded-xl p-6"
              >
                <div className="grid grid-cols-1 gap-6">
                  {/* Tipo de posición */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Tipo de posición
                    </span>
                    <div className="w-40">
                      <CollapsibleField
                        label=""
                        value={slot.config.positionType}
                        options={["Picking", "Packing"]}
                        onChange={(v) =>
                          handle("config")({
                            ...slot.config,
                            positionType: v as Slot["config"]["positionType"],
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Permitir múltiples SKUs */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Permitir múltiples SKUs
                    </span>
                    <Switch
                      checked={slot.config.allowMultipleSkus}
                      onChange={(_, checked) =>
                        handle("config")({
                          ...slot.config,
                          allowMultipleSkus: checked,
                        })
                      }
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Permitir variaciones de SKUs */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Permitir variaciones de SKUs
                    </span>
                    <Switch
                      checked={slot.config.allowSkuVariations}
                      onChange={(_, checked) =>
                        handle("config")({
                          ...slot.config,
                          allowSkuVariations: checked,
                        })
                      }
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Alta rotación */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">Alta rotación</span>
                    <Switch
                      checked={slot.config.highRotation}
                      onChange={(_, checked) =>
                        handle("config")({
                          ...slot.config,
                          highRotation: checked,
                        })
                      }
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Picking order */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">Picking order</span>
                    {isReadOnly ? (
                      <span className="text-sm text-gray-700">
                        {slot.config.pickingOrder || "–"}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={slot.config.pickingOrder}
                        onChange={(e) =>
                          handle("config")({
                            ...slot.config,
                            pickingOrder: e.target.value,
                          })
                        }
                        className="w-32 border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                      />
                    )}
                  </div>
                </div>
              </Card>

              <Card
                title="USUARIO CREADOR"
                icon={UserIcon}
                noDefaultStyles
                hasTitleDivider
                className="rounded-xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                      {slot.created.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {slot.created.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {slot.created.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {slot.created.date}
                  </span>
                </div>
              </Card>
            </>
          )}

          {slot.modified && (
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={PencilIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6 "
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-medium text-white">
                    {slot.modified.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {slot.modified.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {slot.modified.email}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {slot.modified.date}
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
