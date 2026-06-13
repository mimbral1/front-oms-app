"use client";

import { useEffect, useMemo, useState } from "react";
import { useFaltantesStore } from "@/features/pedidos/stores/faltantes";
import { mockFaltantes } from "@/data/mocks/faltantes";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { type FaltantesFilters, type ItemFaltante } from "@/features/pedidos/types/faltantes";
import { StatusBadge } from "@/components/ui/badge/status";
import { DataTable } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowPathIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { applyLocalFilters, buildHeaderFilters, type FilterConfig } from "@/lib/filters";

const ITEMS_PER_PAGE = 10;

type FaltantesFilterState = {
  pedido: string;
  producto: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
  prioridad: string;
};

const toIsoDate = (value: string) => {
  const [day = "", month = "", year = ""] = value.split("/");
  return `${year}-${month}-${day}T00:00`;
};

const faltantesFilterConfig: FilterConfig<FaltantesFilterState, ItemFaltante>[] = [
  {
    id: "pedido",
    label: "Pedido",
    type: "text",
    rowValue: (row) => row.pedido,
  },
  {
    id: "producto",
    label: "Producto",
    type: "text",
    rowValue: (row) => row.producto,
  },
  {
    id: "estado",
    label: "Estado",
    type: "select",
    options: [
      { label: "Pendiente", value: "Pendiente" },
      { label: "Procesado", value: "Procesado" },
      { label: "Cancelado", value: "Cancelado" },
    ],
    emptyOptionLabel: "Todos los estados",
    rowValue: (row) => row.estado,
  },
  {
    id: "fechaDesde",
    label: "Fecha desde",
    type: "datetime",
    match: (row, value) => toIsoDate(row.fechaReporte) >= String(value),
  },
  {
    id: "fechaHasta",
    label: "Fecha hasta",
    type: "datetime",
    match: (row, value) => toIsoDate(row.fechaReporte) <= String(value),
  },
  {
    id: "prioridad",
    label: "Prioridad",
    type: "select",
    options: [
      { label: "Alta", value: "3" },
      { label: "Media", value: "2" },
      { label: "Baja", value: "1" },
    ],
    emptyOptionLabel: "Todas las prioridades",
    rowValue: (row) => String(row.prioridad),
  },
];

export function getFaltantesActions(
  onRefresh: () => void,
  onExport: () => void
): Action[] {
  return [
    {
      label: "Actualizar",
      variant: "secondary",
      onClick: onRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Exportar",
      variant: "primary",
      onClick: onExport,
      icon: <ArrowDownTrayIcon className="h-5 w-5" />,
    },
  ];
}

const getStatusVariant = (status: ItemFaltante["estado"]) => {
  switch (status) {
    case "Pendiente":
      return "warning";
    case "Procesado":
      return "success";
    case "Cancelado":
      return "error";
    default:
      return "info";
  }
};

const getPrioridadVariant = (prioridad: number) => {
  switch (prioridad) {
    case 3:
      return "error";
    case 2:
      return "warning";
    case 1:
      return "info";
    default:
      return "info";
  }
};

const getPrioridadLabel = (prioridad: number) => {
  switch (prioridad) {
    case 3:
      return "Alta";
    case 2:
      return "Media";
    case 1:
      return "Baja";
    default:
      return prioridad.toString();
  }
};

export function getFaltantesColumns() {
  return [
    {
      accessorKey: "pedido" as keyof ItemFaltante,
      header: "Pedido",
      cell: (item: ItemFaltante) => (
        <div className="text-base font-medium text-gray-900">{item.pedido}</div>
      ),
    },
    {
      accessorKey: "producto" as keyof ItemFaltante,
      header: "Producto",
      cell: (item: ItemFaltante) => (
        <div className="text-base text-gray-900">{item.producto}</div>
      ),
    },
    {
      accessorKey: "cantidad" as keyof ItemFaltante,
      header: "Cantidad",
      cell: (item: ItemFaltante) => (
        <div className="text-base text-gray-900">
          {item.cantidadFaltante}/{item.cantidad}
        </div>
      ),
    },
    {
      accessorKey: "ubicacion" as keyof ItemFaltante,
      header: "Ubicación",
      cell: (item: ItemFaltante) => (
        <div className="text-base text-gray-900">{item.ubicacion}</div>
      ),
    },
    {
      accessorKey: "fechaReporte" as keyof ItemFaltante,
      header: "Fecha Reporte",
      cell: (item: ItemFaltante) => (
        <div className="text-base text-gray-900">{item.fechaReporte}</div>
      ),
    },
    {
      accessorKey: "prioridad" as keyof ItemFaltante,
      header: "Prioridad",
      cell: (item: ItemFaltante) => (
        <StatusBadge
          status={getPrioridadLabel(item.prioridad)}
          variant={getPrioridadVariant(item.prioridad)}
          className="px-3 py-0.5 text-sm"
        />
      ),
    },
    {
      accessorKey: "estado" as keyof ItemFaltante,
      header: "Estado",
      cell: (item: ItemFaltante) => (
        <StatusBadge
          status={item.estado}
          variant={getStatusVariant(item.estado)}
          className="px-3 py-0.5 text-sm"
        />
      ),
    },
  ];
}

export default function FaltantesView() {
  const { faltantes, filters, setFaltantes, setFilters } = useFaltantesStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setFaltantes(mockFaltantes);
  }, [setFaltantes]);

  const viewFilters = useMemo<FaltantesFilterState>(
    () => ({
      pedido: filters.pedido ?? "",
      producto: filters.producto ?? "",
      estado: filters.estado ?? "",
      fechaDesde: filters.fechaDesde ?? "",
      fechaHasta: filters.fechaHasta ?? "",
      prioridad: filters.prioridad ?? "",
    }),
    [filters]
  );

  const headerFilters = useMemo(
    () =>
      buildHeaderFilters({
        configs: faltantesFilterConfig,
        filters: viewFilters,
      }),
    [viewFilters]
  );

  const filteredFaltantes = useMemo(
    () => applyLocalFilters(faltantes, viewFilters, faltantesFilterConfig),
    [faltantes, viewFilters]
  );

  const handleFilterChange = (id: string, value: string) => {
    setFilters({ [id]: value } as Partial<FaltantesFilters>);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setFaltantes(mockFaltantes);
  };

  const handleExport = () => {
    const headers = [
      "Pedido",
      "Producto",
      "Cantidad",
      "Ubicación",
      "Fecha Reporte",
      "Prioridad",
      "Estado",
    ];
    const rows = filteredFaltantes.map((item) => [
      item.pedido,
      item.producto,
      `${item.cantidadFaltante}/${item.cantidad}`,
      item.ubicacion,
      item.fechaReporte,
      getPrioridadLabel(item.prioridad),
      item.estado,
    ]);

    exportToCsv("faltantes.csv", [headers, ...rows]);
  };

  const totalPages = Math.max(1, Math.ceil(filteredFaltantes.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFaltantes = filteredFaltantes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const headerActions = getFaltantesActions(handleRefresh, handleExport);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Faltantes"
        description="Gestiona y monitorea los productos faltantes"
        filters={headerFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
      />
      <div className="flex-1 p-6">
        <DataTable
          data={paginatedFaltantes}
          columns={getFaltantesColumns()}
          layout="adaptive"
          statusKey="estado"
          dataType="Faltantes"
          rowGap={4}
          rowBgClass="bg-white shadow-sm"
          rowPaddingY={6}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
