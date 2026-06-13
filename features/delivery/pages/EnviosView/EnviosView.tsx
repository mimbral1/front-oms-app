"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { exportToCsv } from "@/components/presets/export/export";
import { StatusBadge } from "@/components/ui/badge/status";
import { CopyableText } from "@/components/ui/copyable-text";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { mockEnvios } from "@/data/mocks/delivery";
import { useDeliveryStore } from "@/features/delivery/stores/delivery";
import type { DeliveryFilters } from "@/features/delivery/types/delivery";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  PlusIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface ApiShippingItem {
  id: string;
  refId: string;
  origin: string;
  type: string;
  carrierId: string | null;
  timeSlotId: string | null;
  isScheduled: boolean;
  productQuantity: number | null;
  packageQuantity: number | null;
  routePending: boolean;
  userCreated: string | null;
  status: string;
  dateCreated: string | null;
  dateModified: string | null;
  pickupCountry: string | null;
  pickupState: string | null;
  pickupCity: string | null;
  pickupStreet: string | null;
  pickupNumber: string | null;
  dropoffCountry: string | null;
  dropoffState: string | null;
  dropoffCity: string | null;
  dropoffStreet: string | null;
  dropoffNumber: string | null;
  senderFullname: string | null;
  senderPhone: string | null;
  senderEmail: string | null;
  senderWarehouseId: string | null;
  receiverFullname: string | null;
  receiverPhone: string | null;
  receiverEmail: string | null;
  orders: string | null;
}

