"use client";
import { DELIVERY_API_BASE } from "@/lib/delivery-api";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { CarrierGroupFields, type Interval } from "@/features/delivery/components/transportistas/grupotransportistas/CarrierGroupFields";

type GroupType = "Transportista" | "Otro";
type GroupStatus = "Activo" | "Inactivo";

const DAY_TO_API: Record<string, string> = {
  lunes: "monday",
  monday: "monday",
  martes: "tuesday",
  tuesday: "tuesday",
  miércoles: "wednesday",
  miercoles: "wednesday",
  wednesday: "wednesday",
  jueves: "thursday",
  thursday: "thursday",
  viernes: "friday",
  friday: "friday",
  sábado: "saturday",
  sabado: "saturday",
  saturday: "saturday",
  domingo: "sunday",
  sunday: "sunday",
};

export interface CarrierGroup {
  id: string;
  name: string;
  timezone: string;
  type: GroupType;
  carriers: string[];
  days: string[];           // (la sección de días la maneja cada intervalo)
  intervals: Interval[];    // [{ days: string[], windows: {start,end}[], max: number }]
  status: GroupStatus;
}

const emptyInterval: Interval = {
  days: [],
  windows: [{ start: "", end: "" }],
  max: 0,
  applyQuotaToCarrierWindow: false,
};

const emptyGroup: CarrierGroup = {
  id: "",
  name: "",
  timezone: "America/Santiago",
  type: "Transportista",
  carriers: [],
  days: [],
  intervals: [emptyInterval],
  status: "Activo",
};

export default function CarrierGroupCreateView() {
  const router = useRouter();
  const [group, setGroup] = useState<CarrierGroup>(emptyGroup);
  const [saving, setSaving] = useState(false);

  const toApiDay = (day: string): string | null => {
    const normalized = String(day || "").trim().toLowerCase();
    return DAY_TO_API[normalized] ?? null;
  };

  const buildCreatePayload = () => {
    const nowIso = new Date().toISOString();

    const windowConfiguration = group.intervals.map((interval) => {
      const days = (interval.days || [])
        .map((day) => toApiDay(day))
        .filter((day): day is string => Boolean(day));

      const windows = (interval.windows?.length ? interval.windows : [{ start: "", end: "" }])
        .filter((window) => window.start && window.end)
        .map((window) => ({
          startTime: window.start,
          endTime: window.end,
          maxShippingQuantity: Number(interval.max || 0),
          applyQuotaToCarrierWindow: Boolean(interval.applyQuotaToCarrierWindow),
        }));

      return {
        days,
        windows,
      };
    });

    return {
      name: group.name,
      timezone: group.timezone,
      windowConfiguration,
      status: group.status === "Activo" ? "active" : "inactive",
      dateCreated: nowIso,
      userCreated: null,
      dateModified: nowIso,
      userModified: null,
      type: "carrier",
      carrierIds: group.carriers,
    };
  };

  const createCarrierGroup = async () => {
    const payload = buildCreatePayload();

    setSaving(true);
    try {
      const response = await fetch(`${DELIVERY_API_BASE}/carrier-group`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} ${errorText}`);
      }

      const created = (await response.json().catch(() => null)) as { id?: string } | null;
      return created;
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof CarrierGroup>(field: K, value: CarrierGroup[K]) => {
    if (field === "type") {
      setGroup((prev) => ({ ...prev, type: "Transportista" }));
      return;
    }
    setGroup((prev) => ({ ...prev, [field]: value }));
  };

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: async () => {
          try {
            await createCarrierGroup();
            router.push("/delivery/transportistas/grupo-transportistas");
          } catch (error) {
            console.error("Error creando carrier-group:", error);
          }
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: saving,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: async () => {
          try {
            await createCarrierGroup();
            router.push("/delivery/transportistas/grupo-transportistas");
          } catch (error) {
            console.error("Error creando carrier-group:", error);
          }
        },
        icon: <SaveOutlined className="h-4 w-4" />,
        disabled: saving,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        onClick: async () => {
          try {
            await createCarrierGroup();
            router.push("/delivery/transportistas/grupo-transportistas");
          } catch (error) {
            console.error("Error creando carrier-group:", error);
          }
        },
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
        disabled: saving,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/delivery/transportistas/grupo-transportistas"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router, saving, group]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Grupos de transportistas
          </div>
          <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
        </div>
      ),
      action: headerActions,
      status: { text: group.status, variant: group.status === "Activo" ? "success" : "warning" },
    } as PageHeaderProps),
    [headerActions, group.status]
  );

  return (
    <div className="p-6 bg-white">
      <CarrierGroupFields group={group} onChange={update} />
    </div>
  );
}
