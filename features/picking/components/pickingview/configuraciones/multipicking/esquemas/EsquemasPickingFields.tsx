// views\PickingView\configuraciones\multipicking\esquemas\components\EsquemasPickingFields.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Card from "@/components/ui/card/Card";
import {
  ClipboardDocumentListIcon as DocumentTextIcon,
  PencilIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline"; // mismo componente inline (multi patrón) :contentReference[oaicite:0]{index=0}
import { Avatar } from "@/components/ui/user-avatar";
import { ActiveStatusToggle } from "@/components/ui/togle";
import { useApiZonasPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/esquemas-picking/api-esquemas-picking";

/* =========================================================================================
   Tipos 
========================================================================================= */
export type Estado = "Activo" | "Inactivo";

export interface PickingScheme {
  id?: string | number;
  nombre: string;
  pickingZones: string[];
  default: boolean;
  estado: Estado;

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
}

export const EsquemasPickingFields: React.FC<{
  record: PickingScheme;
  readOnly?: boolean;
  onChange?: <K extends keyof PickingScheme>(field: K, value: PickingScheme[K]) => void;
  errors?: Partial<Record<keyof PickingScheme, string>>;
}> = ({ record, readOnly = false, onChange, errors }) => {
  const set =
    <K extends keyof PickingScheme>(k: K) =>
      (v: PickingScheme[K]) =>
        onChange?.(k, v);

  const err = (k: keyof PickingScheme) => errors?.[k];

  /* =======================
   ZONAS DE PICKING (API)
======================= */
  type Opt = { value: string; label: string };

  const { getZones } = useApiZonasPicking();

  const [zoneOpts, setZoneOpts] = useState<
    { label: string; value: string }[]
  >([]);

  const [zoneSearch, setZoneSearch] = useState("");
  const [loadingZones, setLoadingZones] = useState(false);

  // carga las zonas de picking al selector 
  useEffect(() => {
    let mounted = true;

    const loadZones = async () => {
      try {
        setLoadingZones(true);

        const res = await getZones();

        if (!mounted) return;

        setZoneOpts(
          res?.items?.map((z: { id: string; name: string }) => ({
            label: z.name,
            value: z.id,
          })) ?? []
        );
      } catch (e) {
        console.error("Error cargando zonas:", e);
      } finally {
        if (mounted) setLoadingZones(false);
      }
    };

    loadZones();

    return () => {
      mounted = false;
    };
  }, []);
  //////////////////////// 

  const zoneLabelById = useMemo(
    () => new Map(zoneOpts.map((o) => [o.value, o.label])),
    [zoneOpts]
  );

  const addZone = (value?: string) => {
    if (!value) return;
    if (record.pickingZones.includes(value)) return;

    onChange?.("pickingZones", [...record.pickingZones, value]);
  };

  const removeZone = (value: string) => {
    onChange?.(
      "pickingZones",
      record.pickingZones.filter((z) => z !== value)
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* IZQUIERDA */}
        <div className="lg:col-span-4 space-y-6">
          <Card
            title="DETALLE"
            icon={DocumentTextIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* Nombre */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b border-gray-300 text-sm outline-none"
                  value={record.nombre || ""}
                  onChange={(e) => set("nombre")(e.target.value)}
                  disabled={readOnly}
                  placeholder="Nombre del esquema"
                  aria-invalid={!!err("nombre")}
                />
                {err("nombre") && <p className="mt-1 text-xs text-red-600">{err("nombre")}</p>}
              </div>

              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Zonas de picking
              </span>

              <div className="col-span-5">
                <SelectSearchInline
                  id="pickingzones"
                  label="zonas"
                  value=""
                  options={zoneOpts}
                  searchQuery={zoneSearch}
                  loading={loadingZones}
                  onSearch={setZoneSearch}
                  onChange={(value) => {
                    if (value && !record.pickingZones.includes(value)) {
                      addZone(value);
                    }
                  }}
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {record.pickingZones.map((zid) => (
                    <span
                      key={zid}
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                    >
                      {zoneLabelById.get(zid) ?? zid}
                      <button
                        type="button"
                        className="ml-2 text-gray-500 hover:text-gray-800"
                        onClick={() => removeZone(zid)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Default (switch) */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Por defecto</span>
              <div className="col-span-5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={record.default}
                  onClick={() => set("default")(!record.default)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${record.default ? "bg-blue-500" : "bg-gray-300"}`}
                  disabled={readOnly}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${record.default ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                {err("default") && <p className="mt-1 text-xs text-red-600">{err("default")}</p>}
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-3 space-y-6">
          <Card
            title="OTROS"
            // icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* Estado */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Estado</span>
              <div className="col-span-5">
                <ActiveStatusToggle
                  active={record.estado === "Activo"}
                  disabled={readOnly}
                  onActiveChange={(active) =>
                    set("estado")(active ? "Activo" : "Inactivo")
                  }
                />
                {err("estado") && <p className="mt-1 text-xs text-red-600">{err("estado")}</p>}
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
            {record.created ? (
              <div className="flex items-center justify-between">
                {/* Izquierda: avatar + nombre + email */}
                <div className="flex items-center gap-2">
                  <Avatar
                    name={record.created.username}
                    src={record.created.avatar}
                    className="h-7 w-7 bg-orange-100 text-xs font-bold text-orange-700"
                  />

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {record.created.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {record.created.email}
                    </span>
                  </div>
                </div>

                {/* Derecha: fecha creación */}
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {record.created.date || "—"}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">—</div>
            )}
          </Card>

          {record.modified && (
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={PencilIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              {record.modified ? (
                <div className="flex items-center justify-between">
                  {/* Izquierda: avatar + nombre + email */}
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={record.modified.username}
                      src={record.modified.avatar}
                      className="h-7 w-7 bg-orange-100 text-xs font-bold text-orange-700"
                    />

                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {record.modified.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {record.modified.email}
                      </span>
                    </div>
                  </div>

                  {/* Derecha: fecha creación */}
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {record.modified.date || "—"}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">—</div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
