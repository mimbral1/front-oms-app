"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { GeneralStatusBadge } from "@/components/ui/badge/GeneralStatusBadge";
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { exportToCsv } from "@/components/presets/export/export";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

const SHIPPING_TYPE_URL = `${BASE_DELIVERY_SERVICE}/shipping-type`;
const ITEMS_PER_PAGE = 10;

interface MetodoEntregaRow {
  id?: string;
  refId: string;
  modalidad: string;
  rutas: string;
  bultos: string;
  titulo: string;
  programado: string;
  creacion: string;
  modificado: string;
  status: "Activo" | "Inactivo" | "";
  origen: string;
  tiempo_min_fulfillment: string;
}

type ApiShippingTypeItem = {
  id?: string;
  refId?: string | null;
  origin?: string | null;
  code?: string | null;
  title?: string | null;
  allowRoutes?: boolean | null;
  allowPackages?: boolean | null;
  allowWindows?: boolean | null;
  minFulfillmentTime?: number | null;
  status?: string | null;
  dateCreated?: string | null;
  dateModified?: string | null;
};

type ApiShippingTypeResponse = {
  data?: ApiShippingTypeItem[];
};

interface MetodoEntregaFilters {
  refId: string;
  modalidad: string;
  rutas: string;
  bultos: string;
}

const initialFilters: MetodoEntregaFilters = {
  refId: "",
  modalidad: "",
  rutas: "",
  bultos: "",
};

const boolToSiNo = (value?: boolean | null) => (value ? "Sí" : "No");

const formatDateTime = (value?: string | null) => {
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

const getColumns = (): Column<MetodoEntregaRow>[] => [
  {
    accessorKey: "refId",
    header: "Ref Id",
    cell: (row) => <span className="text-sm text-gray-800">{row.refId}</span>,
  },
  {
    accessorKey: "modalidad",
    header: "Modalidad",
    cell: (row) => row.modalidad,
  },
  {
    accessorKey: "titulo",
    header: "Título",
    cell: (row) => row.titulo,
  },
  {
    accessorKey: "rutas",
    header: "Rutas",
    cell: (row) => (
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-800">
        {row.rutas}
      </div>
    ),
  },
  {
    accessorKey: "bultos",
    header: "Bultos",
    cell: (row) => (
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-800">
        {row.bultos}
      </div>
    ),
  },
  {
    accessorKey: "programado",
    header: "Programado",
    cell: (row) => (
      <div className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-800">
        {row.programado}
      </div>
    ),
  },
  {
    accessorKey: "creacion",
    header: "Creación",
    cell: (row) => row.creacion,
  },
  {
    accessorKey: "modificado",
    header: "Modificado",
    cell: (row) => row.modificado,
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: (row) => <GeneralStatusBadge status={row.status} />,
  },
];

export default function MetodosEntregaView() {
  const router = useRouter();
  const columns = useMemo(() => getColumns(), []);
  const [metodosEntrega, setMetodosEntrega] = useState<MetodoEntregaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const modalidadOptions = useMemo(
    () =>
      Array.from(new Set(metodosEntrega.map((row) => row.modalidad).filter(Boolean)))
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ label: value, value })),
    [metodosEntrega]
  );

  const filterConfig = useMemo<FilterConfig<MetodoEntregaFilters, MetodoEntregaRow>[]>(
    () => [
      {
        id: "refId",
        label: "Ref Id",
        type: "text",
        rowValue: (row) => row.refId,
      },
      {
        id: "modalidad",
        label: "Modalidad",
        type: "select",
        options: modalidadOptions,
        rowValue: (row) => row.modalidad,
      },
      {
        id: "rutas",
        label: "Rutas",
        type: "select",
        options: [
          { label: "No", value: "No" },
          { label: "Sí", value: "Sí" },
        ],
        rowValue: (row) => row.rutas,
      },
      {
        id: "bultos",
        label: "Bultos",
        type: "select",
        options: [
          { label: "No", value: "No" },
          { label: "Sí", value: "Sí" },
        ],
        rowValue: (row) => row.bultos,
      },
    ],
    [modalidadOptions]
  );

  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<MetodoEntregaFilters, MetodoEntregaRow>({
      initialFilters,
      configs: filterConfig,
    });

  const fetchShippingTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SHIPPING_TYPE_URL}?page=1&limit=500`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al listar métodos de entrega`);
      }

      const payload = (await response.json()) as ApiShippingTypeResponse;
      const mappedRows: MetodoEntregaRow[] = (Array.isArray(payload?.data) ? payload.data : []).map((item) => ({
        id: String(item.id || ""),
        refId: String(item.refId || "-"),
        modalidad: String(item.code || "-"),
        rutas: boolToSiNo(item.allowRoutes),
        bultos: boolToSiNo(item.allowPackages),
        titulo: String(item.title || "-"),
        programado: boolToSiNo(item.allowWindows),
        creacion: formatDateTime(item.dateCreated),
        modificado: formatDateTime(item.dateModified),
        status: mapStatus(item.status),
        origen: String(item.origin || "-"),
        tiempo_min_fulfillment: item.minFulfillmentTime == null ? "-" : String(item.minFulfillmentTime),
      }));

      setMetodosEntrega(mappedRows);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error al cargar métodos de entrega", error);
      setMetodosEntrega([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShippingTypes();
  }, [fetchShippingTypes]);

  const filteredRows = useMemo(() => applyFilters(metodosEntrega), [applyFilters, metodosEntrega]);
  const totalRecords = filteredRows.length;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, totalRecords]);

  const handleExport = useCallback(() => {
    const headers = [
      "id",
      "refId",
      "modalidad",
      "rutas",
      "bultos",
      "titulo",
      "programado",
      "creacion",
      "modificado",
      "status",
    ];
    const data = filteredRows.map((row) => [
      row.id,
      row.refId,
      row.modalidad,
      row.rutas,
      row.bultos,
      row.titulo,
      row.programado,
      row.creacion,
      row.modificado,
      row.status,
    ]);
    exportToCsv("metodoentrega.csv", [headers, ...data]);
  }, [filteredRows]);

  const headerActions = useMemo(
    () => [
      {
        label: "Nuevo",
        variant: "success" as const,
        onClick: () => router.push("/delivery/configuraciones/metodos-entrega/nuevo"),
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Exportar",
        variant: "primary" as const,
        onClick: handleExport,
        icon: <ArrowDownTrayIcon className="h-5 w-5" />,
      },
      {
        label: "Actualizar",
        variant: "secondary" as const,
        onClick: fetchShippingTypes,
        icon: <ArrowPathIcon className="h-5 w-5" />,
      },
    ],
    [fetchShippingTypes, handleExport, router]
  );

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Método entrega"
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, String(value ?? ""));
        }}
        action={headerActions}
        filterTitle
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          {loading && (
            <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
              Cargando métodos de entrega...
            </div>
          )}

          <div className="overflow-hidden rounded-xl shadow-sm">
            <DataTable
              data={paginatedData}
              dataType="General2"
              statusKey="status"
              columns={columns}
              onRowClick={(row: MetodoEntregaRow) => {
                if (!row.id) return;
                router.push(`/delivery/configuraciones/metodos-entrega/${row.id}`);
              }}
              rowBgClass="bg-white"
              rowPaddingY={8}
            />
          </div>

          <div className="flex flex-col items-center gap-4">
            <Pagination
              currentPage={currentPage}
              totalRecords={totalRecords}
              pageSize={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
