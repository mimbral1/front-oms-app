// views\Almacen\Gestion\Ingreso\Items\ItemsView.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XCircleIcon,
  TagIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { type StatusVariant } from "@/components/ui/badge/status";
import { useFetchWithAuth } from "@/lib/http/client";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { Pagination } from "@/components/ui/pagination";
import { ActionButton } from "@/components/ui/button/action-button";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { useAuth } from "@/app/context/auth/AuthContext";

/* ────────────────────────────────────────────────────────────────
   Tipos
──────────────────────────────────────────────────────────────── */
export interface OrderItem {
  id: string;
  image: string | null;
  name: string | null;
  sku: string | null;
  quantity: number | null;   // orderedQty
  variation: number | null;  // orderedQty - openQty
  result: number | null;     // openQty
  location: string | null;   // "1 # {openQty}"
  status?: string | null;    // "Abierto" | "Cerrado" | null
  _raw?: any;
}

type AuditEstado = "Recibido" | "Pendiente" | "Rechazado";

type SupplyingBaseItem = {
  skuId?: string | null;
  skuReferenceId?: string | null;
  quantity?: number | null;
};

type SupplyingPosition = {
  positionId?: string | null;
  quantity?: number | null;
};

type PositionDetailResponse = {
  id?: string | null;
  positionId?: string | null;
  positionKey?: string | null;
};

type SupplyingResult = {
  quantity?: number | null;
  positions?: SupplyingPosition[] | null;
  date?: string | null;
  comment?: string | null;
  status?: string | null;
};

type SupplyingAuditItem = {
  skuId?: string | null;
  skuReferenceId?: string | null;
  variation?: {
    batch?: string | null;
    expirationDate?: string | null;
    elaborationDate?: string | null;
  } | null;
  supplyingResult?: SupplyingResult | null;
};

type SupplyingDetailResponse = {
  items?: SupplyingBaseItem[] | null;
  auditResult?: {
    items?: SupplyingAuditItem[] | null;
  } | null;
  status?: string | null;
};

type FallbackSupplyingItemResponse = {
  id?: string | null;
  skuId?: string | null;
  skuReferenceId?: string | null;
  quantityOrdered?: number | null;
  quantityReceived?: number | null;
  batch?: string | null;
  expirationDate?: string | null;
  elaborationDate?: string | null;
  motiveRefId?: string | null;
  comment?: string | null;
  status?: string | null;
};

type UiSupplyingResultRow = {
  id: string;
  status: AuditEstado;
  quantity: number;
};

type UiSlotRow = {
  id: string;
  positionKey: string;
  quantity: number;
};

type GroupedAuditItem = {
  sku: string;
  variation: {
    batch?: string | null;
    expirationDate?: string | null;
    elaborationDate?: string | null;
  };
  supplyingResults: SupplyingResult[];
};

const PER_PAGE = 10;
const SUPPLYING_URL = `${BASE_WAREHOUSES}/supplying`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
});

const mapSupplyingStatusLabel = (status?: string | null): string => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "received") return "Recibido";
  if (normalized === "rejected") return "Rechazado";
  if (normalized === "pending") return "Pendiente";
  return status ? String(status) : "--";
};

const rawStatusToAuditEstado = (status?: string | null): AuditEstado => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "rejected") return "Rechazado";
  if (normalized === "pending") return "Pendiente";
  return "Recibido";
};

const auditEstadoToApiStatus = (status: AuditEstado): "received" | "pending" | "rejected" => {
  if (status === "Rechazado") return "rejected";
  if (status === "Pendiente") return "pending";
  return "received";
};

const statusVariant = (txt?: string | null): StatusVariant => {
  const normalized = String(txt || "").toLowerCase();
  if (normalized === "abierto" || normalized === "recibido") return "success";
  if (normalized === "cerrado") return "info";
  if (normalized === "pendiente") return "pending";
  if (normalized === "rechazado") return "error";
  return "info";
};

