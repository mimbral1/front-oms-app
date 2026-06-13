"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownOnSquareIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { fetchIssueEnvios } from "@/app/fetchWithAuth/api-pedidos/pedidos";
import { useAuth } from "@/app/context/auth/AuthContext";
import { extractOrderId } from "@/utils/pedido";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action } from "@/components/layout/page-header";
import { RoundsExpandableList, type PedidoRound } from "@/features/pedidos/components/detalles-pedido/RoundsExpandableList";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { WAREHOUSE_API } from "@/lib/http/endpoints";

type EnviosIssueResponse = {
  envios?: Array<{
    envio?: string;
    entrega?: string;
    deliveryCompanyName?: string;
    origen?: string[];
    destino?: string;
    rangoEntrega?: {
      timeSlotId?: string | null;
      deliveryDate?: string;
    };
    pedidos?: string;
    status?: string;
  }>;
};

type WarehouseApiRow = {
  name?: string;
  referenceId?: string;
};

const WAREHOUSE_URL = `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`;
const WAREHOUSE_TIMEOUT_MS = 4000;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

async function fetchWarehousesSafe(): Promise<WarehouseApiRow[]> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), WAREHOUSE_TIMEOUT_MS);

  try {
    const response = await fetch(WAREHOUSE_URL, {
      method: "GET",
      headers: withAuthPlatformHeaders({
        "x-janis-page": "1",
        "x-janis-page-size": "20",
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as WarehouseApiRow[];
  } catch {
    return [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export function ShipmentsView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [shipments, setShipments] = useState<PedidoRound[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = extractOrderId(id);
    if (!orderId || !token) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const warehouses = await fetchWarehousesSafe();

        const warehouseByReferenceId = new Map<string, string>();
        (warehouses || []).forEach((warehouse) => {
          const ref = String(warehouse.referenceId || "").trim();
          const name = String(warehouse.name || "").trim();
          if (ref) warehouseByReferenceId.set(ref, name || ref);
        });

        const response = await fetchIssueEnvios<EnviosIssueResponse>(token, orderId);
        const mapped: PedidoRound[] = (response?.envios || []).map((envio, index) => ({
          id: `envio-${index + 1}`,
          sessionId: `${envio.envio || "envio"}-${index}`,
          shipmentCode: envio.envio || "-",
          entregaDate: fmtDate(envio.entrega),
          origen: (envio.origen || [])
            .map((referenceId) => {
              const key = String(referenceId || "").trim();
              return warehouseByReferenceId.get(key) || key;
            })
            .filter(Boolean)
            .join(", ") || "-",
          destino: envio.destino || "-",
          rangoEntrega: fmtDate(envio.rangoEntrega?.deliveryDate),
          pedidosLabel: envio.pedidos || "-",
          status: envio.status || "-",
          assigned: null,
          date: "-",
          resultados: [],
        }));

        if (!cancelled) setShipments(mapped);
      } catch (error: unknown) {
        if (!cancelled) setError(getErrorMessage(error, "Error al cargar los envios"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        disabled: true,
        onClick: () => {},
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      { label: "Guardar", variant: "success", onClick: () => {}, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Guardar & Crear nuevo", variant: "success", onClick: () => {}, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Volver al listado", variant: "secondary", onClick: () => router.push("/pedidos/listado-pedidos"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router],
  );

  usePageHeader(
    () => ({
      title: `PEDIDO #${id}`,
      action: headerActions,
      status: { text: "Pendiente", variant: "warning" },
    }),
    [id, headerActions],
  );

  return (
    <>
      {isLoading && (
        <div className="flex justify-center py-12">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <RoundsExpandableList
          rounds={shipments}
          mode="shipments"
          emptyText="No hay envios para este pedido."
        />
      )}
    </>
  );
}
