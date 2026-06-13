"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

import { useFetchWithAuthQA } from "@/lib/http/client";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useAuth } from "@/app/context/auth/AuthContext";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";

import type {
  ApiWaveOrdersResponse,
  PickerByConfigItem,
  PickersByConfigResponse,
} from "../types/api";
import type { OrderRow } from "../types/ola-pedidos";
import {
  mapWaveOrdersToRows,
  resolvePickingPointId,
} from "../services/olaPedidos.mapper";
import { buildCreateSessionPayload } from "../services/createSessionPayload";

/* ── Status display maps ─────────────────────────────────────────────── */

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "default"> = {
  finished: "success",
  active: "info",
  pending: "warning",
};

const STATUS_LABEL: Record<string, string> = {
  finished: "Finalizada",
  active: "En curso",
  pending: "Pendiente",
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

const getErrorText = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
};

/* ── Hook ────────────────────────────────────────────────────────────── */

/**
 * Encapsulates all state & side-effects for the OlaPedidosView.
 *
 * Returns a flat object with:
 *  - data (orders, wave status, picker options, …)
 *  - derived values (selectedItems, selectedCount, …)
 *  - action handlers (toggleOrderExpansion, handlePrepareSelected, …)
 *  - UI booleans (loading, modals open, etc.)
 */
