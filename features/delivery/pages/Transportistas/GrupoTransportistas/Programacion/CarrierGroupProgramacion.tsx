// app/(delivery)/carrier-groups/[id]/programacion/page.tsx
"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  getCarrierGroupIntervalsCache,
  setCarrierGroupIntervalsCache,
} from "@/features/delivery/pages/Transportistas/GrupoTransportistas/shared/intervals-cache";
import type { Interval } from "@/features/delivery/components/transportistas/grupotransportistas/CarrierGroupFields";

/* ===== Tipos compartidos con el formulario ===== */
type GroupType = "Transportista" | "Otro";
type GroupStatus = "Activo" | "Inactivo";
type DayName = "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";

interface CarrierGroup {
  id: string;
  name: string;
  timezone: string;
  type: GroupType;
  carriers: string[];
  intervals: Interval[];
  status: GroupStatus;
}

type CarrierGroupApiWindowConfiguration = {
  windowSchemaId?: string;
  defaultShippingQuantity?: number | null;
};

type CarrierGroupApiResponse = {
  id?: string;
  name?: string;
  timezone?: string;
  groupType?: string;
  status?: string;
  carrierIds?: string[] | null;
  windowConfiguration?: CarrierGroupApiWindowConfiguration[] | null;
};

type WindowSchemaWindow = {
  startDay?: string | number | null;
  endDay?: string | number | null;
  startTime?: string | null;
  endTime?: string | null;
  maxShippingQuantity?: number | null;
};

type WindowSchemaNormalizedWindow = {
  dayOfWeek?: string | number | null;
  startTime?: string | null;
  endTime?: string | null;
  maxShippingQuantity?: number | null;
};

type WindowSchemaResponse = {
  id?: string;
  defaultShippingQuantity?: number | null;
  windows?: WindowSchemaWindow[] | string | null;
  normalizedWindows?: WindowSchemaNormalizedWindow[] | null;
};

const windowSchemaCache = new Map<string, WindowSchemaResponse>();

/* ===== Helpers ===== */
const DAYS_ORDER: DayName[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const formatTime = (hhmm: string) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "-";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

type Slot = { day: string; start: string; end: string; max: number };

const slotsFromIntervals = (intervals: Interval[]): Slot[] => {
  const out: Slot[] = [];
  for (const intv of intervals) {
    for (const d of intv.days) {
      for (const w of intv.windows) {
        out.push({ day: d, start: w.start, end: w.end, max: intv.max });
      }
    }
  }
  // Orden día + hora inicio
  return out.sort((a, b) => {
    const dayIndexA = DAYS_ORDER.indexOf(a.day as DayName);
    const dayIndexB = DAYS_ORDER.indexOf(b.day as DayName);
    const byDay = (dayIndexA === -1 ? 999 : dayIndexA) - (dayIndexB === -1 ? 999 : dayIndexB);
    if (byDay !== 0) return byDay;
    return a.start.localeCompare(b.start);
  });
};

const toHour = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(11, 16);
};

const DAY_INDEX_TO_ES: Record<number, DayName> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const DAY_NAME_TO_ES: Record<string, DayName> = {
  monday: "Lunes",
  martes: "Martes",
  tuesday: "Martes",
  miercoles: "Miércoles",
  miércoles: "Miércoles",
  wednesday: "Miércoles",
  thursday: "Jueves",
  jueves: "Jueves",
  friday: "Viernes",
  viernes: "Viernes",
  saturday: "Sábado",
  sabado: "Sábado",
  sábado: "Sábado",
  sunday: "Domingo",
  domingo: "Domingo",
};

const mapDayToSpanish = (value: unknown): DayName | null => {
  if (typeof value === "number") return DAY_INDEX_TO_ES[value] ?? null;

  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (DAY_NAME_TO_ES[normalized]) return DAY_NAME_TO_ES[normalized];

  const maybeNumber = Number(normalized);
  if (Number.isFinite(maybeNumber)) return DAY_INDEX_TO_ES[maybeNumber] ?? null;

  return null;
};

