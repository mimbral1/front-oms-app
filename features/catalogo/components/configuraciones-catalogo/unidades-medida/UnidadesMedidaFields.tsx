"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export interface UnidadesMedida {
  id?: string;
  modalidad: string;
  creacion: string;
  usuario_creador: { initials: string; name: string; email: string };
  modificado: string;
  usuario: { initials: string; name: string; email: string };
  um_venta: string;
  multiplicador_um: string;
  um_ppum: string;
  status: "Active" | "Inactive";
}

interface Props {
  record: UnidadesMedida;
  readOnly?: boolean;
  onChange?: (field: keyof UnidadesMedida, value: string) => void;
}

export const UnidadesMedidaFields: React.FC<Props> = ({
  record,
  readOnly = true,
  onChange,
}) => {
  const handle =
    (field: keyof UnidadesMedida) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange?.(field, e.target.value);
      };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/** ─── LEFT (span 2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* estado */}
          <div className="grid grid-cols-6 gap-4">
            <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
            <div className="col-span-5">
              {readOnly ? (
                <a
                  href="#"
                  className="text-sm font-medium text-blue-600 underline truncate"
                >
                  {record.status}
                </a>
              ) : (
                <select
                  value={record.status}
                  onChange={handle("status")}
                  className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900 bg-white"
                >
                  <option value="">Seleccione una opción</option>
                  <option value="un">Activo</option>
                  <option value="un">Inactivo</option>
                  {/* Agrega más si necesitas */}
                </select>
              )}
            </div>
          </div>
          {/** MAIN */}
          <Card
            title="UNIDADES"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* UM (Venta) */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">UM (Venta)</span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.um_venta}
                  </a>
                ) : (
                  <select
                    value={record.um_venta}
                    onChange={handle("um_venta")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="un">un</option>
                    <option value="kg">kg</option>
                    <option value="gr">gr</option>
                    <option value="lb">lb</option>
                    <option value="pz">pz</option>
                    <option value="m">m</option>
                    <option value="lt">lt</option>
                    {/* Agrega más si necesitas */}
                  </select>
                )}
              </div>
              {/* Multiplicador UM (Venta) */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Multiplicador UM (Venta)</span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.multiplicador_um}
                  </a>
                ) : (
                  <input
                    type="text"
                    value={record.multiplicador_um}
                    onChange={handle("multiplicador_um")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
              {/* UM (PPUM) */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">UM (PPUM)</span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.um_ppum}
                  </a>
                ) : (
                  <input
                    type="text"
                    value={record.um_ppum}
                    onChange={handle("um_ppum")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
