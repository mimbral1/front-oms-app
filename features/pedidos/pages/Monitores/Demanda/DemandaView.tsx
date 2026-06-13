// app/demanda-productos/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

// 1) Interface para cada fila
interface DemandRow {
  id: string;
  name: string;
  barcode: string;
  quantity: string;
  picked: string;
  deliveryDate: string; // ISO date for filter demo
  inventory: string;
  category: string;
}

// 2) Datos mock de ejemplo
const mockData: DemandRow[] = [
  {
    id: "111882",
    name: "Abita Amber",
    barcode: "3620909201918",
    quantity: "38 x 1un",
    picked: "22 x 1un",
    deliveryDate: "2023-12-08",
    inventory: "MNL",
    category: "Bebidas",
  },
  {
    id: "25144",
    name: "Carne Molida Super",
    barcode: "2413739000001",
    quantity: "30 x 0.15kg",
    picked: "0.184 x 0.15kg",
    deliveryDate: "2023-12-08",
    inventory: "PAL",
    category: "Carnes",
  },
  {
    id: "81202",
    name: "AMP 365 Energy",
    barcode: "7038553586422",
    quantity: "22 x 1un",
    picked: "0 x 1un",
    deliveryDate: "2023-12-08",
    inventory: "MNL",
    category: "Bebidas",
  },
  // … más filas …
];

// 3) Filtros para el PageHeader
interface DemandFilters {
  dateFrom: string;
  dateTo: string;
  inventory: string;
  category: string;
  name: string;
}

const initialDemandFilters: DemandFilters = {
  dateFrom: "2023-12-08",
  dateTo: "2023-12-08",
  inventory: "",
  category: "",
  name: "",
};

const demandFilterConfig: FilterConfig<DemandFilters, DemandRow>[] = [
  {
    id: "dateFrom",
    label: "Fecha de entrega",
    type: "datetime",
    matchMode: "gte",
    rowValue: (row) => row.deliveryDate,
  },
  {
    id: "dateTo",
    label: "→",
    type: "datetime",
    matchMode: "lte",
    rowValue: (row) => row.deliveryDate,
  },
  {
    id: "inventory",
    label: "Inventario",
    type: "select",
    options: [
      { label: "MNL - Pilar", value: "MNL" },
      { label: "PAL - Palermo", value: "PAL" },
    ],
    emptyOptionLabel: "Todos",
    rowValue: (row) => row.inventory,
  },
  {
    id: "category",
    label: "Categorías",
    type: "select",
    options: [
      { label: "Bebidas", value: "Bebidas" },
      { label: "Carnes", value: "Carnes" },
    ],
    emptyOptionLabel: "Todas",
    rowValue: (row) => row.category,
  },
  {
    id: "name",
    label: "Nombre",
    type: "text",
    rowValue: (row) => row.name,
  },
];

// 4) Columnas para el DataTable
function getColumns() {
  return [
    {
      header: "Ref ID",
      accessorKey: "id" as const,
      cell: (row: DemandRow) => (
        <span className="text-sm font-medium text-gray-900">{row.id}</span>
      ),
    },
    {
      header: "Nombre",
      accessorKey: "name" as const,
      cell: (row: DemandRow) => (
        <span className="text-sm text-gray-900">{row.name}</span>
      ),
    },
    {
      header: "Código de barras",
      accessorKey: "barcode" as const,
      cell: (row: DemandRow) => (
        <span className="text-sm text-gray-900">{row.barcode}</span>
      ),
    },
    {
      header: "Cantidad",
      accessorKey: "quantity" as const,
      cell: (row: DemandRow) => (
        <span className="inline-flex items-center rounded-full border bg-gray-200 border-gray-300 px-3 py-1 text-sm text-gray-900">
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Cantidad pickeada",
      accessorKey: "picked" as const,
      cell: (row: DemandRow) => (
        <span className="inline-flex items-center rounded-full border bg-gray-200 border-gray-300 px-3 py-1 text-sm text-gray-900">
          {row.picked}
        </span>
      ),
    },
  ];
}

// 5) Componente de la página
export function DemandaProductosView() {
  const [page, setPage] = useState(1);
  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<DemandFilters, DemandRow>({
      initialFilters: initialDemandFilters,
      configs: demandFilterConfig,
    });

  const filtered = useMemo(() => applyFilters(mockData), [applyFilters]);

  // 7) Paginación
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // 8) Export CSV
  const handleExport = () => {
    const headers = [
      "Ref ID",
      "Nombre",
      "Código de barras",
      "Cantidad",
      "Cantidad pickeada",
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.barcode,
      r.quantity,
      r.picked,
    ]);
    exportToCsv("demanda-productos.csv", [headers, ...rows]);
  };

  // 9) Acciones del header
  const headerActions = [
    {
      label: "Exportar",
      variant: "primary" as const,
      onClick: handleExport,
      icon: <ChevronRightIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Demanda de productos"
        description="Fecha de entrega"
        filters={headerFilters}
        onFilterChange={(id, val) => {
          handleFilterChange(id, val);
          setPage(1);
        }}
        action={headerActions}
      />

      <div className="flex-1 p-6">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <DataTable
            data={pageData}
            columns={getColumns() as any}
            statusKey={undefined}
            showStatusBorder={false}
            rowPaddingY={12}
          />
        </div>

        {filtered.length > ITEMS_PER_PAGE && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
            <div className="text-sm text-gray-500">
              {filtered.length} resultados
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
