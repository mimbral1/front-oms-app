"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { CircleDollarSignIcon } from "lucide-react";

// La interfaz `Price` ha sido actualizada para coincidir con el mapeo de la API.
export interface Price {
  id?: string;
  sku: string;
  priceSheet: string;
  price: string;
  precioIva: string; // Renombrado de 'listPrice' a 'precioIva'
  costPrice?: string; // Ahora es opcional y no se usa
  minQuantity: string;
  dateFrom: string;
  timeFrom: string;
  dateTo: string;
  timeTo: string;
  status: string;
  created?: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
}

interface Props {
  record: Price;
  readOnly?: boolean;
  onChange?: (field: keyof Price, value: string) => void;
}

export const PriceFields: React.FC<Props> = ({
  record,
  readOnly = true,
  onChange,
}) => {
  const handle =
    (field: keyof Price) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange?.(field, e.target.value);
      };

  // La lógica para determinar si es un nuevo registro se mantiene, asumiendo que `created` no existe en un nuevo objeto.
  const isNew = !record.created?.username;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/** ─── LEFT (span 2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/** PRINCIPAL */}
          <Card
            title="PRINCIPAL"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-1 text-sm text-gray-600">Sku</span>
              <div className="col-span-5">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {record.sku}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={record.sku}
                    onChange={handle("sku")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>

              <span className="col-span-1 text-sm text-gray-600">
                Lista de precios
              </span>
              <div className="col-span-5">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {record.priceSheet}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={record.priceSheet}
                    onChange={handle("priceSheet")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
            </div>
          </Card>

          {/** PRECIO */}
          <Card
            title="PRECIO"
            icon={CircleDollarSignIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-1 text-sm text-gray-600">Price</span>
              <div className="col-span-5">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {record.price}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={record.price}
                    onChange={handle("price")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>

              <span className="col-span-1 text-sm text-gray-600">
                Precio IVA
              </span>
              <div className="col-span-5">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {record.precioIva}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={record.precioIva}
                    onChange={handle("precioIva")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
            </div>
          </Card>

          {/** VALIDO */}
          <Card
            title="VALIDO"
            icon={CalendarIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="flex justify-between space-x-6">
              {/* Fecha y hora "desde" */}
              <div className="w-1/2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Fecha desde</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      {readOnly ? (
                        <span className="text-sm text-gray-900">
                          {record.dateFrom}
                        </span>
                      ) : (
                        <input
                          type="date"
                          value={record.dateFrom}
                          onChange={handle("dateFrom")}
                          className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      {readOnly ? (
                        <span className="text-sm text-gray-900">
                          {record.timeFrom}
                        </span>
                      ) : (
                        <input
                          type="time"
                          value={record.timeFrom}
                          onChange={handle("timeFrom")}
                          className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fecha y hora "hasta" */}
              <div className="w-1/2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Fecha hasta</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      {readOnly ? (
                        <span className="text-sm text-gray-900">
                          {record.dateTo}
                        </span>
                      ) : (
                        <input
                          type="date"
                          value={record.dateTo}
                          onChange={handle("dateTo")}
                          className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <ClockIcon className="h-5 w-5 text-gray-400" />
                      {readOnly ? (
                        <span className="text-sm text-gray-900">
                          {record.timeTo}
                        </span>
                      ) : (
                        <input
                          type="time"
                          value={record.timeTo}
                          onChange={handle("timeTo")}
                          className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-1 text-sm text-gray-600">Cantidad mínima</span>
              <div className="col-span-5">
                {readOnly ? (
                  <span className="text-sm text-gray-900">
                    {record.minQuantity}
                  </span>
                ) : (
                  <input
                    type="number"
                    value={record.minQuantity}
                    onChange={handle("minQuantity")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/** ─── RIGHT COLUMN ─── */}
        <div className="space-y-6">
          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            {isNew ? (
              <span className="text-sm text-gray-500">—</span>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-900">
                    {record.created!.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {record.created!.date}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {record.created!.email}
                </span>
              </>
            )}
          </Card>

          <Card
            title="ÚLTIMA MODIFICACIÓN"
            icon={PencilIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            {record.modified ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-900">
                    {record.modified.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {record.modified.date}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {record.modified.email}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500">—</span>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
