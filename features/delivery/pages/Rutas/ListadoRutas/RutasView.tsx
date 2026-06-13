"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  CubeIcon,
  EyeIcon,
  HomeIcon,
  MapPinIcon,
  PlusIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { exportToCsv } from "@/components/presets/export/export";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";
import { useFetchWithAuth, useFetchWithAuthDelivery } from "@/lib/http/client";

type Estado = "Creada" | "Iniciado" | "Finalizada" | string;

interface RutasRow {
  id: string;
  envio: string;
  createdAtRaw: string;
  fecha_creacion: string;
  fecha_envio: string;
  fecha_entrega_desde: string;
  fecha_entrega_hasta: string;
  inventario: string;
  entregas: number;
  paradas: number;
  transportista: { titulo: string; subtitulo?: string };
  operadorLogistico?: { iniciales: string; nombre: string; email: string };
  estado: Estado;
  compania?: string;
  carrierIds?: string[];
}

interface ApiRouteItem {
  id?: string;
  refId?: string | null;
  displayId?: string | null;
  carrierName?: string | null;
  carrierId?: string | null;
  driverName?: string | null;
  driverId?: string | null;
  originWarehouseId?: string | null;
  shippingQuantity?: number | null;
  totalShippings?: number | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  status?: string | null;
  dateCreated?: string | null;
}

interface ApiRouteResponse {
  data?: ApiRouteItem[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

interface ApiWarehouseItem {
  id?: string | null;
  name?: string | null;
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  id: string;
  companyId: string;
  carrierIds: string;
}

const PER_PAGE = 20;

const initialFilters: Filters = {
  dateFrom: "",
  dateTo: "",
  id: "",
  companyId: "",
  carrierIds: "",
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const extractRows = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as { data?: unknown[] })?.data)) {
    return (payload as { data: unknown[] }).data;
  }
  if (Array.isArray((payload as { rows?: unknown[] })?.rows)) {
    return (payload as { rows: unknown[] }).rows;
  }
  if (Array.isArray((payload as { items?: unknown[] })?.items)) {
    return (payload as { items: unknown[] }).items;
  }
  return [];
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapStatus = (status?: string | null): Estado => {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "created") return "Creada";
  if (normalized === "in_progress") return "Iniciado";
  if (normalized === "completed") return "Finalizada";

  return status || "—";
};

const matchesDateFilter = (
  rowValue: string,
  filterValue: string,
  mode: "gte" | "lte"
) => {
  const rowTime = Date.parse(rowValue);
  const filterTime = Date.parse(filterValue);

  if (Number.isNaN(rowTime) || Number.isNaN(filterTime)) return true;
  return mode === "gte" ? rowTime >= filterTime : rowTime <= filterTime;
};

const toRutasRow = (
  item: ApiRouteItem,
  warehouseNameById: Map<string, string>
): RutasRow => {
  const id = String(item.id || "").trim();
  const refId = String(item.refId || "").trim();
  const displayId = String(item.displayId || "").trim();
  const carrierName = String(item.carrierName || "").trim();
  const carrierId = String(item.carrierId || "").trim();
  const driverName = String(item.driverName || "").trim();
  const driverId = String(item.driverId || "").trim();
  const warehouseId = String(item.originWarehouseId || "").trim();
  const warehouseName = warehouseNameById.get(warehouseId) || warehouseId || "—";
  const envio = displayId || refId || id || "—";

  return {
    id: id || envio,
    envio,
    createdAtRaw: String(item.dateCreated || "").trim(),
    fecha_creacion: formatDateTime(item.dateCreated),
    fecha_envio: formatDateTime(item.scheduleStart),
    fecha_entrega_desde: formatDateTime(item.scheduleStart),
    fecha_entrega_hasta: formatDateTime(item.scheduleEnd),
    inventario: warehouseName,
    entregas: Number(item.shippingQuantity ?? item.totalShippings ?? 0),
    paradas: Number(item.totalShippings ?? item.shippingQuantity ?? 0),
    transportista: {
      titulo: carrierName || carrierId || "—",
      subtitulo: "Carrier",
    },
    operadorLogistico: driverId
      ? {
          iniciales: "OP",
          nombre: driverName || driverId,
          email: "",
        }
      : undefined,
    estado: mapStatus(item.status),
    compania: warehouseId || undefined,
    carrierIds: carrierId ? [carrierId] : [],
  };
};

