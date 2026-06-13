// src/components/ResumenEnvio/ShipmentSummary.tsx
"use client";

import React from "react";
import {
  ClockIcon,
  DocumentDuplicateIcon,
  TruckIcon,
  MapPinIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import Select from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill/StatusPill";
import { ResumenEnvio } from "@/features/pedidos/types/resumenenvio";
import { fmtDateTimeParts } from "@/lib/format/date";
import DateTimePickerField from "@/components/ui/date-time-picker/DateTimePickerField";

/* export interface ResumenEnvio {
  id: string;
  status: "Creada" | "Programada" | "Iniciado" | "Arribado" | "Entregado";
  statusVariant: "success" | "warning" | "info" | "error";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  carrier: string;
  route: string;
  routePending: boolean;
  pendingPackages: boolean;
  readyToPickup: boolean;
  ordersCount: string;
  totalAmount: string;
  currency: string;
  paymentMethod: string;
  pickup: Record<string, string>;
  dropoff: Record<string, string>;
  verification: { verified: boolean; failedAttempts: number };
  trackingHistory: Array<{
    trackingNumber: string;
    events: Array<{
      status: ResumenEnvio["status"];
      date: string;
      time: string;
      receiver?: string;
    }>;
  }>;
  signatureUrl: string;
} */

interface FieldProps {
  label: string;
  value: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="max-w-[68%] break-words text-right text-sm font-medium text-gray-900">{value}</span>
  </div>
);

const fmtDateTime = fmtDateTimeParts;

const dateTimeLocalToIso = (value: string) => {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

const editableInputClass = "border-0 border-b border-gray-300 bg-transparent px-1 py-0.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";
const editableDateClass = "w-[22rem]";
const editableWideClass = `w-44 ${editableInputClass}`;
const editableSelectClass = "w-44";
const editableAddressClass = `min-w-[12rem] w-full ${editableInputClass} resize-none overflow-hidden whitespace-pre-wrap`;
const editableSmallClass = `w-24 ${editableInputClass}`;
const editableTinyClass = `w-20 ${editableInputClass}`;

const AutoGrowTextarea = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) => {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      className={className}
    />
  );
};

interface Props {
  shipment: ResumenEnvio;
  editable?: boolean;
  onChange?: (next: ResumenEnvio) => void;
  carrierOptions?: Array<{ id: string; name: string }>;
}

// Mapeo de claves en inglés a español para la sección de PICKUP
const pickupFieldTranslations: Record<string, string> = {
  company: "Empresa",
  docType: "Tipo de Documento",
  docNumber: "Número de Documento",
  phone: "Teléfono",
  email: "Correo Electrónico",
  address: "Dirección",
  city: "Ciudad",
  postalCode: "Código Postal",
  province: "Provincia",
  country: "País",
};

// Mapeo de claves en inglés a español para la sección de DROPOFF
const dropoffFieldTranslations: Record<string, string> = {
  name: "Nombre",
  surname: "Apellido",
  docType: "Tipo de Documento",
  docNumber: "Número de Documento",
  phone: "Teléfono",
  email: "Correo Electrónico",
  address: "Dirección",
  city: "Ciudad",
  postalCode: "Código Postal",
  province: "Provincia",
  country: "País",
};

