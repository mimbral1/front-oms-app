// views\Almacen\Gestion\SolicitudTraslado\SolicitudTrasladoView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon, StoreIcon, WarehouseIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/ui/table";
import { CopyableText } from "@/components/ui/copyable-text";
import { StatusBadge, type StatusVariant } from "@/components/ui/badge/status";
import { exportToCsv } from "@/components/presets/export/export";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_WAREHOUSES } from "@/lib/http/endpoints";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

const PER_PAGE = 20;
const formatDateTime = fmtDateTime;
const MOVEMENT_URL = `${BASE_WAREHOUSES}/movement`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
});

type ApiMovementRow = {
  id: string;
  docEntry?: string | number | null;
  DocEntry?: string | number | null;
  displayId: string | null;
  type: string | null;
  order: string | number | null;
  source?: {
    warehouseName?: string | null;
    positionKey?: string | null;
  } | null;
  destination?: {
    warehouseName?: string | null;
    positionKey?: string | null;
  } | null;
  status: string | null;
  dateStarted: string | null;
};

type MovementRow = {
  movementId: string;
  id: string;
  type: string;
  typeLabel: string;
  typeVariant: StatusVariant;
  sourceWarehouseName: string;
  sourcePositionKey: string;
  destinationWarehouseName: string;
  destinationPositionKey: string;
  dateStarted: string;
  reference: string;
  status: string;
  statusLabel: string;
  statusVariant: StatusVariant;
};

interface Filters {
  search: string;
  type: string;
  status: string;
}

const initialFilters: Filters = {
  search: "",
  type: "",
  status: "",
};

const filterConfig: FilterConfig<Filters, MovementRow>[] = [
  {
    id: "search",
    label: "Buscar",
    type: "text",
    match: (row, value) =>
      [
        row.id,
        row.type,
        row.typeLabel,
        row.sourceWarehouseName,
        row.sourcePositionKey,
        row.destinationWarehouseName,
        row.destinationPositionKey,
        row.reference,
        row.status,
        row.statusLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(String(value ?? "").trim().toLowerCase()),
  },
  {
    id: "type",
    label: "Tipo",
    type: "select",
    options: [
      { label: "Distribucion interna", value: "internalDistribution" },
      { label: "Abastecimiento", value: "supplying" },
      { label: "Reposicion", value: "replenishment" },
      { label: "Recepcion de pedido", value: "orderReceiving" },
      { label: "Picking", value: "picking" },
      { label: "Despicking", value: "unpicking" },
      { label: "Empaque", value: "packing" },
      { label: "Picking confirmado", value: "pickingConfirmed" },
      { label: "Cancelacion", value: "canceling" },
    ],
    rowValue: (row) => row.type,
    matchMode: "equals",
  },
  {
    id: "status",
    label: "Estado",
    type: "select",
    options: [
      { label: "Pendiente", value: "pending" },
      { label: "Iniciado", value: "started" },
      { label: "Recolectado", value: "picked" },
      { label: "Finalizado", value: "ended" },
      { label: "Rechazado", value: "rejected" },
      { label: "Cancelado", value: "canceled" },
    ],
    rowValue: (row) => row.status,
    matchMode: "equals",
  },
];

const getTypeMeta = (typeRaw: string): { label: string; variant: StatusVariant } => {
  const normalized = String(typeRaw || "").trim().toLowerCase();
  if (normalized === "internaldistribution") return { label: "Distribución interna", variant: "info" };
  if (normalized === "supplying") return { label: "Abastecimiento", variant: "info" };
  if (normalized === "replenishment") return { label: "Reposición", variant: "warning" };
  if (normalized === "orderreceiving") return { label: "Recepción de pedido", variant: "success" };
  if (normalized === "picking") return { label: "Picking", variant: "error" };
  if (normalized === "unpicking") return { label: "Despicking", variant: "warning" };
  if (normalized === "packing") return { label: "Empaque", variant: "processing" };
  if (normalized === "pickingconfirmed") return { label: "Picking confirmado", variant: "success" };
  if (normalized === "canceling") return { label: "Cancelación", variant: "error" };
  if (normalized === "ingress" || normalized === "ingreso") return { label: "Ingreso", variant: "success" };
  return { label: typeRaw || "-", variant: "default" };
};

const getStatusMeta = (statusRaw: string): { label: string; variant: StatusVariant } => {
  const normalized = String(statusRaw || "").trim().toLowerCase();
  if (normalized === "pending") return { label: "Pendiente", variant: "info" };
  if (normalized === "started") return { label: "Iniciado", variant: "processing" };
  if (normalized === "picked") return { label: "Recolectado", variant: "warning" };
  if (normalized === "ended") return { label: "Finalizado", variant: "success" };
  if (normalized === "rejected") return { label: "Rechazado", variant: "error" };
  if (normalized === "canceled" || normalized === "cancelled") return { label: "Cancelado", variant: "error" };
  return { label: statusRaw || "-", variant: "default" };
};

function getColumns(): Column<MovementRow>[] {
  return [
    { header: "ID", accessorKey: "id", cell: (row) => <CopyableText text={String(row.id)}>{row.id}</CopyableText> },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (row) => <StatusBadge status={row.typeLabel} variant={row.typeVariant} fixed />,
    },
    {
      header: "Origen",
      accessorKey: "sourceWarehouseName",
      cell: (row) => (
        <div className="flex w-full items-center justify-between">
          <div className="flex min-w-0 items-start gap-2">
            {row.sourceWarehouseName && row.sourceWarehouseName !== "--" ? (
              <StoreIcon className="h-5 w-5 text-gray-400" />
            ) : null}

            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{row.sourceWarehouseName}</div>
              <div className="truncate text-xs text-gray-500">{row.sourcePositionKey}</div>
            </div>
          </div>
          {row.sourceWarehouseName !== "--" && row.destinationWarehouseName !== "--" ? (
            <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
          ) : null}
        </div>
      ),
    },
    {
      header: "Destino",
      accessorKey: "destinationWarehouseName",
      cell: (row) => (
        <div className="flex items-start gap-2">
          {row.destinationWarehouseName && row.destinationWarehouseName !== "--" ? (
            <WarehouseIcon className="h-5 w-5 text-gray-400" />
          ) : null}

          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900">{row.destinationWarehouseName}</div>
            <div className="truncate text-xs text-gray-500">{row.destinationPositionKey}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Fecha",
      accessorKey: "dateStarted",
      cell: (row) => <span>{row.dateStarted}</span>,
    },
    {
      header: "Referencia",
      accessorKey: "reference",
      cell: (row) => <CopyableText text={row.reference}>{row.reference}</CopyableText>,
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.statusLabel} variant={row.statusVariant} fixed />,
    },
  ];
}