export function useOlaPedidosController() {
  const router = useRouter();
  const params = useParams();
  const olaId = params?.id as string;
  const { fetchWithAuthQA } = useFetchWithAuthQA();
  const { user } = useAuth();

  /* ── Core state ─────────────────────────────────────────────────── */
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(new Set());
  const [waveStatusRaw, setWaveStatusRaw] = useState<string>("pending");
  const [waveIsBlocked, setWaveIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [blockingWave, setBlockingWave] = useState(false);

  /* ── Modal state ────────────────────────────────────────────────── */
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [pickerModalOpen, setPickerModalOpen] = useState(false);

  /* ── Picker selection state ─────────────────────────────────────── */
  const [selectedPickerId, setSelectedPickerId] = useState("");
  const [validateSession, setValidateSession] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<PickerByConfigItem[]>([]);
  const [pickersLoading, setPickersLoading] = useState(false);
  const [pickersError, setPickersError] = useState<string | null>(null);
  const [pickingPointId, setPickingPointId] = useState("");

  /* ── Load wave orders ───────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!olaId) return;
    setLoading(true);
    try {
      const json: ApiWaveOrdersResponse = await fetchWithAuthQA(
        `picking-service/waves/${olaId}`
      );

      setWaveStatusRaw(json?.main?.waveDetail?.status ?? "pending");
      setWaveIsBlocked(Boolean(json?.main?.waveDetail?.isBlocked));
      setPickingPointId(resolvePickingPointId(json));
      setOrders(mapWaveOrdersToRows(json));
      setExpandedOrders(new Set());
      setSelectedItemKeys(new Set());
    } catch (err) {
      console.error("Error loading wave orders:", err);
      setWaveIsBlocked(false);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [olaId, fetchWithAuthQA]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Page header ────────────────────────────────────────────────── */
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/picking/olas/listar-olas"),
      },
    ],
    [router]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Olas
          </div>
          <div className="text-2xl font-semibold text-gray-900">{olaId}</div>
        </div>
      ),
      action: headerActions,
      status: {
        text: STATUS_LABEL[waveStatusRaw] ?? waveStatusRaw,
        variant: STATUS_VARIANT[waveStatusRaw] ?? "default",
      },
    } as PageHeaderProps),
    [headerActions, olaId, waveStatusRaw]
  );

  /* ── Derived values ─────────────────────────────────────────────── */
  const selectedItemsCount = selectedItemKeys.size;

  const selectedDetailItems = useMemo(
    () =>
      orders.flatMap((order) =>
        order.detailItems
          .filter((item) => selectedItemKeys.has(item.key))
          .map((item) => ({ ...item, orderId: order.id }))
      ),
    [orders, selectedItemKeys]
  );

  const selectedItems = useMemo(
    () =>
      selectedDetailItems.map((item) => ({
        orderId: item.orderId,
        orderItemId: item.id,
      })),
    [selectedDetailItems]
  );

  const selectedShippingTypeCodes = useMemo(() => {
    const unique = new Set(
      selectedDetailItems
        .map((item) => item.shippingTypeCode)
        .filter((code) => Boolean(code) && code !== "-")
    );
    return Array.from(unique);
  }, [selectedDetailItems]);

  /* ── Picker loading ─────────────────────────────────────────────── */
  const loadPickersByConfig = useCallback(
    async (validateSessionValue: boolean) => {
      const shippingTypeCodes =
        selectedShippingTypeCodes.length > 0
          ? selectedShippingTypeCodes
          : ["HOME_DELIVERY"];

      setPickersLoading(true);
      setPickersError(null);
      try {
        if (!pickingPointId) {
          setPickerOptions([]);
          setSelectedPickerId("");
          setPickersError("La ola no tiene picking point configurado.");
          return;
        }

        const qs = new URLSearchParams({
          pickingPointId,
          shippingTypeCodes: shippingTypeCodes.join(","),
          validateSession: String(validateSessionValue),
        });

        const res = await fetchWithAuthQA<PickersByConfigResponse>(
          `picking-service/pickers/by-config?${qs.toString()}`
        );

        const items = res?.items ?? [];
        setPickerOptions(items);

        const preferred =
          items.find((p) => String(p.userId) === String(user?.id))?.pickerId ??
          items[0]?.pickerId ??
          "";

        setSelectedPickerId((prev) =>
          items.some((p) => p.pickerId === prev) ? prev : preferred
        );
      } catch (error) {
        console.error("Error fetching pickers by config:", error);
        setPickerOptions([]);
        setSelectedPickerId("");
        setPickersError("No fue posible cargar los pickers disponibles.");
      } finally {
        setPickersLoading(false);
      }
    },
    [fetchWithAuthQA, selectedShippingTypeCodes, user?.id, pickingPointId]
  );

  useEffect(() => {
    if (!pickerModalOpen) return;
    loadPickersByConfig(validateSession);
  }, [pickerModalOpen, validateSession, loadPickersByConfig]);

  /* ── UI handlers ────────────────────────────────────────────────── */
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const toggleItemSelection = (itemKey: string, checked: boolean) => {
    setSelectedItemKeys((prev) => {
      const next = new Set(prev);
      checked ? next.add(itemKey) : next.delete(itemKey);
      return next;
    });
  };

  const toggleSelectAllInOrder = (order: OrderRow, checked: boolean) => {
    setSelectedItemKeys((prev) => {
      const next = new Set(prev);
      const selectable = order.detailItems.filter(
        (item) => item.itemAssignmentStatus?.toLowerCase() === "pending"
      );
      for (const item of selectable) {
        checked ? next.add(item.key) : next.delete(item.key);
      }
      return next;
    });
  };

  const handleOpenCreateSessionModal = () => {
    setValidateSession(false);
    setSelectedPickerId("");
    setPickerOptions([]);
    setPickersError(null);
    setPickerModalOpen(true);
  };

  /* ── Create session ─────────────────────────────────────────────── */
  const handlePrepareSelected = async () => {
    if (!olaId) return;

    if (!selectedPickerId) {
      window.alert("Selecciona un picker para crear la sesion.");
      return;
    }

    const payload = buildCreateSessionPayload(
      selectedPickerId,
      orders,
      selectedItems
    );

    if (!payload) {
      window.alert("Selecciona al menos un item para crear la sesion.");
      return;
    }

    setCreatingSession(true);
    try {
      await fetchWithAuthQA(`picking-service/sessions/round/${olaId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSelectedItemKeys(new Set());
      await load();
      setPickerModalOpen(false);
      window.alert("Sesion creada correctamente.");
    } catch (error: any) {
      const httpStatus = error?.status as number | undefined;
      const errorPayload = error?.payload;
      const errorText = getErrorText(error);

      const isConcurrencyError =
        httpStatus === 409 &&
        (errorText.includes("ITEM_CONCURRENCY_TAKEN") ||
          (typeof errorPayload?.error === "string" &&
            errorPayload.error.includes("ITEM_CONCURRENCY_TAKEN")));

      if (isConcurrencyError) {
        await load();
        setSelectedItemKeys(new Set());
        setPickerModalOpen(false);
        window.alert(
          "No fue posible crear la sesion porque uno o mas items ya fueron asignados en paralelo. " +
          "Se actualizo la ola para reflejar el estado actual."
        );
      } else {
        const detail = errorText || `HTTP ${httpStatus ?? "desconocido"}`;
        window.alert(`No fue posible crear la sesion.\n\nError: ${detail}`);
      }
    } finally {
      setCreatingSession(false);
    }
  };

  /* ── Block wave ─────────────────────────────────────────────────── */
  const handleConfirmBlockWave = async () => {
    if (!olaId) return;

    setBlockingWave(true);
    try {
      await fetchWithAuthQA(`picking-service/waves/${olaId}/block`, {
        method: "PATCH",
        body: JSON.stringify({ isBlocked: true }),
      });

      setWaveIsBlocked(true);
      setBlockModalOpen(false);
      toast.success("Ola bloqueada correctamente.", {
        duration: 4000,
        position: "top-right",
      });
    } catch (error) {
      const detail = getErrorText(error) || "No fue posible bloquear la ola.";
      toast.error(`No fue posible bloquear la ola: ${detail}`, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setBlockingWave(false);
    }
  };

  return {
    // Data
    olaId,
    orders,
    loading,

    // Wave status
    waveIsBlocked,

    // Selection
    expandedOrders,
    selectedItemKeys,
    selectedItemsCount,

    // Session creation
    creatingSession,
    pickerModalOpen,
    selectedPickerId,
    validateSession,
    pickerOptions,
    pickersLoading,
    pickersError,

    // Block wave
    blockingWave,
    blockModalOpen,

    // Handlers
    toggleOrderExpansion,
    toggleItemSelection,
    toggleSelectAllInOrder,
    handleOpenCreateSessionModal,
    handlePrepareSelected,
    handleConfirmBlockWave,
    setBlockModalOpen,
    setPickerModalOpen,
    setSelectedPickerId,
    setValidateSession,
  };
}