export const ShipmentSummary: React.FC<Props> = ({ shipment, editable = false, onChange, carrierOptions = [] }) => {
  const updateShipment = (patch: Partial<ResumenEnvio>) => {
    if (!onChange) return;
    onChange({ ...shipment, ...patch });
  };

  const updatePickupField = (key: keyof ResumenEnvio["pickup"], value: string) => {
    if (!onChange) return;
    onChange({
      ...shipment,
      pickup: {
        ...shipment.pickup,
        [key]: value,
      },
    });
  };

  const updateDropoffField = (key: keyof ResumenEnvio["dropoff"], value: string) => {
    if (!onChange) return;
    onChange({
      ...shipment,
      dropoff: {
        ...shipment.dropoff,
        [key]: value,
      },
    });
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/** 1ª columna: DETALLE + PEDIDOS */}
      <div className="space-y-6">
        <Card
          title="DETALLE"
          icon={ClockIcon}
          hasTitleDivider
          roundedClass="rounded-xl"
        >
          <Field
            label="Inicio"
            value={
              editable ? (
                <div className={editableDateClass}>
                  <DateTimePickerField
                    value={shipment.scheduleStart || ""}
                    onChange={(next) => updateShipment({ scheduleStart: dateTimeLocalToIso(next) })}
                    showNowButton={false}
                    showClearDateButton={false}
                    compactTime
                    equalizeDateHeight
                  />
                </div>
              ) : (
                fmtDateTime(shipment.startDate, shipment.startTime)
              )
            }
          />
          <Field
            label="Finalización"
            value={
              editable ? (
                <div className={editableDateClass}>
                  <DateTimePickerField
                    value={shipment.scheduleEnd || ""}
                    onChange={(next) => updateShipment({ scheduleEnd: dateTimeLocalToIso(next) })}
                    showNowButton={false}
                    showClearDateButton={false}
                    compactTime
                    equalizeDateHeight
                  />
                </div>
              ) : (
                fmtDateTime(shipment.endDate, shipment.endTime)
              )
            }
          />
          <Field
            label="Transportista"
            value={
              editable ? (
                <Select
                  value={shipment.carrierId || ""}
                  onValueChange={(nextId) => {
                    const selected = carrierOptions.find((option) => option.id === nextId);
                    updateShipment({
                      carrierId: nextId || undefined,
                      carrier: selected?.name || "-",
                    });
                  }}
                  options={carrierOptions.map((option) => ({ value: option.id, label: option.name }))}
                  placeholder="Seleccionar transportista"
                  className={editableSelectClass}
                >
                </Select>
              ) : (
                <span className="text-blue-600 hover:underline cursor-pointer">
                  {shipment.carrier}
                </span>
              )
            }
          />
          <Field
            label="Ruta"
            value={
              editable ? (
                <input
                  type="text"
                  value={shipment.route}
                  onChange={(e) => updateShipment({ route: e.target.value })}
                  className={editableWideClass}
                />
              ) : (
                <span className="text-blue-600 hover:underline cursor-pointer">
                  {shipment.route}
                </span>
              )
            }
          />
          <Field
            label="Ruta pendiente"
            value={
              editable ? (
                <input
                  type="checkbox"
                  checked={shipment.routePending}
                  onChange={(e) => updateShipment({ routePending: e.target.checked })}
                  className="h-4 w-4"
                />
              ) : shipment.routePending ? (
                <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                  Sí
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                  No
                </span>
              )
            }
          />
          <Field
            label="Bultos pendientes"
            value={
              editable ? (
                <input
                  type="checkbox"
                  checked={shipment.pendingPackages}
                  onChange={(e) => updateShipment({ pendingPackages: e.target.checked })}
                  className="h-4 w-4"
                />
              ) : shipment.pendingPackages ? (
                <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                  Sí
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                  No
                </span>
              )
            }
          />
          <Field
            label="Listo para retirar"
            value={
              editable ? (
                <input
                  type="checkbox"
                  checked={shipment.readyToPickup}
                  onChange={(e) => updateShipment({ readyToPickup: e.target.checked })}
                  className="h-4 w-4"
                />
              ) : shipment.readyToPickup ? (
                <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                  Sí
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                  No
                </span>
              )
            }
          />
        </Card>

        <Card
          title="PEDIDOS"
          icon={DocumentDuplicateIcon}
          hasTitleDivider
          roundedClass="rounded-xl"
        >
          <Field
            label="Pedidos"
            value={
              <span className="text-blue-600 hover:underline cursor-pointer">
                {shipment.ordersCount}
              </span>
            }
          />
          <Field
            label="Importe del pedido"
            value={
              editable ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shipment.totalAmount}
                    onChange={(e) => updateShipment({ totalAmount: e.target.value })}
                    className={editableSmallClass}
                  />
                  <input
                    type="text"
                    value={shipment.currency}
                    onChange={(e) => updateShipment({ currency: e.target.value })}
                    className={editableTinyClass}
                  />
                </div>
              ) : (
                `${shipment.totalAmount} ${shipment.currency}`
              )
            }
          />
          <Field
            label="Método de pago"
            value={
              editable ? (
                <input
                  type="text"
                  value={shipment.paymentMethod}
                  onChange={(e) => updateShipment({ paymentMethod: e.target.value })}
                  className={editableWideClass}
                />
              ) : (
                shipment.paymentMethod
              )
            }
          />
        </Card>
      </div>

      {/** 2ª columna: PICKUP + DROPOFF */}
      <div className="space-y-6">
        <Card
          title="PICKUP"
          icon={TruckIcon}
          hasTitleDivider
          roundedClass="rounded-xl"
        >
          {Object.entries(shipment.pickup).map(([key, value]) => (
            <Field
              key={key}
              label={pickupFieldTranslations[key] || (key.charAt(0).toUpperCase() + key.slice(1))}
              value={
                editable ? (
                  key === "address" ? (
                    <AutoGrowTextarea
                      value={value || ""}
                      onChange={(next) => updatePickupField(key as keyof ResumenEnvio["pickup"], next)}
                      className={editableAddressClass}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value || ""}
                      onChange={(e) => updatePickupField(key as keyof ResumenEnvio["pickup"], e.target.value)}
                      className={editableWideClass}
                    />
                  )
                ) : (
                  value || "-"
                )
              }
            />
          ))}
        </Card>

        <Card
          title="DROPOFF"
          icon={MapPinIcon}
          hasTitleDivider
          roundedClass="rounded-xl"
        >
          {Object.entries(shipment.dropoff).map(([key, value]) => (
            <Field
              key={key}
              label={dropoffFieldTranslations[key] || (key.charAt(0).toUpperCase() + key.slice(1))}
              value={
                editable ? (
                  key === "address" ? (
                    <AutoGrowTextarea
                      value={value || ""}
                      onChange={(next) => updateDropoffField(key as keyof ResumenEnvio["dropoff"], next)}
                      className={editableAddressClass}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value || ""}
                      onChange={(e) => updateDropoffField(key as keyof ResumenEnvio["dropoff"], e.target.value)}
                      className={editableWideClass}
                    />
                  )
                ) : (
                  value || "-"
                )
              }
            />
          ))}
        </Card>
      </div>

      {/** 3ª columna: VERIFICACIÓN + SEGUIMIENTO */}
      <div className="space-y-6">
        <Card
          title="VERIFICACIÓN DE ENTREGA"
          icon={CheckCircleIcon}
          hasTitleDivider
          roundedClass="rounded-xl"
        >
          <Field
            label="Verificado"
            value={
              shipment.verification.verified ? (
                <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                  Sí
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                  No
                </span>
              )
            }
          />
          <Field
            label="Intentos fallidos"
            value={
              editable ? (
                <input
                  type="number"
                  value={shipment.verification.failedAttempts}
                  onChange={(e) =>
                    updateShipment({
                      verification: {
                        ...shipment.verification,
                        failedAttempts: Number(e.target.value || 0),
                      },
                    })
                  }
                  className={editableSmallClass}
                />
              ) : (
                shipment.verification.failedAttempts.toString()
              )
            }
          />
        </Card>

        <Card
          title="SEGUIMIENTO"
          icon={DocumentDuplicateIcon}
          hasTitleDivider
          roundedClass="rounded-xl"
        >
          {shipment.trackingHistory.length === 0 ? (
            <div className="py-2 text-sm text-gray-500">
              Este envio no tiene eventos de seguimiento.
            </div>
          ) : (
            shipment.trackingHistory.map((h) => (
              <div key={h.trackingNumber} className="space-y-4">
                {/* Tracking # */}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Tracking #
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {h.trackingNumber}
                  </span>
                </div>
                <hr className="border-t border-gray-200" />

                {h.events.length === 0 ? (
                  <div className="py-2 text-sm text-gray-500">
                    Este envio no tiene eventos de seguimiento.
                  </div>
                ) : (
                  h.events.map((ev, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">
                          Estado
                        </span>
                        <StatusPill status={ev.status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Fecha
                        </span>
                        <span className="text-sm text-gray-500">
                          {fmtDateTime(ev.date, ev.time)}
                        </span>
                      </div>
                      {ev.receiver && (
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Receptor
                          </span>
                          <span className="text-sm text-gray-500">
                            {ev.receiver}
                          </span>
                        </div>
                      )}
                      {idx !== h.events.length - 1 && (
                        <hr className="border-t border-gray-100" />
                      )}
                    </div>
                  ))
                )}

                <hr className="border-t border-gray-200" />

                {/* Firma */}
                <div className="mt-4 flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Firma</span>
                  {shipment.signatureUrl ? (
                    <img
                      src={shipment.signatureUrl}
                      alt="Firma"
                      className="w-full h-24 mt-2 object-contain"
                    />
                  ) : (
                    <span className="mt-2 text-sm text-gray-500">-</span>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};

export default ShipmentSummary;