export default function TrasladosView() {
  const router = useRouter();
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const columns = useMemo(() => getColumns(), []);
  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<Filters, MovementRow>({
      initialFilters,
      configs: filterConfig,
    });

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch(MOVEMENT_URL, {
        method: "GET",
        headers: JANIS_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ApiMovementRow[];
      const mapped: MovementRow[] = (data || []).map((item) => {
        const typeRaw = String(item.type || "-");
        const typeMeta = getTypeMeta(typeRaw);
        const statusRaw = String(item.status || "-");
        const statusMeta = getStatusMeta(statusRaw);

        return {
          movementId: String(item.id || ""),
          id: String(item.docEntry ?? item.DocEntry ?? item.displayId ?? "-"),
          type: typeRaw,
          typeLabel: typeMeta.label,
          typeVariant: typeMeta.variant,
          sourceWarehouseName: String(item.source?.warehouseName || "--"),
          sourcePositionKey: String(item.source?.positionKey || "--"),
          destinationWarehouseName: String(item.destination?.warehouseName || "--"),
          destinationPositionKey: String(item.destination?.positionKey || "--"),
          dateStarted: item.dateStarted ? formatDateTime(item.dateStarted) : "--",
          reference: String(item.order ?? "--"),
          status: statusRaw,
          statusLabel: statusMeta.label,
          statusVariant: statusMeta.variant,
        };
      });

      setRows(mapped);
      setCurrentPage(1);
    } catch (error: any) {
      setRows([]);
      setErrorMessage(error?.message || "Error al cargar el listado de traslados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);
  const totalRecords = filteredRows.length;
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredRows.slice(start, start + PER_PAGE);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRecords / PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, totalRecords]);

  const handleExport = useCallback(() => {
    const headers = ["ID", "TIPO", "ORIGEN", "DESTINO", "FECHA", "REFERENCIA", "ESTADO"];
    const data = filteredRows.map((row) => [
      row.id,
      row.type,
      row.sourceWarehouseName,
      row.destinationWarehouseName,
      row.dateStarted,
      row.reference,
      row.status,
    ]);

    exportToCsv("traslados.csv", [headers, ...data]);
  }, [filteredRows]);

  const headerActions: Action[] = [
    {
      label: "Nuevo",
      variant: "success",
      icon: <PlusIcon className="h-5 w-5" />,
      onClick: () => router.push("/almacen/gestion/solicitud-traslado/nuevo"),
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
      icon: <ArrowPathIcon className="h-5 w-5" />,
      onClick: () => {
        void fetchList();
      },
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
      <PageHeader
        sticky
        stickyTop={0}
        title="Solicitudes de Traslado"
        action={headerActions}
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, value);
        }}
        filterTitle
      />

      <div className="flex-1 p-3 px-6">
        <div className="space-y-6">
          {loading ? (
            <div className="mt-6 overflow-x-auto rounded-md border bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500">
                      <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                      Cargando...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : errorMessage ? (
            <div
              className="mt-6 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-700 shadow-sm"
              role="alert"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>

                <div className="ml-3">
                  <h3 className="text-sm font-medium">Error al cargar traslados</h3>
                  <p className="mt-2 text-sm">{errorMessage}</p>

                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          void fetchList();
                        }}
                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-lg bg-white px-4 py-6 text-sm text-gray-600 shadow-sm">
              No hay traslados que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <>
              <DataTable
                data={pageItems}
                columns={columns}
                dataType="Traslados"
                rowBgClass="bg-white"
                rowPaddingY={12}
                onRowClick={(row: MovementRow) =>
                  router.push(`/almacen/gestion/solicitud-traslado/${row.movementId}`)
                }
              />

              <Pagination
                currentPage={currentPage}
                totalRecords={totalRecords}
                pageSize={PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