interface ApiShippingResponse {
  data: ApiShippingItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface ApiTimeSlot {
  id: string;
  dateStart: string | null;
  dateEnd: string | null;
  status: string;
}

interface EnvioRow {
  id: string;
  refId: string;
  dateCreatedRaw: string;
  carrierId: string;
  fechaEnvio: string;
  origen: string;
  destino: string;
  entrega: { inicio: string; fin: string };
  estado: "Creada" | "En Proceso" | "Finalizada" | "Cancelada";
  tipoEntrega: string;
  cliente: { nombre: string; direccion: string; telefono: string };
}

const ITEMS_PER_PAGE = 20;

function formatFlatAddress(
  street?: string | null,
  number?: string | null,
  city?: string | null,
  state?: string | null
): string {
  const parts = [street, number, city, state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function formatDateSafe(raw?: string | null): string {
  if (!raw) return "Sin fecha";

  try {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      const pad = (value: number) => String(value).padStart(2, "0");
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  } catch {
  }

  return raw.trim() || "Sin fecha";
}

function mapApiStatus(status?: string): EnvioRow["estado"] {
  if (!status) return "Creada";

  const normalized = status.toLowerCase();
  if (normalized === "created" || normalized === "creada" || normalized === "pending") return "Creada";
  if (normalized === "in_progress" || normalized === "en proceso" || normalized === "processing" || normalized === "in-progress") return "En Proceso";
  if (normalized === "completed" || normalized === "finalizada" || normalized === "delivered" || normalized === "finished") return "Finalizada";
  if (normalized === "cancelled" || normalized === "cancelada" || normalized === "canceled") return "Cancelada";
  return "Creada";
}

const getStatusVariant = (status: EnvioRow["estado"]) => {
  switch (status) {
    case "Creada":
      return "pending";
    case "En Proceso":
      return "processing";
    case "Finalizada":
      return "success";
    case "Cancelada":
      return "error";
    default:
      return "info";
  }
};

function mockToRows(mocks: typeof mockEnvios): EnvioRow[] {
  return mocks.map((mock) => ({
    id: mock.id,
    refId: mock.id,
    dateCreatedRaw: "",
    carrierId: "",
    fechaEnvio: mock.fechaEnvio,
    origen: mock.origen,
    destino: mock.destino,
    entrega: mock.entrega,
    estado: mock.estado,
    tipoEntrega: mock.tipoEntrega,
    cliente: mock.cliente,
  }));
}

const toTimestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const matchesDateFilter = (
  rowValue: string,
  filterValue: string,
  mode: "gte" | "lte"
) => {
  const rowTimestamp = toTimestamp(rowValue);
  const filterTimestamp = toTimestamp(filterValue);

  if (rowTimestamp === null || filterTimestamp === null) return true;
  return mode === "gte" ? rowTimestamp >= filterTimestamp : rowTimestamp <= filterTimestamp;
};

const mapFilterStatus = (uiStatus: string): string => {
  switch (uiStatus) {
    case "Creada":
      return "created";
    case "En Proceso":
      return "in_progress";
    case "Finalizada":
      return "completed";
    case "Cancelada":
      return "cancelled";
    default:
      return uiStatus;
  }
};

function getColumns(): Column<EnvioRow>[] {
  return [
    {
      header: "Envío",
      accessorKey: "id",
      cell: (envio) => (
        <div className="flex w-[360px] flex-col">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-gray-400" />
            <CopyableText text={envio.refId} className="font-semibold text-gray-900">
              {envio.refId}
            </CopyableText>
          </div>
          <p className="mt-1 text-sm text-gray-500">{envio.fechaEnvio}</p>
        </div>
      )
    },
    {
      header: "Origen/Destino",
      accessorKey: "origen",
      cell: (envio) => (
        <div>
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">{envio.origen}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{envio.destino}</p>
        </div>
      )
    },
    {
      header: "Cliente",
      accessorKey: "cliente",
      cell: (envio) => (
        <div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">{envio.cliente.nombre}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{envio.cliente.direccion}</p>
          <p className="text-sm text-gray-500">{envio.cliente.telefono}</p>
        </div>
      )
    },
    {
      header: "Horarios",
      accessorKey: "entrega",
      cell: (envio) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {envio.entrega.inicio}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {envio.entrega.fin}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (envio) => (
        <div className="items-center">
          <StatusBadge status={envio.estado} variant={getStatusVariant(envio.estado)} />
        </div>
      )
    }
  ];
}

const filterConfig: FilterConfig<DeliveryFilters, EnvioRow>[] = [
  {
    id: "fechaDesde",
    label: "Fecha desde",
    type: "datetime",
    queryParam: "dateFrom",
    match: (row, value) => matchesDateFilter(row.dateCreatedRaw, value, "gte"),
  },
  {
    id: "fechaHasta",
    label: "Fecha hasta",
    type: "datetime",
    queryParam: "dateTo",
    match: (row, value) => matchesDateFilter(row.dateCreatedRaw, value, "lte"),
  },
  {
    id: "estado",
    label: "Estado",
    type: "select",
    queryParam: "status",
    emptyOptionLabel: "Todos los estados",
    mapQueryValue: (value) => mapFilterStatus(String(value ?? "")),
    options: [
      { label: "Creada", value: "Creada" },
      { label: "En Proceso", value: "En Proceso" },
      { label: "Finalizada", value: "Finalizada" },
      { label: "Cancelada", value: "Cancelada" },
    ],
    rowValue: (row) => row.estado,
  },
  {
    id: "transportista",
    label: "Transportista",
    type: "text",
    queryParam: "carrier",
    match: (row, value) =>
      row.carrierId.toLowerCase().includes(String(value ?? "").trim().toLowerCase()),
  },
];

export default function EnviosView() {
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const { filters: storedFilters, setFilters: setStoredFilters } = useDeliveryStore();

  const { filters, headerFilters, handleFilterChange, buildUrl, applyFilters } =
    useStandardFilters<DeliveryFilters, EnvioRow>({
      initialFilters: storedFilters,
      configs: filterConfig,
    });

  const columns = useMemo(() => getColumns(), []);
  const [rows, setRows] = useState<EnvioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const timeSlotCache = useRef<Record<string, ApiTimeSlot>>({});
  const displayedRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const fetchTimeSlot = useCallback(
    async (timeSlotId: string): Promise<ApiTimeSlot | null> => {
      if (timeSlotCache.current[timeSlotId]) return timeSlotCache.current[timeSlotId];

      try {
        const timeSlot = await fetchWithAuthDelivery<ApiTimeSlot>(`time-slot/${timeSlotId}`);
        if (timeSlot) {
          timeSlotCache.current[timeSlotId] = timeSlot;
        }
        return timeSlot;
      } catch {
        return null;
      }
    },
    [fetchWithAuthDelivery]
  );

  useEffect(() => {
    setStoredFilters(filters);
  }, [filters, setStoredFilters]);

  useEffect(() => {
    if (!usingFallback) return;
    setTotalRecords(displayedRows.length);
  }, [displayedRows.length, usingFallback]);

  const fetchList = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const endpointConfig: EndpointConfig<DeliveryFilters> = {
        path: "shipping",
        pagination: {
          page: currentPage,
          pageSize: ITEMS_PER_PAGE,
          pageSizeParam: "limit",
        },
      };

      const response = await fetchWithAuthDelivery<ApiShippingResponse>(
        buildUrl(endpointConfig)
      );
      const items = Array.isArray(response?.data) ? response.data : [];

      const uniqueSlotIds = Array.from(
        new Set(items.map((item) => item.timeSlotId).filter(Boolean) as string[])
      );
      await Promise.all(uniqueSlotIds.map((slotId) => fetchTimeSlot(slotId)));

      const mappedRows: EnvioRow[] = items.map((item) => {
        const timeSlot = item.timeSlotId ? timeSlotCache.current[item.timeSlotId] : null;
        return {
          id: item.id || "—",
          refId: item.refId || "—",
          dateCreatedRaw: item.dateCreated || "",
          carrierId: item.carrierId || "",
          fechaEnvio: formatDateSafe(item.dateCreated),
          origen:
            item.senderFullname ||
            formatFlatAddress(item.pickupStreet, item.pickupNumber, item.pickupCity, item.pickupState),
          destino: formatFlatAddress(
            item.dropoffStreet,
            item.dropoffNumber,
            item.dropoffCity,
            item.dropoffState
          ),
          entrega: {
            inicio: timeSlot ? formatDateSafe(timeSlot.dateStart) : "Sin horario",
            fin: timeSlot ? formatDateSafe(timeSlot.dateEnd) : "Sin horario",
          },
          estado: mapApiStatus(item.status),
          tipoEntrega: item.type || "—",
          cliente: {
            nombre: item.receiverFullname || "—",
            direccion: formatFlatAddress(
              item.dropoffStreet,
              item.dropoffNumber,
              item.dropoffCity,
              item.dropoffState
            ),
            telefono: item.receiverPhone || "—",
          },
        };
      });

      setUsingFallback(false);
      setRows(mappedRows);
      setTotalRecords(Number(response?.pagination?.total ?? mappedRows.length));
    } catch (error: any) {
      console.error("Error listando envíos:", error?.status, error?.message, error?.payload ?? error);
      setUsingFallback(true);
      setRows(mockToRows(mockEnvios));
      setTotalRecords(mockEnvios.length);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuthDelivery, fetchTimeSlot, buildUrl, currentPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleExport = useCallback(() => {
    const headers = ["Ref ID", "Fecha", "Origen", "Destino", "Cliente", "Estado"];
    const data = displayedRows.map((row) => [
      row.refId,
      row.fechaEnvio,
      row.origen,
      row.destino,
      row.cliente.nombre,
      row.estado,
    ]);
    exportToCsv("envios-export.csv", [headers, ...data]);
  }, [displayedRows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        icon: <PlusIcon className="h-5 w-5" />,
        onClick: () => router.push("/delivery/envios/nuevo"),
      },
      {
        label: "Exportar",
        variant: "primary",
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
        onClick: handleExport,
      },
      {
        label: "Actualizar",
        variant: "secondary",
        icon: <ArrowPathIcon className="h-5 w-5" />,
        onClick: fetchList,
      },
    ],
    [router, handleExport, fetchList]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Envíos"
        filterTitle
        action={headerActions}
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex w-full items-center justify-center rounded-md border border-gray-200 bg-white py-12 text-sm text-gray-500">
              <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" />
              Cargando envíos…
            </div>
          ) : (
            <DataTable
              data={displayedRows}
              columns={columns}
              dataType="General2"
              rowPaddingY={12}
              rowBgClass="bg-white"
              onRowClick={(row: EnvioRow) =>
                router.push(`/delivery/envios/${encodeURIComponent(row.id)}`)
              }
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
