// views\Almacen\AlmacenesView\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import SaveOutlined from "@mui/icons-material/SaveOutlined";

import { AlmacenFields, Warehouse, Estado } from "@/features/almacenes/components/almacenesview/AlmacenFields";
// Usamos tu cliente centralizado de warehouses (mismo estilo que el view)
import { warehouseGet, warehouseGetStats } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { WAREHOUSE_API } from "@/lib/http/endpoints";

const WAREHOUSE_URL = WAREHOUSE_API;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};
/* util: status desde booleano API */
function toStatus(status?: string, active?: boolean): Estado {
  if (status) {
    return String(status).toLowerCase() === "active" ? "Activo" : "Inactivo";
  }
  return active ? "Activo" : "Inactivo";
}

/* estado base vacío (todos editables; los que no vengan de la API quedan en blanco) */
const emptyRecord: Warehouse = {
  // DETALLE
  name: "",
  refId: "",
  location: "",
  group: "",
  canalesVenta: "",
  tareas: "",
  limitarSellers: "false",
  status: "Inactivo",

  // ESQUEMAS
  inbound: "",
  slotting: "",
  consolidacion: "",
  outbound: "",
  cambiosDevoluciones: "",

  // POSICIONES TOTALES
  slots: "",
  ocupacionPercent: "",

  // DISTRIBUCIÓN DE PEDIDOS
  prioridad: "",

  // LÍMITES POR SPRINT
  maxPedidos: "",
  bultos: "",
  items: "",

  // ESTADÍSTICAS
  movimientosPendientes: "",
  porWarehouse: "",
  pedidosCount: "",
  bultosCount: "",
  itemsCount: "",

  // Fechas/usuarios (la API no los trae con username/email, así que los dejamos vacíos)
  created: undefined,
  modified: undefined,

  // extras del form
  pickuppointsIds: "",
  canalesVentaPicking: "",
};

export default function ResumenView() {
  const router = useRouter();
  const params = useParams() as { id?: string }; // viene de /almacen/almacenes/:id
  const code = (params?.id || "").trim();

  const [record, setRecord] = useState<Warehouse>(emptyRecord);
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(!!code);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof Warehouse, value: string) => {
    setRecord((r) => ({ ...r, [field]: value }));
  };

  // ===== carga desde API por id (mismo patrón que el view) =====
  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [api, stats] = await Promise.all([
          warehouseGet(code),
          warehouseGetStats(code),
        ]);
        if (cancelled) return;

        const salesChannels = Array.isArray(api?.salesChannels)
          ? (api?.salesChannels ?? [])
          : [];

        // Mapeamos SOLO lo disponible en la API; el resto queda con emptyRecord
        const next: Warehouse = {
          ...emptyRecord,
          name: api?.name ?? "",
          refId: api?.referenceId ?? api?.code ?? code,
          location: api?.location != null ? String(api.location) : "",
          group: api?.group || api?.groupName || "",
          canalesVenta:
            salesChannels.length > 0
              ? salesChannels.map((id) => String(id)).join(",")
              : "",
          canalesVentaPicking: api?.pickingSalesChannelId ?? "",
          tareas: (api?.tasks ?? []).join(", "),
          slotting: api?.slottingSchemaId ?? "",
          prioridad:
            api?.distributionPriority !== undefined && api?.distributionPriority !== null
              ? String(api.distributionPriority)
              : "",
          limitarSellers:
            typeof api?.limitedToSellers === "boolean"
              ? api.limitedToSellers
                ? "true"
                : "false"
              : api?.movementsRequiresUserValidation
                ? "true"
                : "false",
          status: toStatus(api?.status, api?.isActive),
          movimientosPendientes: String(stats?.pendingMovements?.total ?? ""),
          pedidosCount: String(stats?.pendingMovements?.orders ?? ""),
          bultosCount: String(stats?.pendingMovements?.packages ?? ""),
          itemsCount: String(stats?.pendingMovements?.skus ?? ""),
          created:
            api?.createdAt || api?.userCreated
              ? {
                username: api?.userCreated ?? "—",
                email: api?.userCreated ?? "",
                date: api?.createdAt ? new Date(api.createdAt).toLocaleString("es-CL") : "",
              }
              : undefined,
          modified:
            api?.updatedAt || api?.userModified
              ? {
                username: api?.userModified ?? "—",
                email: api?.userModified ?? "",
                date: api?.updatedAt ? new Date(api.updatedAt).toLocaleString("es-CL") : "",
              }
              : undefined,
        };

        setWarehouseId(String(api?.id ?? code ?? ""));
        setRecord(next);
      } catch (error: unknown) {
        if (!cancelled) setError(getErrorMessage(error, "No se pudo cargar el almacen."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  const toApiStatus = (value: Warehouse["status"]): "active" | "inactive" =>
    value === "Activo" ? "active" : "inactive";

  const toBoolean = (value: string | undefined): boolean => String(value ?? "").toLowerCase() === "true";

  const parseLocation = (value: string | undefined): number | null => {
    const parsed = Number(String(value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseDistributionPriority = (value: string | undefined): number => {
    const parsed = Number(String(value ?? "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseTasks = (value: string | undefined): string[] =>
    String(value ?? "")
      .split(",")
      .map((task) => task.trim())
      .filter(Boolean);

  const handleSave = useCallback(async () => {
    const targetId = String(warehouseId || code).trim();
    if (!targetId) {
      setError("No se encontró id de warehouse para actualizar.");
      return;
    }

    const payload: Record<string, unknown> = {
      name: String(record.name ?? "").trim(),
      referenceId: String(record.refId ?? "").trim(),
      location: parseLocation(record.location),
      group: String(record.group ?? "").trim(),
      tasks: parseTasks(record.tareas),
      distributionPriority: parseDistributionPriority(record.prioridad),
      externalDistribution: false,
      movementsRequiresUserValidation: toBoolean(record.limitarSellers),
      timezone: "America/Santiago",
      status: toApiStatus(record.status),
      ...(String(record.slotting ?? "").trim()
        ? {
            schemas: {
              slotting: {
                id: String(record.slotting ?? "").trim(),
              },
            },
          }
        : {}),
    };

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${WAREHOUSE_URL}/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        headers: withAuthPlatformHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${response.statusText}${detail ? ` - ${detail}` : ""}`);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "No se pudo actualizar el warehouse."));
    } finally {
      setSaving(false);
    }
  }, [warehouseId, code, record]);

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => {
          void handleSave();
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: saving,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => {
          void handleSave();
        },
        icon: <SaveOutlined className="h-5 w-5" />,
        disabled: saving,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/almacen/almacenes"),
        icon: <XCircleIcon className="h-5 w-5" />,
        disabled: saving,
      },
    ],
    [router, saving, handleSave]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Almacenes</div>
          <div className="text-2xl font-semibold text-gray-900">#{record.refId || code || "—"}</div>
        </div>
      ),
      action: headerActions,
      status: {
        text: record.status,
        variant: record.status === "Activo" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [headerActions, record.refId, record.status, code]
  );

  return (
    <div className="p-6 bg-white">
      {/* Estados simples */}
      {loading && <div className="text-sm text-gray-500">Cargando almacén…</div>}
      {error && <div className="mb-3 text-sm text-red-600">Error: {error}</div>}

      <AlmacenFields record={record} onChange={handleChange} />

      {/* Toggle simple para edición inline (opcional) */}
      <div className="text-right">
        <button
          className="rounded-md bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
        >
        </button>
      </div>
    </div>
  );
}
