// app/views/Operaciones/Importaciones/components/ImportacionesFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";

/* --------------------------------------------------------------------------
   Interfaz (calcada al estilo de SalesChannelFields, sin readOnly: siempre editable)
--------------------------------------------------------------------------- */
export interface Importacion {
  id?: string;
  // PRINCIPAL
  service: string; // catalog, i18n, etc.
  entity: string; // category, translate, etc.
  fileName: string; // Archivo importado
  size: string; // 0.0003MB
  mimeType: string; // application/json, csv
  startDate: string; // 18/11/2021 15:09
  endDate: string; // 18/11/2021 15:09
  viewLink?: string; // /catalog/category/browse

  // TOTALES
  total: number;
  created: number;
  updated: number;
  notModified: number;
  error: number;

  // Usuarios (solo en Resumen)
  createdBy?: { username: string; email: string; date: string };
  lastModified?: { date: string };

  // Estado
  status?: "Processed" | "Processing" | "Error";
}

export function ImportacionesFields({
  record,
  onChange,
  isCreate = false,
}: {
  record: Importacion;
  onChange: (field: keyof Importacion, value: any) => void;
  isCreate?: boolean;
}) {
  const handle = (field: keyof Importacion) => (v: any) => onChange(field, v);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-4 space-y-6">
          {/* PRINCIPAL */}
          <Card
            title="PRINCIPAL"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* Servicio */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Servicio</span>
              <div className="col-span-5">
                <select
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.service}
                  onChange={(e) => handle("service")(e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  <option value="catalog">catalog</option>
                  <option value="i18n">i18n</option>
                </select>
              </div>

              {/* Entidad */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Entidad</span>
              <div className="col-span-5">
                <select
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.entity}
                  onChange={(e) => handle("entity")(e.target.value)}
                >
                  <option value="">Seleccione…</option>
                  <option value="category">category</option>
                  <option value="translate">translate</option>
                </select>
              </div>

              {/* Archivo importado */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Archivo importado</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.fileName}
                  onChange={(e) => handle("fileName")(e.target.value)}
                  placeholder=""
                />
              </div>

              {/* Tamaño */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Tamaño</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.size}
                  onChange={(e) => handle("size")(e.target.value)}
                  placeholder=""
                />
              </div>

              {/* MIME Tipo */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">MIME Tipo</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.mimeType}
                  onChange={(e) => handle("mimeType")(e.target.value)}
                  placeholder=""
                />
              </div>

              {/* Fechas lado a lado (en una sola fila) */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha inicio</span>
              <div className="col-span-2">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.startDate}
                  onChange={(e) => handle("startDate")(e.target.value)}
                  placeholder=""
                />
              </div>

              <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha fin</span>
              <div className="col-span-2">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.endDate}
                  onChange={(e) => handle("endDate")(e.target.value)}
                  placeholder=""
                />
              </div>

            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-3 space-y-6">
          {/* TOTALES */}
          <Card
            title="TOTALES"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {([
                ["Total", "total"],
                ["Created", "created"],
                ["Updated", "updated"],
                ["Not modified", "notModified"],
                ["Error", "error"],
              ] as const).map(([label, key]) => (
                <React.Fragment key={key}>
                  <span className="col-span-1 text-sm text-gray-600 font-bold">{label}</span>
                  <div className="col-span-5">
                    <input
                      type="number"
                      className="w-full border-b border-gray-300 text-sm outline-none"
                      value={Number((record as any)[key] ?? 0)}
                      onChange={(e) => handle(key as any)(Number(e.target.value))}
                    />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* USUARIO CREADOR / ÚLTIMA MODIFICACIÓN -> SOLO en Resumen (pero editable) */}
          {!isCreate && (
            <Card
              title="USUARIO CREADOR"
              icon={UserIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="grid grid-cols-6 gap-4">
                <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                <div className="col-span-5">
                  <input
                    className="w-full border-b border-gray-300 text-sm outline-none"
                    value={record.createdBy?.username ?? ""}
                    onChange={(e) => handle("createdBy")({ ...(record.createdBy || { email: "", date: "" }), username: e.target.value })}
                  />
                </div>
                <span className="col-span-1 text-sm text-gray-600 font-bold">Email</span>
                <div className="col-span-5">
                  <input
                    className="w-full border-b border-gray-300 text-sm outline-none"
                    value={record.createdBy?.email ?? ""}
                    onChange={(e) => handle("createdBy")({ ...(record.createdBy || { username: "", date: "" }), email: e.target.value })}
                  />
                </div>
                <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha</span>
                <div className="col-span-5">
                  <input
                    className="w-full border-b border-gray-300 text-sm outline-none"
                    value={record.createdBy?.date ?? ""}
                    onChange={(e) => handle("createdBy")({ ...(record.createdBy || { username: "", email: "" }), date: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}

          {!isCreate && (
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={UserIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="grid grid-cols-6 gap-4">
                <span className="col-span-1 text-sm text-gray-600 font-bold">Fecha</span>
                <div className="col-span-5">
                  <input
                    className="w-full border-b border-gray-300 text-sm outline-none"
                    value={record.lastModified?.date ?? ""}
                    onChange={(e) => handle("lastModified")({ date: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
