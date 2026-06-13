/* ------------------------------------------------------------------
   views/AuditType/components/AuditTypeFields.tsx
-------------------------------------------------------------------*/
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  TagIcon,
  SwatchIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@/components/ui/user-avatar/initials";

export type AuditTypeStatus = "Active" | "Inactive";

export interface AuditTypeModel {
  id?: string;
  name: string;
  color: string; // ej. "#38bb1e"
  status: AuditTypeStatus;
  created: { username: string; email: string; date: string };
}

interface Props {
  data: AuditTypeModel;
  readOnly?: boolean;
  onChange?: <K extends keyof AuditTypeModel>(
    field: K,
    value: AuditTypeModel[K]
  ) => void;
}

export const AuditTypeFields: React.FC<Props> = ({
  data,
  readOnly = true,
  onChange,
}) => {
  const handle =
    <K extends keyof AuditTypeModel>(k: K) =>
    (v: AuditTypeModel[K]) =>
      onChange?.(k, v);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ======= DETAIL ======= */}
      <Card
        title="DETAIL"
        icon={TagIcon}
        hasTitleDivider
        className="border-none shadow-none p-6"
        borderClass="border-none"
        noDefaultStyles={true}
      >
        <div className="space-y-6">
          {/* -- Name -- */}
          <div className="flex items-center gap-4 pb-3">
            <span className="w-24 text-sm text-gray-600">Name</span>
            {readOnly ? (
              <span className="text-sm font-medium text-gray-900 truncate">
                {data.name || "—"}
              </span>
            ) : (
              <input
                type="text"
                value={data.name}
                onChange={(e) => handle("name")(e.target.value)}
                className="flex-1 border-b border-gray-300 focus:outline-none text-sm font-medium"
              />
            )}
          </div>

          {/* -- Color -- */}
          <div className="flex items-center gap-4  pb-3">
            <span className="w-24 text-sm text-gray-600">Color</span>
            {readOnly ? (
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full border"
                  style={{ background: data.color }}
                />
                <span className="text-sm">{data.color}</span>
              </div>
            ) : (
              <input
                type="color"
                value={data.color}
                onChange={(e) => handle("color")(e.target.value)}
                className="h-8 w-16 cursor-pointer border-none bg-transparent"
              />
            )}
          </div>
        </div>
      </Card>

      {/* ======= OTHERS ======= */}
      <div className="space-y-6">
        <Card
          title="OTHERS"
          icon={SwatchIcon}
          hasTitleDivider
          className=" border-none shadow-none rounded-xl p-6"
          noDefaultStyles={true}
        >
          <div className="space-y-6">
            {/* -- Status -- */}
            <div className="flex items-center gap-4  pb-3">
              <span className="w-24 text-sm text-gray-600">Status</span>
              {readOnly ? (
                <span className="text-sm">{data.status}</span>
              ) : (
                <select
                  value={data.status}
                  onChange={(e) =>
                    handle("status")(e.target.value as AuditTypeStatus)
                  }
                  className=" focus:outline-none text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              )}
            </div>

            {/* -- Creator user (solo lectura) -- */}
            {/* {data.created.username && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <UserIcon className="h-4 w-4" />
                CREATOR USER
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex-none rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold">
                  {data.created.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {data.created.username}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">
                    {data.created.email}
                  </span>
                </div>
                <span className="ml-auto text-xs text-gray-500">
                  {data.created.date}
                </span>
              </div>
            </div>
          )} */}
          </div>
        </Card>
        {data.created.username && (
          <Card
            title="CREATOR USER"
            icon={UserIcon}
            hasTitleDivider
            className="border-none shadow-none rounded-xl p-6 " /* ocupa mitad en desktop */
            noDefaultStyles={true}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Avatar
                name={data.created.username}
                className="bg-orange-500" // opcional: añade bg‑* si no quieres el naranja por defecto
              />

              {/* Nombre + mail */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {data.created.username}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[180px]">
                  {data.created.email}
                </span>
              </div>

              {/* Fecha */}
              <span className="ml-auto text-xs text-gray-500">
                {data.created.date}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
