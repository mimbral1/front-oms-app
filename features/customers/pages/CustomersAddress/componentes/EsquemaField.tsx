// app/views/Almacen/Gestion/Ingreso/components/SchemeFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  PencilIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Scheme } from "../Resumen/CustomerAddressResumenView";
//import { Toggle } from "@/components/ui/togle/togle";
import { FieldRow } from "./FieldRow/FieldRow";

interface SchemeFieldsProps {
  scheme: Scheme;
  isReadOnly?: boolean;
  onChange?: <K extends keyof Scheme>(field: K, value: Scheme[K]) => void;
}
export const SchemeFields: React.FC<SchemeFieldsProps> = ({
  scheme,
  isReadOnly: isRO,
  onChange,
}) => {
  const isReadOnly = isRO ?? !onChange;
  const handle =
    <K extends keyof Scheme>(field: K) =>
      (value: Scheme[K]) => {
        onChange?.(field, value);
      };
  const isNew = !scheme.createdBy.username;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── COLUMNA IZQUIERDA: DETALLE ─── */}
        <div className="lg:col-span-2">
          <Card
            title="DETALLE"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="space-y-6">
              {/* nombre ------------------------------------------------------- */}
              <FieldRow label="Nombre">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.CustomerName}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.CustomerName}
                    onChange={(e) =>
                      handle("CustomerName")(e.target.value as any)
                    }
                  />
                )}
              </FieldRow>

              {/* descripción -------------------------------------------------- */}
              <FieldRow label="País">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.country}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.country}
                    onChange={(e) => handle("country")(e.target.value as any)}
                  />
                )}
              </FieldRow>
              <FieldRow label="Región">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.state}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.state}
                    onChange={(e) => handle("country")(e.target.value as any)}
                  />
                )}
              </FieldRow>
              <FieldRow label="Ciudad">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.city}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.city}
                    onChange={(e) => handle("city")(e.target.value as any)}
                  />
                )}
              </FieldRow>
              <FieldRow label="Barrio">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.neighborhood}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.neighborhood}
                    onChange={(e) =>
                      handle("neighborhood")(e.target.value as any)
                    }
                  />
                )}
              </FieldRow>
              <FieldRow label="Código postal">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.postalCode}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.postalCode}
                    onChange={(e) =>
                      handle("postalCode")(e.target.value as any)
                    }
                  />
                )}
              </FieldRow>
              <FieldRow label="Calle">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.street}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.street}
                    onChange={(e) => handle("street")(e.target.value as any)}
                  />
                )}
              </FieldRow>
              <FieldRow label="Número">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.number}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.number}
                    onChange={(e) => handle("number")(e.target.value as any)}
                  />
                )}
              </FieldRow>
              <FieldRow label="Complemento">
                {isReadOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {scheme.complement}
                  </span>
                ) : (
                  <input
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                    value={scheme.complement}
                    onChange={(e) => handle("number")(e.target.value as any)}
                  />
                )}
              </FieldRow>
              <FieldRow label="Lat">
                {isReadOnly ? (
                  // mostramos con coma si queremos
                  <span className="text-sm text-gray-900">
                    {scheme.latitude.toString().replace(".", ",")}
                  </span>
                ) : (
                  <input
                    type="text"
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    value={scheme.latitude.toString().replace(".", ",")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // reemplazamos coma por punto
                      const normalized = raw.replace(",", ".");
                      const num = parseFloat(normalized);
                      handle("latitude")(isNaN(num) ? 0 : num);
                    }}
                  />
                )}
              </FieldRow>
              <FieldRow label="Lng">
                {isReadOnly ? (
                  <span className="text-sm text-gray-900">
                    {scheme.longitude.toString().replace(".", ",")}
                  </span>
                ) : (
                  <input
                    type="text"
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    value={scheme.longitude.toString().replace(".", ",")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const normalized = raw.replace(",", ".");
                      const num = parseFloat(normalized);
                      handle("longitude")(isNaN(num) ? 0 : num);
                    }}
                  />
                )}
              </FieldRow>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <>
            {/* Usuario creador (solo lectura) */}
            <Card
              title="OTROS"
              icon={Cog6ToothIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="grid grid-cols-6 gap-4">
                <span className="col-span-1 text-sm text-black-600 font-bold">Status</span>
                <div className="col-span-5">
                  {isReadOnly ? (
                    <span className="text-sm text-black-900">{scheme.status}</span>
                  ) : (
                    <select
                      value={scheme.status}
                      onChange={e => handle("status")(e.target.value as any)}
                      className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
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
              {/* Usuario creador */}
              <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                {/* CHIP del usuario (ocupa 5 columnas) */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                      {scheme.createdBy.username.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-blue-600">{scheme.createdBy.username}</div>
                      <div className="text-gray-500 truncate max-w-[200px]">{scheme.createdBy.email}</div>
                    </div>
                  </div>
                </div>

                {/* Fecha (columna 6) */}
                <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                  12/11/2021 16:41:48
                </div>
              </div>
            </Card>

            {/* Última modificación */}
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={PencilIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              {/* Usuario creador */}
              <div className="grid grid-cols-6 gap-4 mt-6 items-center">
                {/* CHIP del usuario (ocupa 5 columnas) */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                      {scheme.createdBy.username.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold text-blue-600">{scheme.createdBy.username}</div>
                      <div className="text-gray-500 truncate max-w-[200px]">{scheme.createdBy.email}</div>
                    </div>
                  </div>
                </div>

                {/* Fecha (columna 6) */}
                <div className="col-span-3 text-sm text-gray-500 text-right truncate">
                  15/11/2021 13:24:57
                </div>
              </div>
            </Card>
          </>
        </div>
      </div>
    </div>
  );
};
