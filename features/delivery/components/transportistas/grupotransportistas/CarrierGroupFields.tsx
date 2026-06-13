// app/(delivery)/carrier-groups/new/components/CarrierGroupFields.tsx
"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { ActionButton } from "@/components/ui/button/action-button";
import {
  ClipboardDocumentListIcon as DocumentTextIcon,
  Cog6ToothIcon,
  CalendarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { MultiSelectSearchInline } from "@/components/ui/collapsible/multiSelectSearchInline";
import { Toggle } from "@/components/ui/togle/togle";
import TimePickerField from "@/components/ui/time-picker/TimePickerField";
import type { CarrierGroup } from "@/features/delivery/pages/Transportistas/GrupoTransportistas/Nuevo/CarrierGroupNuevo";
import { FormControl, MenuItem, Select, SelectChangeEvent } from "@mui/material";

// 
type CGType = CarrierGroup["type"];     // "Transportista" | "Otro"

/* Estructuras (compatibles con lo que ya tienes) */
export interface DeliveryWindow {
  start: string;
  end: string;
}
export interface Interval {
  days: string[];
  windows: DeliveryWindow[]; // usaremos el primer par [0] para la UI
  max: number;
  applyQuotaToCarrierWindow: boolean;
}

type Props = {
  group: CarrierGroup;
  onChange?: <K extends keyof CarrierGroup>(field: K, value: CarrierGroup[K]) => void;
};

type ApiCarrierItem = {
  id?: string;
  refId?: string | null;
  reference?: string | null;
  name?: string | null;
  displayId?: string | null;
};

type CarrierOption = {
  label: string;
  value: string;
};

type ApiCarrierResponse = {
  data?: ApiCarrierItem[];
  items?: ApiCarrierItem[];
  rows?: ApiCarrierItem[];
  results?: ApiCarrierItem[];
  totalPages?: number;
  total?: number;
  page?: number;
};

const extractCarrierItems = (payload: unknown): ApiCarrierItem[] => {
  if (Array.isArray(payload)) return payload as ApiCarrierItem[];
  if (!payload || typeof payload !== "object") return [];

  const asResponse = payload as ApiCarrierResponse;
  if (Array.isArray(asResponse.data)) return asResponse.data;
  if (Array.isArray(asResponse.items)) return asResponse.items;
  if (Array.isArray(asResponse.rows)) return asResponse.rows;
  if (Array.isArray(asResponse.results)) return asResponse.results;

  return [];
};

export const CarrierGroupFields: React.FC<Props> = ({ group, onChange }) => {
  const set =
    <K extends keyof CarrierGroup>(k: K) =>
      (v: CarrierGroup[K]) =>
        onChange?.(k, v);

  const [carrierOptions, setCarrierOptions] = useState<CarrierOption[]>([]);
  const [carrierSearchQuery, setCarrierSearchQuery] = useState("");
  const [maxDraftByIndex, setMaxDraftByIndex] = useState<Record<number, string>>({});
  const [openDaysIndex, setOpenDaysIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadCarrierOptions = async () => {
      try {
        const allCarriers: ApiCarrierItem[] = [];
        const limit = 200;
        let page = 1;

        for (let attempt = 0; attempt < 20; attempt += 1) {
          const response = await fetch(`${DELIVERY_API_BASE}/carrier?page=${page}&limit=${limit}`, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const payload = (await response.json()) as ApiCarrierResponse;
          const items = extractCarrierItems(payload);
          allCarriers.push(...items);

          const totalPages = Number(payload?.totalPages || 0);
          if (totalPages > 0) {
            if (page >= totalPages) break;
            page += 1;
            continue;
          }

          if (items.length < limit) break;
          page += 1;
        }

        const mapped = allCarriers
          .map((item) => {
            const value = String(item.id || "").trim();
            const label = String(item.displayId || item.name || item.refId || item.reference || value).trim();
            if (!value) return null;
            return { label: label || value, value } as CarrierOption;
          })
          .filter((item): item is CarrierOption => Boolean(item));

        const deduped = Array.from(new Map(mapped.map((item) => [item.value, item])).values());

        if (!mounted) return;
        setCarrierOptions(deduped);
      } catch (error) {
        console.error("Error cargando opciones de transportistas:", error);
        if (!mounted) return;
        setCarrierOptions([]);
      }
    };

    loadCarrierOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const carrierSelectSearchOptions = useMemo(() => {
    const selectedFallback = (group.carriers || [])
      .filter((carrierId) => !carrierOptions.some((option) => option.value === carrierId))
      .map((carrierId) => ({ label: carrierId, value: carrierId }));

    return [...carrierOptions, ...selectedFallback];
  }, [carrierOptions, group.carriers]);

  /* Helpers de Intervalos */
  const updateInterval =
    (idx: number) =>
      (patch: Partial<Interval>) => {
        const next = group.intervals.map((it, i) => (i === idx ? { ...it, ...patch } : it));
        set("intervals")(next);
      };

  const setIntervalDays =
    (idx: number) =>
      (e: SelectChangeEvent<string[]>) => {
        updateInterval(idx)({ days: e.target.value as string[] });
        setOpenDaysIndex(null);
      };

  const setIntervalStart =
    (idx: number) =>
      (value: string) => {
        const cur = group.intervals[idx];
        const win0 = cur.windows?.[0] ?? { start: "", end: "" };
        updateInterval(idx)({ windows: [{ ...win0, start: value }] });
      };

  const setIntervalEnd =
    (idx: number) =>
      (value: string) => {
        const cur = group.intervals[idx];
        const win0 = cur.windows?.[0] ?? { start: "", end: "" };
        updateInterval(idx)({ windows: [{ ...win0, end: value }] });
      };

  const setIntervalMax =
    (idx: number) =>
      (value: number) =>
        updateInterval(idx)({ max: value });

  const setIntervalApplyQuota =
    (idx: number) =>
      (value: boolean) =>
        updateInterval(idx)({ applyQuotaToCarrierWindow: value });

  const getMaxInputValue = (idx: number, max: number | undefined) => {
    if (Object.prototype.hasOwnProperty.call(maxDraftByIndex, idx)) {
      return maxDraftByIndex[idx];
    }
    return String(max ?? 0);
  };

  const handleMaxChange = (idx: number, rawValue: string) => {
    setMaxDraftByIndex((prev) => ({ ...prev, [idx]: rawValue }));
    if (rawValue === "") return;

    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) return;
    setIntervalMax(idx)(numeric);
  };

  const handleMaxBlur = (idx: number) => {
    const draftValue = maxDraftByIndex[idx];
    if (draftValue === undefined) return;

    if (draftValue === "") {
      setIntervalMax(idx)(0);
      setMaxDraftByIndex((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
      return;
    }

    const numeric = Number(draftValue);
    if (Number.isFinite(numeric)) {
      setIntervalMax(idx)(numeric);
    }

    setMaxDraftByIndex((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const addInterval = () => {
    set("intervals")([
      ...group.intervals,
      { days: [], windows: [{ start: "", end: "" }], max: 0, applyQuotaToCarrierWindow: false },
    ]);
  };

  const removeInterval = (idx: number) => {
    const next = group.intervals.filter((_, i) => i !== idx);
    set("intervals")(next);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Columna izquierda */}
        <div className="lg:col-span-4 space-y-6">
          {/* DETALLE */}
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
                  value={group.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder=""
                />
              </div>

              {/* Zona horaria */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Zona horaria</span>
              <div className="col-span-5">
                <CollapsibleField
                  inline
                  label=""
                  value={group.timezone}
                  options={["Europe/Madrid", "America/Argentina/Buenos_Aires", "America/Santiago"]}
                  onChange={(v) => set("timezone")(v)}
                />
              </div>

              {/* Tipo */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Tipo</span>
              <div className="col-span-5">
                <CollapsibleField
                  inline
                  label=""
                  value={group.type}
                  options={["Transportista", "Otro"]}
                  onChange={(v) => set("type")(v as CGType)}
                />
              </div>

              {/* Transportistas (chips multiple) */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">Transportistas</span>
              <div className="col-span-5">
                <MultiSelectSearchInline
                  id="carriers"
                  label="Transportistas"
                  values={group.carriers}
                  options={carrierSelectSearchOptions}
                  searchQuery={carrierSearchQuery}
                  onSearch={setCarrierSearchQuery}
                  onChange={(values) => set("carriers")(values)}
                  compact
                  showCompactSummary={false}
                  showSelectedPanel={false}
                  compactSelectionStyle="badge"
                />
              </div>
            </div>
          </Card>

          {/* INTERVALOS (cada “ventana” es un bloque completo) */}
          <Card
            title="INTERVALOS"
            icon={CalendarIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            {group.intervals.map((intv, idx) => {
              const win0 = intv.windows?.[0] ?? { start: "", end: "" };
              return (
                <div key={idx} className="relative">
                  {/* Botón eliminar bloque */}
                  <button
                    type="button"
                    onClick={() => removeInterval(idx)}
                    aria-label="Eliminar intervalo"
                    title="Eliminar intervalo"
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 shadow-sm
             hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>


                  <div className="grid grid-cols-[160px_1fr] items-center gap-4 pt-1">
                    {/* Días */}
                    <span className="text-sm text-gray-600 font-bold">Días</span>
                    <FormControl variant="outlined" fullWidth>
                      <Select
                        multiple
                        displayEmpty
                        open={openDaysIndex === idx}
                        onOpen={() => setOpenDaysIndex(idx)}
                        onClose={() => setOpenDaysIndex(null)}
                        value={intv.days}
                        onChange={setIntervalDays(idx)}
                        renderValue={(selected) => (
                          (selected as string[]).length > 0
                            ? (selected as string[]).join(", ")
                            : "Seleccionar días"
                        )}
                        sx={{
                          borderRadius: "0.5rem",
                          backgroundColor: "#fff",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          ".MuiOutlinedInput-notchedOutline": {
                            borderColor: "#d1d5db",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#9ca3af",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#6366f1",
                          },
                          ".MuiSelect-select": {
                            paddingTop: "10px",
                            paddingBottom: "10px",
                            fontSize: "0.875rem",
                            color: (intv.days?.length ?? 0) > 0 ? "#111827" : "#9ca3af",
                          },
                        }}
                      >
                        {[
                          "Lunes",
                          "Martes",
                          "Miércoles",
                          "Jueves",
                          "Viernes",
                          "Sábado",
                          "Domingo",
                        ].map((d) => (
                          <MenuItem key={d} value={d}>
                            {d}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Ventanas */}
                    <span className="text-sm text-gray-600 font-bold">Ventanas</span>
                    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[220px_auto_220px]">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Hora de inicio</span>
                        <TimePickerField
                          value={win0.start}
                          onChange={setIntervalStart(idx)}
                        />
                      </div>
                      <div className="hidden h-px bg-transparent sm:block" />
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Hora de fin</span>
                        <TimePickerField
                          value={win0.end}
                          onChange={setIntervalEnd(idx)}
                        />
                      </div>
                    </div>

                    {/* Envíos (máx.) */}
                    <span className="text-sm text-gray-600 font-bold">Envíos (máx.)</span>
                    <div>
                      <div className="flex items-center gap-6">
                        <input
                          type="number"
                          min={0}
                          value={getMaxInputValue(idx, intv.max)}
                          onChange={(e) => handleMaxChange(idx, e.target.value)}
                          onBlur={() => handleMaxBlur(idx)}
                          className="border-b w-28 text-sm outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Aplicar cuota a ventana</span>
                          <Toggle
                            checked={Boolean(intv.applyQuotaToCarrierWindow)}
                            onCheckedChange={setIntervalApplyQuota(idx)}
                            aria-label="Aplicar cuota a ventana"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Separador entre bloques */}
                  {idx < group.intervals.length - 1 && (
                    <div className="my-6 border-t border-gray-200" />
                  )}

                  {/* Botón “Agregar ventana” debajo de cada bloque (como la referencia) */}
                  {idx === group.intervals.length - 1 && (
                    <div className="mt-6">
                      <ActionButton
                        type="button"
                        variant="primary"
                        onClick={addInterval}
                      >
                        <span className="text-lg leading-none">+</span> Agregar ventana
                      </ActionButton>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Si no hay intervalos, mostramos botón para crear el primero */}
            {group.intervals.length === 0 && (
              <div className="mt-6">
                <ActionButton
                  type="button"
                  variant="primary"
                  onClick={addInterval}
                >
                  <span className="text-lg leading-none">+</span> Agregar ventana
                </ActionButton>
              </div>
            )}
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-3 space-y-6">
          {/* CONFIGURACIONES */}
          <Card
            title="CONFIGURACIONES"
            icon={Cog6ToothIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-2 text-sm text-gray-600 font-bold">Estado</span>
              <div className="col-span-4 flex items-center gap-3">
                <Toggle
                  checked={group.status === "Activo"}
                  onCheckedChange={(checked) => set("status")(checked ? "Activo" : "Inactivo")}
                  aria-label="Estado del grupo"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
