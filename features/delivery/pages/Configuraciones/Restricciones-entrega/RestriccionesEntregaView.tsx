"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/pagination";
import { getEstadoColor } from "@/utils/status";
import { useFetchWithAuth } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const DELIVERY_AREA_AVAILABILITY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/delivery-area-availability`;
const PER_PAGE = 10;
const API_PAGE_LIMIT = 100;
const getStatusColor = getEstadoColor;

export interface DeliveryRestriction {
  id?: string | number;
  availability: string;
  status: "Activo" | "Inactivo";
  timezone: string;
  days: string[];
  windows: Array<{ from: string; to: string }>;
  address: string;
  numerationStart?: number | null;
  numerationEnd?: number | null;
}

type Estado = DeliveryRestriction["status"];

interface RestriccionRow {
  id: string;
  availability: string;
  timezone: string;
  days: string;
  window: string;
  address: string;
  numeration: string;
  status: Estado;
}

interface ApiWindow {
  deliveryAreaAvailabilityId?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
}

interface ApiDeliveryAreaAvailability {
  id?: string;
  timezone?: string;
  availability?: string;
  locationCountry?: string;
  locationState?: string;
  locationCity?: string;
  locationStreet?: string;
  locationNumber?: number | null;
  locationPostalCode?: string;
  status?: string;
  windows?: ApiWindow[];
}

interface ApiListResponse {
  data?: ApiDeliveryAreaAvailability[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

interface Filters {
  search: string;
  timezone: string;
  isActive: string;
}

const initialFilters: Filters = {
  search: "",
  timezone: "",
  isActive: "",
};

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

function getColumns(): Column<RestriccionRow>[] {
  return [
    { header: "ID", accessorKey: "id" },
    { header: "Disponibilidad", accessorKey: "availability" },
    { header: "Zona horaria", accessorKey: "timezone" },
    { header: "Días", accessorKey: "days" },
    { header: "Horario", accessorKey: "window" },
    { header: "Dirección", accessorKey: "address" },
    { header: "Numeración", accessorKey: "numeration" },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row) => (
        <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(row.status)}`}>
          {row.status}
        </div>
      ),
    },
  ];
}

const mapApiAvailability = (value?: string) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "available") return "Disponible";
  if (normalized === "not_available" || normalized === "not available") return "No disponible";
  return value || "—";
};

const mapApiStatus = (value?: string): Estado =>
  String(value ?? "").trim().toLowerCase() === "active" ? "Activo" : "Inactivo";

function mapApiToRow(item: ApiDeliveryAreaAvailability): RestriccionRow {
  const windows = Array.isArray(item.windows) ? item.windows : [];
  const uniqueDays = Array.from(
    new Set(
      windows
        .map((window) => String(window?.dayOfWeek ?? "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort((left, right) => (DAY_ORDER[left] ?? 99) - (DAY_ORDER[right] ?? 99));

  const uniqueRanges = Array.from(
    new Set(
      windows
        .map((window) => {
          const from = String(window?.startTime ?? "").trim();
          const to = String(window?.endTime ?? "").trim();
          if (!from || !to) return "";
          return `${from} - ${to}`;
        })
        .filter(Boolean)
    )
  );

  const location = [
    item.locationStreet,
    item.locationCity,
    item.locationState,
    item.locationCountry,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(", ");

  return {
    id: String(item.id ?? ""),
    availability: mapApiAvailability(item.availability),
    timezone: String(item.timezone ?? "—"),
    days: uniqueDays.map((day) => DAY_LABELS[day] ?? day).join(", ") || "—",
    window: uniqueRanges.join(" | ") || "—",
    address: location || "—",
    numeration: item.locationNumber == null ? "—" : String(item.locationNumber),
    status: mapApiStatus(item.status),
  };
}

export default function RestriccionesEntregaView() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();
  const columns = useMemo(() => getColumns(), []);

  const [allRows, setAllRows] = useState<RestriccionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const timezoneOptions = useMemo(
    () =>
      Array.from(new Set(allRows.map((row) => row.timezone).filter(Boolean)))
        .sort((left, right) => left.localeCompare(right))
        .map((timezone) => ({ label: timezone, value: timezone })),
    [allRows]
  );

  const filterConfig = useMemo<FilterConfig<Filters, RestriccionRow>[]>(
    () => [
      {
        id: "search",
        label: "Buscar",
        type: "text",
        match: (row, value) =>
          `${row.id} ${row.availability} ${row.timezone} ${row.days} ${row.window} ${row.address} ${row.numeration} ${row.status}`
            .toLowerCase()
            .includes(String(value ?? "").trim().toLowerCase()),
      },
      {
        id: "timezone",
        label: "Zona horaria",
        type: "select",
        options: timezoneOptions,
        rowValue: (row) => row.timezone,
      },
      {
        id: "isActive",
        label: "Estado",
        type: "select",
        options: [
          { label: "Activo", value: "1" },
          { label: "Inactivo", value: "0" },
        ],
        rowValue: (row) => (row.status === "Activo" ? "1" : "0"),
      },
    ],
    [timezoneOptions]
  );

  const { headerFilters, handleFilterChange, applyFilters } = useStandardFilters<Filters, RestriccionRow>({
    initialFilters,
    configs: filterConfig,
  });

  const filteredRows = useMemo(() => applyFilters(allRows), [allRows, applyFilters]);
  const totalRecords = filteredRows.length;
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredRows.slice(start, start + PER_PAGE);
  }, [currentPage, filteredRows]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      if (!BASE_DELIVERY_SERVICE) {
        throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
      }

      let page = 1;
      let pages = 1;
      const collected: ApiDeliveryAreaAvailability[] = [];

      do {
        const params = new URLSearchParams({ page: String(page), limit: String(API_PAGE_LIMIT) });
        const response = await fetchWithAuth<ApiListResponse>(`${DELIVERY_AREA_AVAILABILITY_ENDPOINT}?${params.toString()}`);
        const pageItems = Array.isArray(response?.data) ? response.data : [];
        collected.push(...pageItems);
        pages = Number(response?.pagination?.pages ?? 1);
        page += 1;
      } while (page <= pages);

      setAllRows(collected.map(mapApiToRow));
    } catch (error) {
      console.error("Error al cargar restricciones de entrega", error);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, totalRecords]);

  const handleExport = useCallback(() => {
    const headers = [
      "ID",
      "Disponibilidad",
      "Zona horaria",
      "Días",
      "Horario",
      "Dirección",
      "Numeración",
      "Estado",
    ];

    const data = filteredRows.map((row) => [
      row.id,
      row.availability,
      row.timezone,
      row.days,
      row.window,
      row.address,
      row.numeration,
      row.status,
    ]);

    exportToCsv("delivery-restrictions.csv", [headers, ...data]);
  }, [filteredRows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/delivery/configuraciones/restricciones-entrega/nuevo"),
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
        title="Restricciones de entrega"
        action={headerActions}
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading ? (
            <p>Cargando restricciones…</p>
          ) : (
            <DataTable
              data={pageRows}
              columns={columns}
              dataType="General2"
              statusKey="status"
              rowPaddingY={12}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: RestriccionRow) =>
                router.push(`/delivery/configuraciones/restricciones-entrega/${row.id}`)
              }
            />
          )}

          <Pagination
            currentPage={currentPage}
            totalRecords={totalRecords}
            pageSize={PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
