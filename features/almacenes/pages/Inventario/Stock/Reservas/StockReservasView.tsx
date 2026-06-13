// views\Almacen\Inventario\Stock\Reservas\StockReservasView.tsx
"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { PageHeader } from "@/components/layout/page-header";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import { useFetchWithAuth } from "@/lib/http/client";
import { CopyableText } from "@/components/ui/copyable-text";

import {
  XCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  HomeIcon,
  ClipboardDocumentIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { Pagination } from "@/components/ui/pagination";
import {
  BASE_WAREHOUSES,
  WAREHOUSE_STOCK_RESERVATION_API,
} from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
type ReservaStatus = "Pendiente" | "Activo" | "Confirmado" | "Cancelado";

type ReservaRow = {
  id: string;
  inventoryName: string;
  orderCode: string;
  skuCode: string;
  skuName: string;
  quantity: number;
  usedQuantity: number;
  createdAt: string;
  modifiedAt: string;
  status: ReservaStatus;
};

type CatalogProductResponse = {
  Name?: string | null;
};

type ApiStockReservation = {
  id?: string;
  Id?: string;
  warehouseId?: string | null;
  WarehouseId?: string | null;
  skuId?: string | null;
  SkuId?: string | null;
  orderId?: string | null;
  OrderId?: string | null;
  platform?: string | null;
  Platform?: string | null;
  quantity?: number | null;
  Quantity?: number | null;
  usedQuantity?: number | null;
  UsedQuantity?: number | null;
  stockId?: string | null;
  StockId?: string | null;
  positions?: string[] | null;
  Positions?: string[] | null;
  reservationStatus?: string | null;
  ReservationStatus?: string | null;
  status?: string | null;
  dateCreated?: string | null;
  DateCreated?: string | null;
  dateModified?: string | null;
  DateModified?: string | null;
};

type ApiWarehouse = {
  id: string;
  name: string | null;
  referenceId?: string | null;
};

type StockReservasViewMode = "sku" | "all";

type StockReservasViewProps = {
  mode?: StockReservasViewMode;
};

// paginacion 
const PER_PAGE = 20;
const STOCK_RESERVATION_URL = WAREHOUSE_STOCK_RESERVATION_API;
const WAREHOUSE_URL = `${BASE_WAREHOUSES}/warehouse?sortBy=referenceId&sortDirection=asc`;

/* ---------- UI Helpers ---------- */
const getStatusClass = (status: ReservaStatus) => {
  switch (status) {
    case "Activo":
    case "Confirmado":
      return "bg-green-500";
    case "Cancelado":
      return "bg-red-500";
    case "Pendiente":
    default:
      return "bg-gray-500";
  }
};

const StatusPill = ({ status }: { status: ReservaStatus }) => (
  <span
    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-white ${getStatusClass(
      status
    )}`}
  >
    {status}
  </span>
);

const mapReservaStatus = (raw?: string | null): ReservaStatus => {
  const normalized = String(raw || "").toLowerCase();
  if (normalized === "active") return "Activo";
  if (normalized === "confirmed") return "Confirmado";
  if (normalized === "canceled" || normalized === "cancelled") return "Cancelado";
  return "Pendiente";
};

const formatDate = (raw?: string | null) => {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getReservationList = (payload: ApiStockReservation[] | { reservations?: ApiStockReservation[]; data?: ApiStockReservation[]; items?: ApiStockReservation[] }) => {
  if (Array.isArray(payload)) return payload;
  return payload.reservations || payload.data || payload.items || [];
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const getColumns = (): Column<ReservaRow>[] => [
  {
    header: "Inventario",
    accessorKey: "inventoryName",
    cell: (r) => (
      <div className="flex items-center gap-2">
        <HomeIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-blue-700">{r.inventoryName}</span>
      </div>
    ),
  },
  {
    header: "Pedido",
    accessorKey: "orderCode",
    cell: (r) => (
      <div className="flex items-center gap-2">
        <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-blue-700">{r.orderCode}</span>
      </div>
    ),
  },
  {
    header: "SKU",
    accessorKey: "skuName",
    cell: (r) => (
      <div className="flex items-center gap-2">
        <CubeIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-blue-700">
          <CopyableText text={r.skuCode || "-"}>{r.skuCode || "-"}</CopyableText>
        </span>
      </div>
    ),
  },
  {
    header: "Cantidad",
    accessorKey: "quantity",
    cell: (r) => (
      <div className="flex justify-center">
        <span className="inline-flex h-7 min-w-[40px] items-center justify-center rounded-full border px-3 text-sm">
          {r.quantity}
        </span>
      </div>
    ),
  },
  {
    header: "Cant. utilizada",
    accessorKey: "usedQuantity",
    cell: (r) => (
      <div className="flex justify-center">
        <span className="inline-flex h-7 min-w-[40px] items-center justify-center rounded-full border px-3 text-sm">
          {r.usedQuantity}
        </span>
      </div>
    ),
  },
  {
    header: "Fecha de creación",
    accessorKey: "createdAt",
    cell: (r) => <span className="text-sm text-gray-700">{r.createdAt}</span>,
  },
  {
    header: "Modificado",
    accessorKey: "modifiedAt",
    cell: (r) => <span className="text-sm text-gray-700">{r.modifiedAt}</span>,
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: (r) => <StatusPill status={r.status} />,
  },
];

/* ---------- Componente Principal ---------- */
const StocksReservasView: React.FC<StockReservasViewProps> = ({ mode = "sku" }) => {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const { fetchWithAuth } = useFetchWithAuth();
  const stockId = params?.id;

  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReservaStatus>("Pendiente");
  const [headerName, setHeaderName] = useState("");

  const [rows, setRows] = useState<ReservaRow[]>([]);
  const columns = useMemo(() => getColumns(), []);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(n, max));

  const filteredRows = useMemo(
    () => rows.filter((r) => !statusFilter || r.status === statusFilter),
    [rows, statusFilter]
  );

  // recalcular totales cuando cambian los filtros
  useEffect(() => {
    const total = filteredRows.length;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    setTotalRecords(total);
    setCurrentPage((p) => clamp(p, 1, pages));
  }, [filteredRows]);

  useEffect(() => {
    let cancelled = false;

    const loadReservations = async () => {
      try {
        const reservationsUrl =
          mode === "sku" && stockId
            ? `${STOCK_RESERVATION_URL}?StockId=${encodeURIComponent(String(stockId))}`
            : STOCK_RESERVATION_URL;

        const [reservationsResponse, warehouseResponse] = await Promise.all([
          fetch(reservationsUrl, {
            method: "GET",
            headers: withAuthPlatformHeaders({ "Content-Type": "application/json" }),
          }),
          fetch(WAREHOUSE_URL, {
            method: "GET",
            headers: withAuthPlatformHeaders(),
          }),
        ]);

        if (!reservationsResponse.ok) {
          throw new Error(`HTTP ${reservationsResponse.status}`);
        }
        if (!warehouseResponse.ok) {
          throw new Error(`HTTP ${warehouseResponse.status}`);
        }

        const payload = (await reservationsResponse.json()) as ApiStockReservation[] | { reservations?: ApiStockReservation[]; data?: ApiStockReservation[]; items?: ApiStockReservation[] };
        const warehouses = (await warehouseResponse.json()) as ApiWarehouse[];
        const warehouseById = new Map(
          (warehouses || []).map((warehouse) => [
            String(warehouse.id || "").trim().toLowerCase(),
            String(warehouse.name || "").trim(),
          ])
        );

        const source = getReservationList(payload);

        const mapped: ReservaRow[] = source.map((item) => {
          const reservationId = item.id || item.Id || "";
          const warehouseId = item.warehouseId || item.WarehouseId || "";
          const skuId = item.skuId || item.SkuId || "-";
          const orderId = item.orderId || item.OrderId || item.platform || item.Platform || "-";
          const created = formatDate(item.dateCreated || item.DateCreated);
          const modified = formatDate(item.dateModified || item.DateModified || item.dateCreated || item.DateCreated);
          const warehouseName = warehouseById.get(String(warehouseId).trim().toLowerCase()) || "-";
          return {
            id: String(reservationId),
            inventoryName: warehouseName,
            orderCode: String(orderId),
            skuCode: String(skuId),
            skuName: "-",
            quantity: Number(item.quantity ?? item.Quantity ?? 0),
            usedQuantity: Number(item.usedQuantity ?? item.UsedQuantity ?? 0),
            createdAt: created,
            modifiedAt: modified,
            status: mapReservaStatus(item.reservationStatus || item.ReservationStatus || item.status),
          };
        });

        if (!cancelled) {
          setRows(mapped);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setRows([]);
          console.error(getErrorMessage(error, "No se pudieron cargar las reservas."));
        }
      }
    };

    loadReservations();

    return () => {
      cancelled = true;
    };
  }, [mode, stockId]);

  // rows que realmente se muestran en la página actual
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredRows.slice(start, start + PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (mode !== "sku") {
      setHeaderName("");
      return;
    }

    if (!stockId || typeof stockId !== "string") {
      setHeaderName("");
      return;
    }

    let cancelled = false;

    const loadHeader = async () => {
      try {
        const product = await fetchWithAuth<CatalogProductResponse>(
          `catalog/products/${encodeURIComponent(stockId)}`,
          { method: "GET" }
        );

        if (!cancelled) {
          setHeaderName((product?.Name || "").trim());
        }
      } catch {
        if (!cancelled) {
          setHeaderName("");
        }
      }
    };

    loadHeader();

    return () => {
      cancelled = true;
    };
  }, [mode, stockId, fetchWithAuth]);

  const handleApply = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Aquí iría el PATCH para solo reservas
    } finally {
      setSaving(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Aquí iría el PUT completo de reservas
    } finally {
      setSaving(false);
    }
  }, []);

  const handleSaveAndNew = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/catalogo/skus/nuevo");
    } finally {
      setSaving(false);
    }
  }, [router]);

  const headerActions: Action[] = useMemo(
    () => {
      if (mode === "all") {
        return [
          {
            label: "Volver al listado",
            variant: "secondary",
            icon: <XCircleIcon className="h-5 w-5" />,
            onClick: () => router.push("/almacen/inventario/stock"),
          },
        ];
      }

      return [
        {
          label: "Aplicar",
          variant: "success",
          icon: saving ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircleIcon className="h-5 w-5" />
          ),
          onClick: handleApply,
          disabled: saving,
        },
        {
          label: "Guardar",
          variant: "success",
          icon: saving ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <SaveOutlined className="h-4 w-4" />
          ),
          onClick: handleSave,
          disabled: saving,
        },
        {
          label: "Guardar & Crear nuevo",
          variant: "primary",
          icon: saving ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <SaveOutlined className="h-4 w-4" />
          ),
          onClick: handleSaveAndNew,
          disabled: saving,
        },
        {
          label: "Volver al listado",
          variant: "secondary",
          icon: <XCircleIcon className="h-5 w-5" />,
          onClick: () => router.push("/almacen/inventario/stock"),
          disabled: saving,
        },
      ];
    },
    [mode, handleApply, handleSave, handleSaveAndNew, router, saving]
  );

  const headerActive = true;

  const headerConfig = useMemo<PageHeaderProps>(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Stock
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {headerName || (stockId ? String(stockId) : "Stock")}
          </div>
        </div>
      ),
      action: headerActions,
      status:
        mode === "all"
          ? undefined
          : {
            text: headerActive ? "Activo" : "Inactivo",
            variant: headerActive ? "success" : "warning",
          },
    }),
    [headerActions, headerName, stockId, headerActive, mode]
  );

  usePageHeader(() => headerConfig, [headerConfig]);

  /* ---------- Filtro de estado (pills) ---------- */
  const statusDefs: { key: ReservaStatus; label: string }[] = [
    { key: "Pendiente", label: "Pendiente" },
    { key: "Activo", label: "Activo" },
    { key: "Confirmado", label: "Confirmado" },
    { key: "Cancelado", label: "Cancelado" },
  ];

  const handleStatusKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = statusDefs.findIndex((s) => s.key === statusFilter);
    if (e.key === "ArrowRight") {
      const next = statusDefs[(idx + 1) % statusDefs.length].key;
      setStatusFilter(next);
    }
    if (e.key === "ArrowLeft") {
      const prev = statusDefs[(idx - 1 + statusDefs.length) % statusDefs.length].key;
      setStatusFilter(prev);
    }
  };

  const tableContent = (
    <div className="space-y-6">
      <div className="p-6 shadow-sm">
        <div
          role="tablist"
          aria-label="Filtrar reservas por estado"
          onKeyDown={handleStatusKeyDown}
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          {statusDefs.map((s) => {
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={active}
                className={[
                  "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60",
                  active
                    ? "border-blue-500 bg-white text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                ].join(" ")}
                onClick={() => setStatusFilter(s.key)}
                type="button"
                disabled={saving}
              >
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                    active
                      ? "bg-blue-600 ring-blue-600"
                      : "bg-white ring-gray-300 group-hover:ring-blue-400",
                  ].join(" ")}
                />
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>

        <DataTable
          data={paginatedRows}
          columns={columns}
          dataType="General2"
          statusKey="status"
          rowPaddingY={12}
          showStatusBorder
          rowBgClass="bg-white"
        />
        <Pagination
          currentPage={currentPage}
          totalRecords={totalRecords}
          pageSize={PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );

  if (mode === "all") {
    return (
      <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
        <PageHeader sticky stickyTop={0} {...headerConfig} />
        <div className="flex-1">{tableContent}</div>
      </div>
    );
  }

  return tableContent;
};

export default StocksReservasView;
