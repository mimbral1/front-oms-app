"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, CalendarDaysIcon, PlusIcon, TruckIcon } from "@heroicons/react/24/outline";
import { useFetchWithAuth } from "@/lib/http/client";
import { formatDateTime } from "@/lib/format/date";
import { Pagination } from "@/components/ui/pagination";
import { Avatar } from "@/components/ui/user-avatar";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type EndpointConfig, type FilterConfig, useStandardFilters } from "@/lib/filters";

const HOLIDAY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/holiday`;
const PER_PAGE = 20;

interface ApiHoliday {
  id: string;
  name: string;
  day: string;
  status: "active" | "inactive" | "done" | string;
  dateCreated: string | null;
  dateModified: string | null;
  userCreated: string | null;
  userModified: string | null;
  scope?: {
    scopeType?: string | null;
    carrierIds?: string[] | null;
  } | null;
}

interface ApiListResponse {
  data: ApiHoliday[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
}

type Estado = "Activo" | "Inactivo";

interface HolidayRow {
  id: string;
  name: string;
  day: string;
  dayRaw: string;
  description: string;
  appliesToDelivery: boolean;
  isScoped: boolean;
  modifiedAt: string;
  modifier: { name?: string; email?: string; avatar?: string | null };
  createdAt: string;
  creator: { name?: string; email?: string; avatar?: string | null };
  creatorRaw: string;
  status: Estado;
}

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  appliesToDelivery: string;
  creator: string;
}

const initialFilters: Filters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  appliesToDelivery: "",
  creator: "",
};

const Pill = ({ on, text }: { on: boolean; text: string }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${on ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
    {text}
  </span>
);

const ChipEstado = ({ status }: { status: Estado }) => (
  <div className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${status === "Activo" ? "bg-green-500" : "bg-red-500"}`}>
    {status}
  </div>
);

function formatDayFromApi(day: string) {
  if (!day) return "—";
  const safeDay = day.substring(0, 10);
  const [yyyy, mm, dd] = safeDay.split("-");
  if (!yyyy || !mm || !dd) return day;
  return `${dd}-${mm}-${yyyy}`;
}

const isEmail = (value?: string) => Boolean(value && value.includes("@"));

const UserCell = ({ value, avatar }: { value?: string; avatar?: string | null }) => {
  if (!value) return <span>—</span>;

  if (isEmail(value)) {
    const local = value.split("@")[0];
    return (
      <div className="flex items-center gap-2">
        <Avatar name={local || value} src={avatar || undefined} alt={value} className="h-6 w-6" />
        <div>
          <div className="text-sm font-medium">{local || value}</div>
          <div className="text-xs text-gray-500">{value}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium font-mono text-gray-700">
        {value}
      </span>
    </div>
  );
};

function getColumns(): Column<HolidayRow>[] {
  return [
    { header: "Nombre", accessorKey: "name" },
    {
      header: "Día",
      accessorKey: "day",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
          <span>{row.day}</span>
        </div>
      ),
    },
    { header: "Descripción", accessorKey: "description" },
    {
      header: "Aplica a despacho",
      accessorKey: "appliesToDelivery",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5 text-gray-500" />
          <Pill on={row.appliesToDelivery} text={row.appliesToDelivery ? "Sí" : "No"} />
        </div>
      ),
    },
    {
      header: "Tiene alcance",
      accessorKey: "isScoped",
      cell: (row) => <Pill on={row.isScoped} text={row.isScoped ? "Sí" : "No"} />,
    },
    {
      header: "Fecha modificación",
      accessorKey: "modifiedAt",
      cell: (row) => {
        if (!row.modifiedAt) return <span>—</span>;
        const { date, time } = formatDateTime(row.modifiedAt, { locale: "es-CL", timeZone: "America/Santiago" });
        return (
          <div className="flex flex-col leading-tight">
            <span>{date}</span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        );
      },
    },
    {
      header: "Usuario modificador",
      accessorKey: "modifier",
      cell: (row) => <UserCell value={row.modifier.email || row.modifier.name} avatar={row.modifier.avatar} />,
    },
    {
      header: "Fecha creación",
      accessorKey: "createdAt",
      cell: (row) => {
        if (!row.createdAt) return <span>—</span>;
        const { date, time } = formatDateTime(row.createdAt, { locale: "es-CL", timeZone: "America/Santiago" });
        return (
          <div className="flex flex-col leading-tight">
            <span>{date}</span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        );
      },
    },
    {
      header: "Usuario creador",
      accessorKey: "creator",
      cell: (row) => <UserCell value={row.creator.email || row.creator.name} avatar={row.creator.avatar} />,
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row) => <ChipEstado status={row.status} />,
    },
  ];
}