// helpers UI
const txt = (v?: string | null) => (v && String(v).trim() ? String(v) : "--");
const num = (v?: number | null) => (Number.isFinite(v as number) ? (v as number) : ("--" as any));

/* ────────────────────────────────────────────────────────────────
   Vista
──────────────────────────────────────────────────────────────── */
export default function ItemsView() {
  const params = useParams();
  const orderId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const { fetchWithAuth } = useFetchWithAuth();
  const { user } = useAuth();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ids expandidos (cada fila independiente)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // estado UI del audit item (mock) por fila (key: id)
  const [supplyingResultsById, setSupplyingResultsById] = useState<Record<string, UiSupplyingResultRow[]>>({});
  const [slotsById, setSlotsById] = useState<Record<string, UiSlotRow[]>>({});

  const loggedUserId = useMemo(() => {
    const fromContext = String((user as any)?.id ?? (user as any)?.ID ?? (user as any)?.userId ?? "").trim();
    if (fromContext) return fromContext;

    try {
      const authState = JSON.parse(localStorage.getItem("authState") || "{}");
      const fallback = String(
        authState?.user?.id ?? authState?.user?.ID ?? authState?.user?.userId ?? authState?.user?.usuarioId ?? ""
      ).trim();
      return fallback || "local";
    } catch {
      return "local";
    }
  }, [user]);

  const handleSaveAuditItems = React.useCallback(async () => {
    if (!orderId) {
      setSaveMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    const nowIso = new Date().toISOString();

    const payloadItems = items.flatMap((row) => {
      const skuId = String(row.sku || row._raw?.sku || "").trim();
      if (!skuId) return [];

      const supplyingRows = (supplyingResultsById[row.id] || []).filter(
        (resultRow) => Number.isFinite(Number(resultRow.quantity)) && Number(resultRow.quantity) >= 0
      );

      const slotRows = (slotsById[row.id] || []).filter(
        (slotRow) =>
          String(slotRow.positionKey || "").trim() &&
          String(slotRow.positionKey || "").trim() !== "-" &&
          Number.isFinite(Number(slotRow.quantity)) &&
          Number(slotRow.quantity) > 0
      );

      const keyToId = (row._raw?.positionKeyToId || {}) as Record<string, string>;
      const positions = slotRows
        .map((slotRow) => {
          const key = String(slotRow.positionKey || "").trim();
          const resolvedPositionId = String(keyToId[key] || key).trim();
          return {
            positionId: resolvedPositionId,
            quantity: Number(slotRow.quantity),
          };
        })
        .filter((position) => Boolean(position.positionId));

      const variation: Record<string, string> = {};
      if (row._raw?.batch) variation.batch = String(row._raw.batch);
      if (row._raw?.expirationDate) variation.expirationDate = String(row._raw.expirationDate);
      if (row._raw?.elaborationDate) variation.elaborationDate = String(row._raw.elaborationDate);

      return supplyingRows.map((resultRow) => ({
        skuId,
        variation,
        supplyingResult: {
          quantity: Number(resultRow.quantity),
          positions,
          date: nowIso,
          userId: loggedUserId,
          comment: String(row._raw?.comment || "").trim() || null,
          motiveRefId: null,
          status: auditEstadoToApiStatus(resultRow.status),
        },
      }));
    });

    if (payloadItems.length === 0) {
      setSaveMessage({ type: "error", text: "No hay cambios válidos para guardar." });
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    try {
      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(orderId)}/income-control`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!response.ok) {
        let detail = "";
        try {
          const errorPayload = await response.json();
          detail = String(errorPayload?.message ?? errorPayload?.error ?? "").trim();
        } catch {
          try {
            detail = String(await response.text()).trim();
          } catch {
            detail = "";
          }
        }
        throw new Error(detail || `HTTP ${response.status}`);
      }

      setSaveMessage({ type: "success", text: "Auditar items guardado correctamente." });
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error?.message || "No se pudo guardar auditar items." });
    } finally {
      setSaving(false);
    }
  }, [items, loggedUserId, orderId, slotsById, supplyingResultsById]);

  // Header actions
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: saving ? "Aplicando..." : "Aplicar",
        variant: "success",
        disabled: loading || saving || items.length === 0,
        onClick: handleSaveAuditItems,
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: saving ? "Guardando..." : "Guardar",
        variant: "success",
        disabled: loading || saving || items.length === 0,
        onClick: handleSaveAuditItems,
        icon: <SaveOutlined className="h-4 w-4" />,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        disabled: true,
        icon: (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <SaveOutlined className="h-4 w-4 text-current" />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-gray-200 p-[1px]">
              <FaPlus className="h-2.5 w-2.5 text-gray-600" />
            </div>
          </div>
        ),
      },
      { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => window.history.back() },
    ],
    [handleSaveAuditItems, items.length, loading, saving]
  );

  // Status header (docStatus O/C)
  const headerStatus = useMemo(() => {
    if (!items.length) return { text: "—", variant: "info" as const };
    const allReceived = items.every((item) => String(item._raw?.status || "").toLowerCase() === "received");
    if (allReceived) return { text: "Cerrado", variant: "info" as const };
    return { text: "Abierto", variant: "success" as const };
  }, [items]);

  const formatDateValue = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("es-CL");
  };

  const formatDateTimeValue = (value?: string | null) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("es-CL");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Órdenes de compra</div>
          <div className="text-2xl font-semibold text-gray-900">
            #{orderId ?? "—"} <span className="text-gray-400">— Ítems</span>
          </div>
        </div>
      ),
      action: headerActions,
      status: headerStatus,
    } as unknown as PageHeaderProps),
    [orderId, headerActions, headerStatus]
  );

  /* Carga: supplying/{id} usando auditResult.items */
  useEffect(() => {
    const load = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        setErr(null);

        const supplyingResponse = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(orderId)}`, {
          method: "GET",
          headers: JANIS_HEADERS,
        });

        if (!supplyingResponse.ok) {
          throw new Error(`HTTP ${supplyingResponse.status}`);
        }

        const payload = (await supplyingResponse.json()) as SupplyingDetailResponse | FallbackSupplyingItemResponse[] | { data?: FallbackSupplyingItemResponse[] };

        let auditItems: SupplyingAuditItem[] = [];
        let baseItems: SupplyingBaseItem[] = [];
        let documentStatus = "";

        if (Array.isArray(payload)) {
          // Fallback de compatibilidad con endpoint /item antiguo
          auditItems = payload.map((item) => ({
            skuId: item.skuId,
            skuReferenceId: item.skuReferenceId,
            variation: {
              batch: item.batch,
              expirationDate: item.expirationDate,
              elaborationDate: item.elaborationDate,
            },
            supplyingResult: {
              quantity: item.quantityReceived,
              date: null,
              comment: item.comment,
              status: item.status,
              positions: [],
            },
          }));
          baseItems = payload.map((item) => ({
            skuId: item.skuId,
            skuReferenceId: item.skuReferenceId,
            quantity: item.quantityOrdered,
          }));
        } else {
          const detail = payload as SupplyingDetailResponse;
          auditItems = Array.isArray(detail.auditResult?.items) ? detail.auditResult!.items! : [];
          baseItems = Array.isArray(detail.items) ? detail.items! : [];
          documentStatus = String(detail.status || "");
        }

        const baseBySku = new Map(
          baseItems.map((item) => [
            String(item.skuReferenceId || item.skuId || "").trim(),
            Number(item.quantity ?? 0),
          ])
        );

        const sourceItems: SupplyingAuditItem[] =
          auditItems.length > 0
            ? auditItems
            : baseItems.map((item) => ({
              skuId: item.skuId,
              skuReferenceId: item.skuReferenceId,
              variation: {},
              supplyingResult: {
                quantity: item.quantity,
                positions: [],
                status: documentStatus || "pending",
                comment: null,
                date: null,
              },
            }));

        const groupedBySku = new Map<string, GroupedAuditItem>();
        sourceItems.forEach((item) => {
          const sku = String(item.skuReferenceId || item.skuId || "").trim();
          if (!sku) return;

          const existing = groupedBySku.get(sku);
          const itemVariation = item.variation || {};
          const currentResult = item.supplyingResult || {
            quantity: 0,
            positions: [],
            status: documentStatus || "pending",
            comment: null,
            date: null,
          };

          if (!existing) {
            groupedBySku.set(sku, {
              sku,
              variation: {
                batch: itemVariation.batch ?? null,
                expirationDate: itemVariation.expirationDate ?? null,
                elaborationDate: itemVariation.elaborationDate ?? null,
              },
              supplyingResults: [currentResult],
            });
            return;
          }

          existing.variation = {
            batch: existing.variation.batch ?? itemVariation.batch ?? null,
            expirationDate: existing.variation.expirationDate ?? itemVariation.expirationDate ?? null,
            elaborationDate: existing.variation.elaborationDate ?? itemVariation.elaborationDate ?? null,
          };
          existing.supplyingResults.push(currentResult);
        });

        const groupedItems = Array.from(groupedBySku.values());

        const uniqueSkus = groupedItems.map((item) => item.sku);

        const uniquePositionIds = Array.from(
          new Set(
            groupedItems
              .flatMap((item) => item.supplyingResults)
              .flatMap((result) => (Array.isArray(result.positions) ? result.positions : []))
              .map((position) => String(position?.positionId || "").trim())
              .filter(Boolean)
          )
        );

        type CatalogResp = { Image?: string; Name?: string; SKU?: string };
        const skuToProduct = new Map<string, CatalogResp>();
        const positionIdToKey = new Map<string, string>();

        await Promise.all(
          uniqueSkus.map(async (sku) => {
            try {
              const prod = await fetchWithAuth<CatalogResp>(`catalog/products/${encodeURIComponent(sku)}`, { method: "GET" });
              skuToProduct.set(sku, prod || {});
            } catch {
              skuToProduct.set(sku, {});
            }
          })
        );

        await Promise.all(
          uniquePositionIds.map(async (positionId) => {
            try {
              const positionResponse = await fetch(`${BASE_WAREHOUSES}/position/${encodeURIComponent(positionId)}`, {
                method: "GET",
                headers: JANIS_HEADERS,
              });

              if (!positionResponse.ok) {
                positionIdToKey.set(positionId, positionId);
                return;
              }

              const positionPayload = (await positionResponse.json()) as PositionDetailResponse;
              const resolvedKey = String(
                positionPayload?.positionKey ?? positionPayload?.positionId ?? positionPayload?.id ?? positionId
              ).trim() || positionId;
              positionIdToKey.set(positionId, resolvedKey);
            } catch {
              positionIdToKey.set(positionId, positionId);
            }
          })
        );

        const mapped: OrderItem[] = groupedItems.map((item, idx) => {
          const sku = item.sku;
          const prod = skuToProduct.get(sku) || {};
          const supplyingResults = item.supplyingResults;
          const firstResult = supplyingResults[0] || {};
          const firstPosition = Array.isArray(firstResult.positions) ? firstResult.positions[0] : undefined;
          const resolvedFirstPositionKey = firstPosition?.positionId
            ? (positionIdToKey.get(String(firstPosition.positionId).trim()) || String(firstPosition.positionId))
            : null;

          const quantityOrdered = Number(baseBySku.get(sku) ?? firstResult.quantity ?? 0);
          const totalReceived = supplyingResults.reduce((acc, result) => {
            const n = Number(result.quantity);
            return Number.isFinite(n) ? acc + n : acc;
          }, 0);
          const quantityReceived = totalReceived;
          const qty = Number.isFinite(quantityOrdered) ? quantityOrdered : null;
          const received = Number.isFinite(quantityReceived) ? quantityReceived : null;
          const variation = qty != null && received != null ? Math.max(0, qty - received) : null;
          const rawStatus = String(firstResult.status || documentStatus || "pending").toLowerCase();

          const normalizedResults = supplyingResults.map((result, resultIndex) => {
            const rawResultStatus = String(result.status || rawStatus || "pending").toLowerCase();
            return {
              id: `${orderId}-${sku}-sr-${resultIndex}`,
              status: rawStatusToAuditEstado(rawResultStatus),
              quantity: Number.isFinite(Number(result.quantity)) ? Number(result.quantity) : 0,
            };
          });

          const normalizedPositions = supplyingResults
            .flatMap((result) => (Array.isArray(result.positions) ? result.positions : []))
            .map((position, positionIndex) => {
              const rawPositionId = String(position?.positionId || "").trim();
              const resolvedPositionKey = rawPositionId ? (positionIdToKey.get(rawPositionId) || rawPositionId) : "";
              return {
                id: `${orderId}-${sku}-sl-${positionIndex}`,
                positionId: rawPositionId,
                positionKey: resolvedPositionKey,
                quantity: Number.isFinite(Number(position?.quantity)) ? Number(position?.quantity) : 0,
              };
            });

          return {
            id: `${orderId}-${sku || "sku"}`,
            image: prod.Image ?? null,
            sku: sku || null,
            name: prod.Name ?? null,
            quantity: qty,
            variation,
            result: received,
            location: resolvedFirstPositionKey,
            status: mapSupplyingStatusLabel(rawStatus),
            _raw: {
              sku,
              batch: item.variation?.batch ?? null,
              expirationDate: item.variation?.expirationDate ?? null,
              elaborationDate: item.variation?.elaborationDate ?? null,
              comment: firstResult.comment ?? null,
              status: rawStatus,
              dateReceived: firstResult.date ?? null,
              positions: normalizedPositions,
              supplyingResults: normalizedResults,
              positionId: firstPosition?.positionId ?? null,
              positionKey: resolvedFirstPositionKey,
              positionKeyToId: normalizedPositions.length > 0
                ? normalizedPositions.reduce((acc, position) => {
                  const rawPositionId = String(position?.positionId || "").trim();
                  if (!rawPositionId) return acc;
                  const resolvedPositionKey = positionIdToKey.get(rawPositionId) || rawPositionId;
                  acc[resolvedPositionKey] = rawPositionId;
                  return acc;
                }, {} as Record<string, string>)
                : {},
            },
          };
        });

        const initialSupplyingRowsById: Record<string, UiSupplyingResultRow[]> = {};
        const initialSlotsById: Record<string, UiSlotRow[]> = {};

        mapped.forEach((row) => {
          const rawPositions = Array.isArray(row._raw?.positions) ? row._raw.positions : [];
          const baseResultQty = Number(row.result ?? 0);

          const rawSupplyingResults = Array.isArray(row._raw?.supplyingResults) ? row._raw.supplyingResults : [];
          initialSupplyingRowsById[row.id] =
            rawSupplyingResults.length > 0
              ? rawSupplyingResults
              : [
                {
                  id: `${row.id}-sr-0`,
                  status: rawStatusToAuditEstado(row._raw?.status),
                  quantity: Number.isFinite(baseResultQty) ? baseResultQty : 0,
                },
              ];

          const slotRows: UiSlotRow[] = rawPositions
            .map((position: any, index: number) => ({
              id: String(position?.id || `${row.id}-sl-${index}`),
              positionKey: String(position?.positionKey || position?.positionId || "-").trim() || "-",
              quantity: Number.isFinite(Number(position?.quantity)) ? Number(position.quantity) : 0,
            }))
            .filter((slot: UiSlotRow) => Boolean(slot.positionKey));

          initialSlotsById[row.id] =
            slotRows.length > 0
              ? slotRows
              : [
                {
                  id: `${row.id}-sl-0`,
                  positionKey: String(row._raw?.positionKey || "-").trim() || "-",
                  quantity: Number.isFinite(baseResultQty) ? baseResultQty : 0,
                },
              ];
        });

        setItems(mapped);
        setExpandedIds(new Set(mapped.map((item) => item.id)));
        setSupplyingResultsById(initialSupplyingRowsById);
        setSlotsById(initialSlotsById);
      } catch (e: any) {
        setErr(e?.message || "Error cargando ítems");
        setItems([]);
        setExpandedIds(new Set());
        setSupplyingResultsById({});
        setSlotsById({});
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  const totalRecords = items.length;

  const startIndex = (currentPage - 1) * PER_PAGE;
  const paginated = items.slice(startIndex, startIndex + PER_PAGE);

  // toggle por fila
  const toggleRow = (id: string, defaultQty: number | null) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSupplyingResultsById((prev) => {
      if (prev[id]?.length) return prev;
      return {
        ...prev,
        [id]: [
          {
            id: `${id}-sr-fallback`,
            status: "Recibido",
            quantity: Number.isFinite(Number(defaultQty)) ? Number(defaultQty) : 0,
          },
        ],
      };
    });
    setSlotsById((prev) => {
      if (prev[id]?.length) return prev;
      return {
        ...prev,
        [id]: [
          {
            id: `${id}-sl-fallback`,
            positionKey: "-",
            quantity: Number.isFinite(Number(defaultQty)) ? Number(defaultQty) : 0,
          },
        ],
      };
    });
  };

  const addSupplyingResultRow = (itemId: string) => {
    setSupplyingResultsById((prev) => {
      const current = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: [
          ...current,
          {
            id: `${itemId}-sr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            status: "Recibido",
            quantity: 0,
          },
        ],
      };
    });
  };

  const updateSupplyingResultRow = (
    itemId: string,
    rowId: string,
    patch: Partial<UiSupplyingResultRow>
  ) => {
    setSupplyingResultsById((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || []).map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));
  };

  const removeSupplyingResultRow = (itemId: string, rowId: string) => {
    setSupplyingResultsById((prev) => {
      const current = prev[itemId] || [];
      const filtered = current.filter((row) => row.id !== rowId);
      return {
        ...prev,
        [itemId]: filtered.length > 0 ? filtered : current,
      };
    });
  };

  const addSlotRow = (itemId: string) => {
    setSlotsById((prev) => {
      const current = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: [
          ...current,
          {
            id: `${itemId}-sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            positionKey: "-",
            quantity: 0,
          },
        ],
      };
    });
  };

  const updateSlotRow = (itemId: string, rowId: string, patch: Partial<UiSlotRow>) => {
    setSlotsById((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || []).map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    }));
  };

  const removeSlotRow = (itemId: string, rowId: string) => {
    setSlotsById((prev) => {
      const current = prev[itemId] || [];
      const filtered = current.filter((row) => row.id !== rowId);
      return {
        ...prev,
        [itemId]: filtered.length > 0 ? filtered : current,
      };
    });
  };

  return (
    <div className="flex-1 bg-[#f3f5fb]">
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 mb-4">
          Cargando ítems…
        </div>
      )}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
          {err}
        </div>
      )}
      {saveMessage && (
        <div
          className={`mb-4 rounded-lg border p-4 text-sm ${saveMessage.type === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="space-y-5 rounded-xl bg-white p-4 shadow-sm md:p-6">
        {paginated.map((row, index) => {
          const isOpen = expandedIds.has(row.id);
          const supplyingResultRows = supplyingResultsById[row.id] || [];
          const slotRows = slotsById[row.id] || [];
          const rawPositions = Array.isArray(row._raw?.positions) ? row._raw.positions : [];
          const positionOptions: string[] = Array.from(
            new Set<string>(
              rawPositions
                .map((p: any) => String(p?.positionKey || p?.positionId || "").trim())
                .filter(Boolean)
            )
          );

          return (
            <section key={row.id} className="border-t border-slate-300 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-700">
                  <TagIcon className="h-4 w-4" />
                  AUDITAR ITEM #{startIndex + index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => toggleRow(row.id, row.result)}
                  className="rounded-full p-1 text-blue-500 hover:bg-blue-50"
                  aria-label={isOpen ? "Colapsar item" : "Expandir item"}
                >
                  {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-12 md:items-center md:gap-4">
                <div className="md:col-span-4">
                  <div className="mb-1 text-xs font-semibold uppercase text-slate-500">SKU</div>
                  <div className="font-semibold text-blue-600">{txt(row.name) !== "--" ? txt(row.name) : txt(row.sku)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Cantidad</div>
                  <span className="inline-flex rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-700">
                    {num(row.quantity)}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Lote</div>
                  <div className="font-medium text-slate-700">{txt(row._raw?.batch)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Fecha de elaboración</div>
                  <div className="font-medium text-slate-700">{formatDateValue(row._raw?.elaborationDate)}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Expira</div>
                  <div className="font-medium text-slate-700">{formatDateValue(row._raw?.expirationDate)}</div>
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  {supplyingResultRows.map((resultRow, resultIndex) => (
                    <div
                      key={resultRow.id}
                      className={`grid grid-cols-1 gap-4 md:grid-cols-[140px_160px_1fr_120px_40px] md:items-end ${resultIndex > 0 ? "mt-3" : ""}`}
                    >
                      <div className="text-sm font-semibold text-slate-700">{resultIndex === 0 ? "Resultado de abastecimiento" : ""}</div>
                      {resultIndex === 0 ? (
                        <ActionButton variant="primary" size="sm" onClick={() => addSupplyingResultRow(row.id)}>
                          <PlusIcon className="h-4 w-4" /> Nuevo
                        </ActionButton>
                      ) : (
                        <div />
                      )}
                      <div>
                        <CollapsibleField
                          label="Estado"
                          value={resultRow.status}
                          options={["Recibido", "Pendiente", "Rechazado"]}
                          onChange={(v) =>
                            updateSupplyingResultRow(row.id, resultRow.id, {
                              status: ((v as AuditEstado) ?? "Recibido"),
                            })
                          }
                          inline
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Cantidad</label>
                        <input
                          className="w-full border-b border-slate-300 bg-transparent text-sm outline-none"
                          type="number"
                          value={resultRow.quantity}
                          onChange={(e) =>
                            updateSupplyingResultRow(row.id, resultRow.id, {
                              quantity: e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <button
                        className="rounded p-1 text-slate-500 hover:bg-slate-100"
                        title="Eliminar"
                        onClick={() => removeSupplyingResultRow(row.id, resultRow.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}

                  {slotRows.map((slotRow, slotIndex) => (
                    <div
                      key={slotRow.id}
                      className={`grid grid-cols-1 gap-4 md:grid-cols-[140px_160px_1fr_120px_40px] md:items-end ${slotIndex > 0 ? "mt-3" : "mt-5"}`}
                    >
                      <div className="text-sm font-semibold text-slate-700">{slotIndex === 0 ? "Posiciones" : ""}</div>
                      {slotIndex === 0 ? (
                        <ActionButton variant="primary" size="sm" onClick={() => addSlotRow(row.id)}>
                          <PlusIcon className="h-4 w-4" /> Nuevo
                        </ActionButton>
                      ) : (
                        <div />
                      )}
                      <div>
                        <CollapsibleField
                          label="Ubicación"
                          value={slotRow.positionKey}
                          options={positionOptions.length > 0 ? positionOptions : [slotRow.positionKey]}
                          onChange={(v) =>
                            updateSlotRow(row.id, slotRow.id, {
                              positionKey: String(v || "-"),
                            })
                          }
                          inline
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Cantidad</label>
                        <input
                          className="w-full border-b border-slate-300 bg-transparent text-sm outline-none"
                          type="number"
                          value={slotRow.quantity}
                          onChange={(e) =>
                            updateSlotRow(row.id, slotRow.id, {
                              quantity: e.target.value === "" ? 0 : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <button
                        className="rounded p-1 text-slate-500 hover:bg-slate-100"
                        title="Eliminar"
                        onClick={() => removeSlotRow(row.id, slotRow.id)}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Paginación */}
      <div className="p-4">
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecords}
          pageSize={PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
