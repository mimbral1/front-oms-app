"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { SlotsFields, Slot } from "@/features/almacenes/components/configuraciones/slots/OrderFields";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
type ApiPosition = {
  id: string;
  warehouseId?: string | null;
  schemaType?: string | null;
  schemaName?: string | null;
  positionKey?: string | null;
  stockAllocationType?: string | null;
  allowStoreDifferentSkus?: boolean | null;
  allowStoreDifferentSkuVariations?: boolean | null;
  fastMoving?: boolean | null;
  pickingOrder?: number | null;
  status?: string | null;
  dateCreated?: string | null;
  dateModified?: string | null;
  userCreated?: string | null;
  userModified?: string | null;
};

const POSITION_BASE_URL = `${BASE_WAREHOUSES}/position`;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function formatLabel(value?: string | null): string {
  if (!value) return "-";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function SlotsResumenPage() {
  const params = useParams();
  const id = String(params?.id || "").trim();
  const router = useRouter();

  const [slotData, setSlotData] = useState<(Slot & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSlot = async () => {
      if (!id) {
        if (mounted) {
          setError("ID de slot inválido.");
          setSlotData(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [positionRes, warehousesRes] = await Promise.all([
          fetch(`${POSITION_BASE_URL}/${encodeURIComponent(id)}`, {
            method: "GET",
            headers: withAuthPlatformHeaders(),
          }),
          warehousesAll().catch(() => ({ items: [], total: 0 })),
        ]);

        if (!positionRes.ok) {
          throw new Error(`HTTP ${positionRes.status}`);
        }

        const data = (await positionRes.json()) as ApiPosition;
        const warehouseName =
          warehousesRes.items.find((w) => w.id === data.warehouseId)?.name ||
          data.warehouseId ||
          "-";

        const mapped: Slot & { id: string } = {
          id: data.id,
          inventory: String(warehouseName),
          schemaType: formatLabel(data.schemaType),
          schemaName: data.schemaName || "-",
          positionCode: data.positionKey || "-",
          state: String(data.status || "").toLowerCase() === "active" ? "ACTIVO" : "INACTIVO",
          config: {
            positionType:
              String(data.stockAllocationType || "").toLowerCase() === "picking"
                ? "Picking"
                : "Packing",
            allowMultipleSkus: Boolean(data.allowStoreDifferentSkus),
            allowSkuVariations: Boolean(data.allowStoreDifferentSkuVariations),
            highRotation: Boolean(data.fastMoving),
            pickingOrder:
              data.pickingOrder === null || data.pickingOrder === undefined
                ? ""
                : String(data.pickingOrder),
          },
          created: {
            username: data.userCreated || "-",
            email: "-",
            date: formatDate(data.dateCreated),
          },
          modified: {
            username: data.userModified || "-",
            email: "-",
            date: formatDate(data.dateModified),
          },
        };

        if (!mounted) return;
        setSlotData(mapped);
      } catch (error: unknown) {
        if (!mounted) return;
        setSlotData(null);
        setError(getErrorMessage(error, "No se pudo cargar el slot."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadSlot();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = <K extends keyof Slot>(field: K, value: Slot[K]) => {
    setSlotData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-3 w-3" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/almacen/configuracion/slots"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  usePageHeader(
    () =>
    ({
      title: slotData?.id || id || "Slot",
      description: slotData?.state === "INACTIVO" ? "Pending" : "",
      action: headerActions,
      status: {
        text: slotData?.state || "PENDIENTE",
        variant: slotData?.state === "ACTIVO" ? "success" : "warning",
      },
    } as PageHeaderProps),
    [id, slotData?.id, slotData?.state, headerActions]
  );

  return (
    <div className="p-6 bg-white">
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Cargando slot...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" /> {error}
          </div>
        </div>
      )}

      {slotData ? (
        <SlotsFields slot={slotData} onChange={handleChange} />
      ) : !loading && !error ? (
        <p className="p-4 text-center text-red-500">Slot no encontrado</p>
      ) : null}
    </div>
  );
}
