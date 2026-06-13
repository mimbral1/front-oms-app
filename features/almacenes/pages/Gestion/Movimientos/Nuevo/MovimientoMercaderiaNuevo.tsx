"use client";

import React, { useMemo, useState } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { useRouter } from "next/navigation";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { FaPlus } from "react-icons/fa";
import { OrderFields, Order } from "@/features/almacenes/components/movimientos/MovimientoMercaderiaFields";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { toast } from "react-hot-toast";

const MOVEMENT_URL = `${BASE_WAREHOUSES}/movement`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
  "Content-Type": "application/json",
});

type CreateMovementPayload = {
  type: "replenishment";
  source: {
    warehouseId: string;
    positionId: string;
  };
  destination: {
    warehouseId: string;
    positionId: string;
  };
  content: {
    skuId: string;
    quantity: number;
  };
};

export function MovementCreatePage() {
  const router = useRouter();

  const initialOrder: Order = {
    sourceWarehouse: "",
    sourcePosition: "",
    destWarehouse: "",
    destPosition: "",
    dateStarted: "",
    timeStarted: "",
    dateEnded: "",
    timeEnded: "",
    order: "",
    packageCount: "",
    barcode: "",
    sku: "",
    quantity: "",
    assignee: "",
    receiver: "",
  };

  const [order, setOrder] = useState<Order>(initialOrder);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof Order, value: string) => {
    setOrder((prev) => ({ ...prev, [field]: value }));
  };

  const createMovement = async (): Promise<boolean> => {
    const sourceWarehouseId = String(order.sourceWarehouse || "").trim();
    const sourcePositionId = String(order.sourcePosition || "").trim();
    const destinationWarehouseId = String(order.destWarehouse || "").trim();
    const destinationPositionId = String(order.destPosition || "").trim();
    const skuId = String(order.sku || "").trim();
    const quantity = Number(order.quantity);

    if (!sourceWarehouseId) {
      toast.error("Selecciona el warehouse source");
      return false;
    }
    if (!sourcePositionId) {
      toast.error("Selecciona la position source");
      return false;
    }
    if (!destinationWarehouseId) {
      toast.error("Selecciona el warehouse destination");
      return false;
    }
    if (!destinationPositionId) {
      toast.error("Selecciona la position destination");
      return false;
    }
    if (!skuId) {
      toast.error("Ingresa el SKU");
      return false;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return false;
    }

    const payload: CreateMovementPayload = {
      type: "replenishment",
      source: {
        warehouseId: sourceWarehouseId,
        positionId: sourcePositionId,
      },
      destination: {
        warehouseId: destinationWarehouseId,
        positionId: destinationPositionId,
      },
      content: {
        skuId,
        quantity,
      },
    };

    try {
      setSubmitting(true);
      const response = await fetch(MOVEMENT_URL, {
        method: "POST",
        headers: JANIS_HEADERS,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP ${response.status}`);
      }

      toast.success("Movimiento creado correctamente");
      return true;
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear el movimiento");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: async () => {
          const ok = await createMovement();
          if (ok) router.push("/almacen/gestion/movimiento");
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: submitting,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: async () => {
          const ok = await createMovement();
          if (ok) router.push("/almacen/gestion/movimiento");
        },
        icon: <SaveOutlined className="h-4 w-4" />,
        disabled: submitting,
      },
      {
        label: "Guardar y Crear nuevo",
        variant: "primary",
        onClick: async () => {
          const ok = await createMovement();
          if (ok) setOrder(initialOrder);
        },
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-blue-500" />
            </div>
          </div>
        ),
        disabled: submitting,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/almacen/gestion/movimiento"),
        icon: <XCircleIcon className="h-5 w-5" />,
        disabled: submitting,
      },
    ],
    [order, submitting, router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Movimiento</div>
          <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
        </div>
      ),
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

  return (
    <div className="p-6 bg-white">
      <OrderFields order={order} readOnly={false} onChange={handleChange} />
    </div>
  );
}