const EstadoBadge = ({ value }: { value: Estado }) => {
  const normalized = normalize(value);
  const baseClass = "rounded-full px-3 py-1 text-xs font-semibold";

  if (normalized === "creada") {
    return <span className={`${baseClass} bg-orange-500 text-white`}>Creada</span>;
  }

  if (normalized === "iniciado") {
    return <span className={`${baseClass} bg-blue-600 text-white`}>Iniciado</span>;
  }

  if (normalized === "finalizada") {
    return <span className={`${baseClass} bg-green-600 text-white`}>Finalizada</span>;
  }

  return <span className={`${baseClass} bg-gray-400 text-white`}>{value}</span>;
};

const ChipFecha = ({ text }: { text: string }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
    {text}
  </span>
);

function getColumns(): Column<RutasRow>[] {
  return [
    {
      header: "Envío",
      accessorKey: "envio",
      cell: (row) => (
        <div className="relative pl-4">
          <div className="flex flex-col">
            <a className="text-sm font-semibold text-blue-600">#{row.envio}</a>
            <div className="text-xs text-gray-600">{row.fecha_creacion}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Inventarios",
      accessorKey: "inventario",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <HomeIcon className="h-5 w-5 text-gray-600" />
          <div className="flex flex-col">
            <a className="text-sm text-blue-600">{row.inventario}</a>
          </div>
        </div>
      ),
    },
    {
      header: "Entrega",
      accessorKey: "entregas",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-gray-700" />
          <span className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm">
            {row.entregas}
          </span>
        </div>
      ),
    },
    {
      header: "Paradas",
      accessorKey: "paradas",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-gray-700" />
          <span className="inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm">
            {row.paradas}
          </span>
        </div>
      ),
    },
    {
      header: "Transportista",
      accessorKey: "transportista",
      cell: (row) => (
        <div className="flex items-start gap-2">
          <TruckIcon className="h-5 w-5 text-gray-700" />
          <div className="flex flex-col">
            <a className="text-sm text-blue-600">{row.transportista.titulo}</a>
            {row.transportista.subtitulo && (
              <div className="text-xs text-gray-600">{row.transportista.subtitulo}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Operador logístico",
      accessorKey: "operadorLogistico",
      cell: (row) =>
        row.operadorLogistico ? (
          <div className="flex items-start gap-2">
            <UserIcon className="h-5 w-5 text-gray-700" />
            <div className="flex flex-col">
              <a className="text-sm text-blue-600">{row.operadorLogistico.nombre}</a>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">—</span>
        ),
    },
    {
      header: "Programación",
      accessorKey: "fecha_entrega_desde",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-700" />
          <div className="flex flex-col gap-1">
            <ChipFecha text={row.fecha_entrega_desde} />
            <ChipFecha text={row.fecha_entrega_hasta} />
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (row) => (
        <div className="flex items-center justify-between">
          <EstadoBadge value={row.estado} />
          <button
            type="button"
            className="ml-4 inline-flex items-center justify-center rounded-full bg-gray-100 p-2 hover:bg-gray-200"
            title="Ver"
          >
            <EyeIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      ),
    },
  ];
}

const buildFilterConfig = (
  companyOptions: { label: string; value: string }[]
): FilterConfig<Filters, RutasRow>[] => [
  {
    id: "dateFrom",
    label: "Fecha desde",
    type: "datetime",
    match: (row, value) => matchesDateFilter(row.createdAtRaw, value, "gte"),
  },
  {
    id: "dateTo",
    label: "Fecha hasta",
    type: "datetime",
    match: (row, value) => matchesDateFilter(row.createdAtRaw, value, "lte"),
  },
  {
    id: "id",
    label: "ID",
    type: "text",
    match: (row, value) => normalize(`${row.envio} ${row.id}`).includes(normalize(value)),
  },
  {
    id: "companyId",
    label: "Compañía",
    type: "select-search",
    options: companyOptions,
    rowValue: (row) => row.compania ?? "",
  },
  {
    id: "carrierIds",
    label: "Carrier IDs",
    type: "text",
    match: (row, value) => {
      const needles = value
        .split(",")
        .map((item) => normalize(item))
        .filter(Boolean);

      if (needles.length === 0) return true;

      return (row.carrierIds ?? []).some((carrierId) =>
        needles.some((needle) => normalize(carrierId).includes(needle))
      );
    },
  },
];

export default function RutasView() {
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const { fetchWithAuth } = useFetchWithAuth();

  const columns = useMemo(() => getColumns(), []);
  const [rows, setRows] = useState<RutasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [warehouseNameById, setWarehouseNameById] = useState<Map<string, string>>(
    new Map()
  );

  const companyOptions = useMemo(
    () =>
      Array.from(warehouseNameById.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((left, right) =>
          left.label.localeCompare(right.label, "es", { sensitivity: "base" })
        ),
    [warehouseNameById]
  );

  const filterConfig = useMemo(
    () => buildFilterConfig(companyOptions),
    [companyOptions]
  );

  const { headerFilters, handleFilterChange, buildUrl, applyFilters } =
    useStandardFilters<Filters, RutasRow>({
      initialFilters,
      configs: filterConfig,
    });

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const fetchWarehouses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetchWithAuth<unknown>(
        "warehouse?sortBy=referenceId&sortDirection=asc",
        {
          method: "GET",
        }
      );

      const warehouseRows = extractRows(response) as ApiWarehouseItem[];
      const nextMap = new Map<string, string>();

      for (const warehouse of warehouseRows) {
        const id = String(warehouse?.id ?? "").trim();
        const name = String(warehouse?.name ?? "").trim();

        if (!id || !name) continue;
        nextMap.set(id, name);
      }

      setWarehouseNameById(nextMap);
    } catch (error: any) {
      console.error("Error listando warehouses:", error?.payload ?? error);
      setWarehouseNameById(new Map());
    }
  }, [fetchWithAuth, token]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const fetchList = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const endpointConfig: EndpointConfig<Filters> = {
        path: "route",
        queryMapper: () => ({}),
        pagination: {
          page: currentPage,
          pageSize: PER_PAGE,
          pageSizeParam: "limit",
        },
      };

      const response = await fetchWithAuthDelivery<ApiRouteResponse>(
        buildUrl(endpointConfig),
        {
          method: "GET",
        }
      );

      const apiRows = Array.isArray(response?.data) ? response.data : [];
      const mappedRows = apiRows.map((item) => toRutasRow(item, warehouseNameById));

      setRows(mappedRows);
      setTotalRecords(Number(response?.pagination?.total ?? mappedRows.length));
      setTotalPages(Math.max(1, Number(response?.pagination?.pages ?? 1)));
    } catch (error: any) {
      console.error("Error listando rutas:", error?.payload ?? error);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, currentPage, fetchWithAuthDelivery, token, warehouseNameById]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleExport = useCallback(() => {
    const headers = [
      "ID",
      "Inventario",
      "Entregas",
      "Paradas",
      "Transportista",
      "Operador logístico",
      "Entrega desde",
      "Entrega hasta",
      "Estado",
      "Fecha creación",
    ];

    const data = filteredRows.map((row) => [
      row.envio,
      row.inventario,
      row.entregas,
      row.paradas,
      row.transportista.titulo,
      row.operadorLogistico?.nombre ?? "",
      row.fecha_entrega_desde,
      row.fecha_entrega_hasta,
      row.estado,
      row.fecha_creacion,
    ]);

    exportToCsv("rutas.csv", [headers, ...data]);
  }, [filteredRows]);

  const handleHeaderFilterChange = useCallback(
    (id: string, value: string) => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }

      handleFilterChange(id, value);
    },
    [currentPage, handleFilterChange]
  );

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/delivery/rutas/listado-rutas/nuevo"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Exportar",
        variant: "primary",
        onClick: handleExport,
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
      {
        label: "Actualizar",
        variant: "secondary",
        onClick: fetchList,
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
    ],
    [fetchList, handleExport, router]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Rutas de transporte"
        action={headerActions}
        filters={headerFilters}
        onFilterChange={handleHeaderFilterChange}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando rutas…</p>
          ) : (
            <DataTable
              data={filteredRows}
              columns={columns}
              dataType="Rutas"
              statusKey="estado"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: RutasRow) =>
                router.push(`/delivery/rutas/listado-rutas/${row.id}`)
              }
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={PER_PAGE}
            onPageChange={(nextPage) =>
              setCurrentPage(clamp(nextPage, 1, Math.max(1, totalPages)))
            }
          />
        </div>
      </div>
    </div>
  );
}
