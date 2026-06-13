"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { getEstadoColor } from "@/utils/status";
import { Pagination } from "@/components/ui/pagination";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const PER_PAGE = 20;
const WINDOW_SCHEMA_URL = `${BASE_DELIVERY_SERVICE}/window-schema`;
const getStatusColor = getEstadoColor;

interface EsquemaEntregaRow {
  id: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  status: "Activo" | "Inactivo";
}

interface WindowSchemaApiItem {
  id?: string;
  name?: string | null;
  timezone?: string | null;
  status?: string | null;
  dateCreated?: string | null;
  dateModified?: string | null;
}

interface WindowSchemaApiResponse {
  data?: WindowSchemaApiItem[];
}

interface Filters {
  search: string;
  isActive: string;
}

const initialFilters: Filters = {
  search: "",
  isActive: "",
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapStatus = (value?: string | null): "Activo" | "Inactivo" =>
  String(value || "").toLowerCase() === "inactive" ? "Inactivo" : "Activo";

function getColumns(): Column<EsquemaEntregaRow>[] {
  return [
    { header: "ID", accessorKey: "id" },
    { header: "Nombre", accessorKey: "name" },
    { header: "Zona horaria", accessorKey: "timezone" },
    { header: "Creado", accessorKey: "createdAt" },
    { header: "Actualizado", accessorKey: "updatedAt" },
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

const filterConfig: FilterConfig<Filters, EsquemaEntregaRow>[] = [
  {
    id: "search",
    label: "Buscar",
    type: "text",
    match: (row, value) =>
      `${row.id} ${row.name} ${row.timezone} ${row.status}`
        .toLowerCase()
        .includes(String(value ?? "").trim().toLowerCase()),
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
];

export default function EsquemaEntregaView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);

  const [allRows, setAllRows] = useState<EsquemaEntregaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const { headerFilters, handleFilterChange, applyFilters } = useStandardFilters<Filters, EsquemaEntregaRow>({
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
      const response = await fetch(`${WINDOW_SCHEMA_URL}?page=1&limit=500`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al listar esquemas de entrega`);
      }

      const payload = (await response.json()) as WindowSchemaApiResponse;
      const mappedRows = (Array.isArray(payload?.data) ? payload.data : []).map((item) => ({
        id: String(item.id || ""),
        name: String(item.name || "-"),
        timezone: String(item.timezone || "-"),
        createdAt: formatDateTime(item.dateCreated),
        updatedAt: formatDateTime(item.dateModified),
        status: mapStatus(item.status),
      }));

      setAllRows(mappedRows);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error al cargar esquemas de entrega", error);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    const headers = ["ID", "Nombre", "Zona horaria", "Estado", "Creado", "Actualizado"];
    const data = filteredRows.map((row) => [row.id, row.name, row.timezone, row.status, row.createdAt, row.updatedAt]);
    exportToCsv("esquemas-entrega.csv", [headers, ...data]);
  }, [filteredRows]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success",
        onClick: () => router.push("/delivery/configuraciones/esquemas-entrega/nuevo"),
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
        title="Esquemas de entrega"
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
            <p>Cargando esquemas de entrega…</p>
          ) : (
            <DataTable
              data={pageRows}
              columns={columns}
              dataType="General2"
              statusKey="status"
              rowPaddingY={24}
              showStatusBorder
              rowBgClass="bg-white"
              onRowClick={(row: EsquemaEntregaRow) =>
                router.push(`/delivery/configuraciones/esquemas-entrega/${row.id}`)
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
