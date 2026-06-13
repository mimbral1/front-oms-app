"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon,
  PencilIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/format/money";

// Interfaz para la data de un precio base, ajustada para la API
export interface BasePrice {
  ItemCode: string; // SKU
  PriceList: string;
  ItemName: string; // Nombre del producto
  Price: string | null; // Precio base
  PriceIVA: string | null; // Precio con IVA, que corresponde a List Price
  Status: string; // Estado
  // CreatedAt: string;
  // UpdatedAt: string;
  created?: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
}

interface Props {
  record: BasePrice;
  readOnly?: boolean;
  onChange?: (field: keyof BasePrice, value: string) => void;
}

export const BasePriceFields: React.FC<Props> = ({
  record,
  readOnly = true,
  onChange,
}) => {
  const handle =
    (field: keyof BasePrice) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange?.(field, e.target.value);
      };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── MAIN (span 2 columnas) ─── */}
        <div className="lg:col-span-2">
          <Card
            title="MAIN"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="space-y-1">
              <div className="flex items-center">
              </div>
              <div className="flex items-center">
                <span className="w-1/6 text-sm text-gray-600 font-bold">Nombre del Producto</span>
                <div className="w-5/6 p-4">
                  {readOnly ? (
                    <span className="text-sm text-gray-900">
                      {record.ItemName || "—"}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={record.ItemName || ""}
                      onChange={handle("ItemName")}
                      className="w-full border-b border-gray-300 focus:outline-none focus:border-b-gray-700 active:border-b-gray-800 text-sm text-gray-900"
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className="w-1/6 text-sm text-gray-600 font-bold">Precio</span>
                <div className="w-5/6 p-4">
                  {readOnly ? (
                    <span className="text-sm text-gray-900">
                      {formatCurrency(record.Price)}
                    </span>
                  ) : (
                    <input
                      type="text"
                      // Mostramos el valor formateado, pero en el estado interno se maneja el numérico
                      value={record.Price !== null ? formatCurrency(record.Price) : ""}
                      onChange={handle("Price")}
                      className="w-full border-b border-gray-300 focus:outline-none focus:border-b-gray-700 active:border-b-gray-800 text-sm text-gray-900"
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className="w-1/6 text-sm text-gray-600 font-bold">Precio IVA</span>
                <div className="w-5/6 p-4">
                  {readOnly ? (
                    <span className="text-sm text-gray-900">
                      {formatCurrency(record.PriceIVA)}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={record.PriceIVA !== null ? formatCurrency(record.PriceIVA) : ""}
                      onChange={handle("PriceIVA")}
                      className="w-full border-b border-gray-300 focus:outline-none focus:border-b-gray-700 active:border-b-gray-800 text-sm text-gray-900"
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <span className="w-1/6 text-sm text-gray-600 font-bold">Lista de precio</span>
                <div className="w-5/6 p-4">
                  {readOnly ? (
                    <span className="text-sm text-gray-900">
                      {formatCurrency(record.PriceIVA)}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={record.PriceList || ""}
                      onChange={handle("PriceList")}
                      className="w-full border-b border-gray-300 focus:outline-none focus:border-b-gray-700 active:border-b-gray-800 text-sm text-gray-900"
                    />
                  )}
                </div>
              </div>
              {/* Campo de estado como select */}
              <div className="flex items-center">
                <span className="w-1/6 text-sm text-gray-600 font-bold">Estado</span>
                <div className="w-5/6 p-4">
                  {readOnly ? (
                    <span className="text-sm text-gray-900">
                      {record.Status || "—"}
                    </span>
                  ) : (
                    <select
                      value={record.Status || ""}
                      onChange={handle("Status")}
                      className="w-full border-b border-gray-300 focus:outline-none focus:border-b-gray-700 active:border-b-gray-800 text-sm text-gray-900"
                    >
                      <option value="Active">Activo</option>
                      <option value="Inactive">Inactivo</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── CREATOR / MODIFIED (columna derecha) ─── */}
        <div className="space-y-6">
          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <input
              type="text"
              placeholder="—"
              disabled
              className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
            />
          </Card>

          <Card
            title="ÚLTIMA MODIFICACIÓN"
            icon={PencilIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <input
              type="text"
              placeholder="—"
              disabled
              className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