const filterConfig: FilterConfig<Filters, HolidayRow>[] = [
  {
    id: "search",
    label: "Buscar por nombre",
    type: "text",
  },
  {
    id: "dateFrom",
    label: "Fecha desde",
    type: "datetime",
  },
  {
    id: "dateTo",
    label: "Fecha hasta",
    type: "datetime",
  },
  {
    id: "appliesToDelivery",
    label: "Aplica a despacho",
    type: "select",
    options: [
      { label: "Sí", value: "1" },
      { label: "No", value: "0" },
    ],
    rowValue: (row) => (row.appliesToDelivery ? "1" : "0"),
  },
  {
    id: "creator",
    label: "Usuario creador",
    type: "text",
    match: (row, value) => row.creatorRaw.toLowerCase().includes(String(value ?? "").trim().toLowerCase()),
  },
];

function todayYMD() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HolidaysView() {
  const router = useRouter();
  const { fetchWithAuth } = useFetchWithAuth();
  const columns = useMemo(() => getColumns(), []);

  const [rows, setRows] = useState<HolidayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { headerFilters, handleFilterChange, buildUrl, applyFilters } = useStandardFilters<Filters, HolidayRow>({
    initialFilters,
    configs: filterConfig,
  });

  const displayedRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);

      if (!BASE_DELIVERY_SERVICE) {
        throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
      }

      const endpointConfig: EndpointConfig<Filters> = {
        path: HOLIDAY_ENDPOINT,
        queryMapper: (filters) => ({
          ...(filters.search.trim() ? { q: filters.search.trim() } : {}),
          ...(filters.dateFrom ? { dateFrom: filters.dateFrom.substring(0, 10) } : {}),
          dateTo: (filters.dateTo || todayYMD()).substring(0, 10),
        }),
        pagination: {
          page: currentPage,
          pageSize: PER_PAGE,
          pageSizeParam: "limit",
        },
      };

      const response = await fetchWithAuth<ApiListResponse>(buildUrl(endpointConfig));
      const items = Array.isArray(response?.data) ? response.data : [];

      const mappedRows: HolidayRow[] = items.map((item) => {
        const hasScope = Boolean(item.scope);
        const carrierIds = item.scope?.carrierIds;
        const hasCarrierScope = Array.isArray(carrierIds) && carrierIds.length > 0;
        const scopeType = String(item.scope?.scopeType ?? "").toLowerCase();

        return {
          id: item.id,
          name: item.name || "",
          day: formatDayFromApi(item.day),
          dayRaw: item.day || "",
          description: "",
          appliesToDelivery: hasScope,
          isScoped: scopeType !== "all" || hasCarrierScope,
          modifiedAt: item.dateModified ?? "",
          modifier: { name: item.userModified || undefined, email: undefined },
          createdAt: item.dateCreated ?? "",
          creator: { name: item.userCreated || undefined, email: undefined },
          creatorRaw: String(item.userCreated ?? ""),
          status: item.status?.toLowerCase() === "active" ? "Activo" : "Inactivo",
        };
      });

      setRows(mappedRows);
      const total = typeof response?.pagination?.total === "number" ? response.pagination.total : mappedRows.length;
      const pages = typeof response?.pagination?.pages === "number" ? response.pagination.pages : Math.max(1, Math.ceil(total / PER_PAGE));
      setTotalRecords(total);
      setTotalPages(Math.max(1, pages));
    } catch (error) {
      console.error("Error al listar feriados:", error);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, currentPage, fetchWithAuth]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleExport = useCallback(() => {
    const headers = [
      "Nombre",
      "Día",
      "Descripción",
      "Aplica a despacho",
      "Tiene alcance",
      "Fecha modificación",
      "Usuario modificador",
      "Fecha creación",
      "Usuario creador",
      "Estado",
    ];

    const data = displayedRows.map((row) => [
      row.name,
      row.day,
      row.description,
      row.appliesToDelivery ? "Sí" : "No",
      row.isScoped ? "Sí" : "No",
      row.modifiedAt,
      row.modifier.email || row.modifier.name || "",
      row.createdAt,
      row.creator.email || row.creator.name || "",
      row.status,
    ]);

    exportToCsv("feriados.csv", [headers, ...data]);
  }, [displayedRows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/delivery/configuraciones/feriados/nuevo"),
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
        title="Feriados"
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
            <p>Cargando feriados…</p>
          ) : (
            <DataTable
              data={displayedRows}
              columns={columns}
              dataType="General2"
              statusKey="status"
              rowPaddingY={24}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: HolidayRow) => router.push(`/delivery/configuraciones/feriados/${row.id}`)}
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