const parseWindows = (value: unknown): WindowSchemaWindow[] => {
  if (Array.isArray(value)) return value as WindowSchemaWindow[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as WindowSchemaWindow[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const mapGroupType = (value?: string): GroupType => {
  if (String(value || "").trim().toLowerCase() === "carrier") return "Transportista";
  return "Otro";
};

const mapGroupStatus = (value?: string): GroupStatus => {
  if (String(value || "").trim().toLowerCase() === "active") return "Activo";
  return "Inactivo";
};

const mapIntervalsFromSchema = (
  schema: WindowSchemaResponse,
  configDefaultShippingQuantity?: number | null
): Interval[] => {
  const normalizedWindows = Array.isArray(schema.normalizedWindows) ? schema.normalizedWindows : [];
  const baseWindows = normalizedWindows.length
    ? normalizedWindows.map((w) => ({
      day: mapDayToSpanish(w.dayOfWeek),
      start: toHour(w.startTime),
      end: toHour(w.endTime),
      max: Number(w.maxShippingQuantity ?? configDefaultShippingQuantity ?? schema.defaultShippingQuantity ?? 0),
    }))
    : parseWindows(schema.windows).map((w) => ({
      day: mapDayToSpanish(w.startDay),
      start: toHour(w.startTime),
      end: toHour(w.endTime),
      max: Number(w.maxShippingQuantity ?? configDefaultShippingQuantity ?? schema.defaultShippingQuantity ?? 0),
    }));

  if (!baseWindows.length) {
    return [{
      days: [],
      windows: [{ start: "", end: "" }],
      max: Number(configDefaultShippingQuantity ?? schema.defaultShippingQuantity ?? 0),
      applyQuotaToCarrierWindow: false,
    }];
  }

  return baseWindows.map((window) => ({
    days: window.day ? [window.day] : [],
    windows: [{ start: window.start, end: window.end }],
    max: Number(window.max || 0),
    applyQuotaToCarrierWindow: false,
  }));
};

const mapIntervalsFallback = (payload: CarrierGroupApiResponse): Interval[] => {
  const config = Array.isArray(payload.windowConfiguration) ? payload.windowConfiguration : [];
  return config.map((item) => ({
    days: [],
    windows: [{ start: "", end: "" }],
    max: Number(item.defaultShippingQuantity ?? 0),
    applyQuotaToCarrierWindow: false,
  }));
};

/* ===== Vista ===== */
export default function CarrierGroupProgramacionView() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const [group, setGroup] = useState<CarrierGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setGroup(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${DELIVERY_API_BASE}/carrier-group/${encodeURIComponent(String(id))}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as CarrierGroupApiResponse;
        if (!mounted) return;

        const groupId = String(payload.id || id || "").trim();
        let intervals = groupId ? getCarrierGroupIntervalsCache(groupId) : undefined;

        if (!intervals) {
          const config = Array.isArray(payload.windowConfiguration) ? payload.windowConfiguration : [];

          const intervalsFromSchemas = (
            await Promise.all(
              config.map(async (item) => {
                const schemaId = String(item.windowSchemaId || "").trim();
                if (!schemaId) {
                  return [{
                    days: [],
                    windows: [{ start: "", end: "" }],
                    max: Number(item.defaultShippingQuantity ?? 0),
                    applyQuotaToCarrierWindow: false,
                  }] as Interval[];
                }

                let schema = windowSchemaCache.get(schemaId);
                if (!schema) {
                  const schemaResponse = await fetch(`${DELIVERY_API_BASE}/window-schema/${encodeURIComponent(schemaId)}`, {
                    method: "GET",
                    cache: "no-store",
                  });
                  if (!schemaResponse.ok) {
                    throw new Error(`HTTP ${schemaResponse.status} al cargar window-schema ${schemaId}`);
                  }

                  schema = (await schemaResponse.json()) as WindowSchemaResponse;
                  windowSchemaCache.set(schemaId, schema);
                }

                return mapIntervalsFromSchema(schema, item.defaultShippingQuantity);
              })
            )
          ).flat();

          intervals = intervalsFromSchemas.length
            ? intervalsFromSchemas
            : mapIntervalsFallback(payload);

          if (groupId && intervals) {
            setCarrierGroupIntervalsCache(groupId, intervals);
          }
        }

        const mappedGroup: CarrierGroup = {
          id: String(payload.id || ""),
          name: String(payload.name || ""),
          timezone: String(payload.timezone || ""),
          type: mapGroupType(payload.groupType),
          carriers: [],
          intervals: intervals || [],
          status: mapGroupStatus(payload.status),
        };

        if (!mounted) return;
        setGroup(mappedGroup);
      } catch (error) {
        console.error("Error cargando programación del grupo:", error);
        if (!mounted) return;
        setGroup(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const allSlots = useMemo(() => slotsFromIntervals(group?.intervals || []), [group?.intervals]);

  // Paginación estilo SalesChannels
  const PER_PAGE = 60;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(allSlots.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageSlots = allSlots.slice(start, start + PER_PAGE);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/delivery/transportistas/grupo-transportistas"),
      },
    ],
    [router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Grupos de transportistas</div>
          <div className="text-2xl font-semibold text-gray-900">{group?.name || "—"}</div>
        </div>
      ),
      action: headerActions,
      status: loading
        ? { text: "Cargando...", variant: "info" }
        : group
          ? { text: group.status, variant: group.status === "Activo" ? "success" : "warning" }
          : { text: "Registro no encontrado", variant: "warning" },
    } as PageHeaderProps),
    [group?.name, group?.status, loading, headerActions]
  );

  if (loading) {
    return <div className="p-6 text-gray-600">Cargando programación...</div>;
  }

  if (!group) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-600">
          Registro no encontrado
        </div>
      </div>
    );
  }

  return (
    // <div className="flex-1 bg-page-bg p-6">
    <div className="p-6">
      <div className="overflow-hidden rounded-xl bg-white">
        {/* Encabezado de la lista */}
        <div className="flex items-center justify-between border-b bg-[#E8EAF7] px-4 py-2 text-xs font-medium text-gray-600">
          <span className="uppercase tracking-wider">Range</span>
          <span className="uppercase tracking-wider">Envíos (máx.)</span>
        </div>

        {/* Lista de slots */}
        <ul className="divide-y">
          {pageSlots.map((s, i) => (
            <li key={`${s.day}-${s.start}-${s.end}-${i}`} className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <CalendarDaysIcon className="h-5 w-5" />
                </span>
                <span className="text-sm text-gray-900">
                  <span className="font-medium">{s.day}</span>{" "}
                  {`${formatTime(s.start)} a ${formatTime(s.end)}`}
                </span>
              </div>

              <span className="inline-flex min-w-[48px] justify-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700">
                {s.max}
              </span>
            </li>
          ))}

          {pageSlots.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">No hay intervalos configurados.</li>
          )}
        </ul>
      </div>

      {/* Paginación */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {allSlots.length > PER_PAGE && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
        <div className="text-sm text-gray-500">
          {allSlots.length === 0
            ? "0 resultados"
            : `${start + 1}-${Math.min(start + PER_PAGE, allSlots.length)} de ${allSlots.length} resultados`}
        </div>
      </div>
    </div>
  );
}
