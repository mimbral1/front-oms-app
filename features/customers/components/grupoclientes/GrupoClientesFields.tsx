// views/Customers/GrupoClientes/components/GrupoClientesFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, UserIcon } from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

/* ================================
 * Tipos de la UI
 * ================================ */

export interface CustomerGroupRecord {
  groupCode: number;                       // API.GroupCode
  groupName: string;                       // API.GroupName
  partnerType: string;                     // API.PartnerType (C)
  isActive: boolean;                       // API.IsActive
  created: { name: string; date: string }; // API.CreatedAt (solo fecha en UI)
  modified: { name: string; date: string };// API.UpdatedAt (solo fecha en UI)
}

export type CustomerGroupFieldErrors = Partial<Record<keyof CustomerGroupRecord, string>>;

export function GrupoClientesFields({
  record,
  readOnly = false,
  onChange,
  errors,
  canEditCode = true,
}: {
  record: CustomerGroupRecord;
  readOnly?: boolean;
  onChange?: <K extends keyof CustomerGroupRecord>(field: K, value: CustomerGroupRecord[K]) => void;
  errors?: CustomerGroupFieldErrors;
  canEditCode?: boolean;
}) {
  const handle =
    <K extends keyof CustomerGroupRecord>(field: K) =>
      (value: CustomerGroupRecord[K]) =>
        onChange?.(field, value);

  const inputClass = (hasError?: boolean) =>
    `w-full border-b bg-transparent py-1 text-sm outline-none ${hasError ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Columna izquierda */}
        <div className="lg:col-span-4 space-y-6">
          <Card
            title="DETALLE"
            icon={ClipboardDocumentListIcon}
            hasTitleDivider
            noDefaultStyles
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* Código de grupo */}
              <span className="col-span-1 text-sm font-bold text-gray-700">Código</span>
              <div className="col-span-5">
                <input
                  disabled={!canEditCode || readOnly}
                  value={record.groupCode ?? ""}
                  onChange={(e) =>
                    handle("groupCode")(Number(e.target.value || 0) as any)
                  }
                  className={inputClass(!!errors?.groupCode)}
                  aria-invalid={!!errors?.groupCode}
                  aria-describedby={errors?.groupCode ? "error-groupCode" : undefined}
                  placeholder="Ej: 100"
                />
                {errors?.groupCode && (
                  <p id="error-groupCode" className="mt-1 text-xs text-red-600">
                    {errors.groupCode}
                  </p>
                )}
              </div>

              {/* Nombre del grupo */}
              <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
              <div className="col-span-5">
                <input
                  disabled={readOnly}
                  value={record.groupName}
                  onChange={(e) => handle("groupName")(e.target.value)}
                  className={inputClass(!!errors?.groupName)}
                  aria-invalid={!!errors?.groupName}
                  aria-describedby={errors?.groupName ? "error-groupName" : undefined}
                  placeholder="Nombre del grupo"
                />
                {errors?.groupName && (
                  <p id="error-groupName" className="mt-1 text-xs text-red-600">
                    {errors.groupName}
                  </p>
                )}
              </div>

              {/* Tipo de socio */}
              <span className="col-span-1 text-sm font-bold text-gray-700">Tipo de socio</span>
              <div className="col-span-5">
                <CollapsibleField
                  inline
                  label=""
                  value={record.partnerType || "C"}
                  options={["C"]}
                  onChange={(v) => handle("partnerType")(String(v) as any)}
                />
              </div>

              {/* Estado */}
              <span className="col-span-1 text-sm font-bold text-gray-700">Estado</span>
              <div className="col-span-5">
                <CollapsibleField
                  inline
                  label=""
                  value={record.isActive ? "Activo" : "Inactivo"}
                  options={["Activo", "Inactivo"]}
                  onChange={(v) => handle("isActive")((v === "Activo") as any)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-3 space-y-6">
          {/* Usuario creador */}
          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            hasTitleDivider
            noDefaultStyles
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-2 text-sm font-bold text-gray-700">Nombre</span>
              <span className="col-span-4 text-sm text-gray-900">
                {record.created.name || "—"}
              </span>

              <span className="col-span-2 text-sm font-bold text-gray-700">Fecha</span>
              <span className="col-span-4 text-sm text-gray-900">
                {record.created.date || "—"}
              </span>
            </div>
          </Card>

          {/* Última modificación */}
          <Card
            title="ÚLTIMA MODIFICACIÓN"
            icon={UserIcon}
            hasTitleDivider
            noDefaultStyles
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-2 text-sm font-bold text-gray-700">Nombre</span>
              <span className="col-span-4 text-sm text-gray-900">
                {record.modified.name || "—"}
              </span>

              <span className="col-span-2 text-sm font-bold text-gray-700">Fecha</span>
              <span className="col-span-4 text-sm text-gray-900">
                {record.modified.date || "—"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default GrupoClientesFields;
