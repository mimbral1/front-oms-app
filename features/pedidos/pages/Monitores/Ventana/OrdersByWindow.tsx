"use client";

import { useMemo, useState } from "react";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  CubeIcon,
  ArrowPathIcon,
  TrashIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

interface DeliveryWindowRow {
  id: string;
  windowDate: string;
  windowRange: string;
  deliveryDateTime: string;
  inventory: string;
  seller: string;
  total: number;
  pending: number;
  picking: number;
  picked: number;
  handling: number;
  invoicing: number;
  preInvoice: number;
  invoiced: number;
  distribution: number;
  toDeliver: number;
  inTransit: number;
  delivered: number;
  notDelivered: number;
  cancelled: number;
  postInvoicing: number;
}

const mockData: DeliveryWindowRow[] = [
  {
    id: "1",
    windowDate: "05/10",
    windowRange: "10:00 - 11:00",
    deliveryDateTime: "2023-10-05T10:00",
    inventory: "Palermo",
    seller: "juan",
    total: 1,
    pending: 0,
    picking: 1,
    picked: 1,
    handling: 0,
    invoicing: 100,
    preInvoice: 100,
    invoiced: 100,
    distribution: 0,
    toDeliver: 0,
    inTransit: 0,
    delivered: 0,
    notDelivered: 0,
    cancelled: 0,
    postInvoicing: 0,
  },
  {
    id: "2",
    windowDate: "05/10",
    windowRange: "14:00 - 15:00",
    deliveryDateTime: "2023-10-05T14:00",
    inventory: "Palermo",
    seller: "ana",
    total: 1,
    pending: 0,
    picking: 1,
    picked: 1,
    handling: 0,
    invoicing: 100,
    preInvoice: 100,
    invoiced: 100,
    distribution: 0,
    toDeliver: 0,
    inTransit: 0,
    delivered: 0,
    notDelivered: 0,
    cancelled: 0,
    postInvoicing: 0,
  },
  {
    id: "3",
    windowDate: "06/10",
    windowRange: "16:00 - 17:00",
    deliveryDateTime: "2023-10-06T16:00",
    inventory: "Belgrano",
    seller: "juan",
    total: 3,
    pending: 1,
    picking: 1,
    picked: 1,
    handling: 1,
    invoicing: 90,
    preInvoice: 90,
    invoiced: 80,
    distribution: 10,
    toDeliver: 1,
    inTransit: 1,
    delivered: 1,
    notDelivered: 0,
    cancelled: 0,
    postInvoicing: 10,
  },
];

interface WindowFilters {
  dateFrom: string;
  dateTo: string;
  inventory: string;
  seller: string;
}

const initialFilters: WindowFilters = {
  dateFrom: "2023-10-01T00:00",
  dateTo: "2023-12-29T23:59",
  inventory: "Palermo",
  seller: "",
};

const filterConfig: FilterConfig<WindowFilters, DeliveryWindowRow>[] = [
  {
    id: "dateFrom",
    label: "Fecha de entrega",
    type: "datetime",
    matchMode: "gte",
    rowValue: (row) => row.deliveryDateTime,
  },
  {
    id: "dateTo",
    label: "Hasta",
    type: "datetime",
    matchMode: "lte",
    rowValue: (row) => row.deliveryDateTime,
  },
  {
    id: "inventory",
    label: "Inventario",
    type: "select",
    options: [
      { label: "Palermo", value: "Palermo" },
      { label: "Belgrano", value: "Belgrano" },
    ],
    emptyOptionLabel: "Todos",
    rowValue: (row) => row.inventory,
  },
  {
    id: "seller",
    label: "Seller",
    type: "select",
    options: [
      { label: "Juan Perez", value: "juan" },
      { label: "Ana Lopez", value: "ana" },
    ],
    emptyOptionLabel: "Todos",
    rowValue: (row) => row.seller,
  },
];

function getColumns() {
  return [
    {
      header: "Ventana",
      accessorKey: "windowDate" as const,
      cell: (row: DeliveryWindowRow) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-gray-900">{row.windowDate}</span>
          <span className="text-gray-600">{row.windowRange}</span>
        </div>
      ),
    },
    {
      header: "Inventario",
      accessorKey: "inventory" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="text-sm text-gray-800">{row.inventory}</span>
      ),
    },
    {
      header: "Total",
      accessorKey: "total" as const,
      cell: (row: DeliveryWindowRow) => (
        <div className="inline-flex items-center gap-1 text-sm">
          <CubeIcon className="h-5 w-5 text-gray-500" />
          <span>{row.total}</span>
        </div>
      ),
    },
    {
      header: "Pendientes",
      accessorKey: "pending" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.pending}
        </span>
      ),
    },
    {
      header: "En picking",
      accessorKey: "picking" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.picking}
        </span>
      ),
    },
    {
      header: "Pickeadas",
      accessorKey: "picked" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.picked}
        </span>
      ),
    },
    {
      header: "Manejo",
      accessorKey: "handling" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.handling}
        </span>
      ),
    },
    {
      header: "Facturacion",
      accessorKey: "invoicing" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-block rounded-full bg-[#747679] px-2 py-1 text-xs font-medium text-white">
          {row.invoicing}%
        </span>
      ),
    },
    {
      header: "Pre-factura",
      accessorKey: "preInvoice" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-block rounded-full bg-[#747679] px-2 py-1 text-xs font-medium text-white">
          {row.preInvoice}%
        </span>
      ),
    },
    {
      header: "Facturado",
      accessorKey: "invoiced" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-block rounded-full bg-[#747679] px-2 py-1 text-xs font-medium text-white">
          {row.invoiced}%
        </span>
      ),
    },
    {
      header: "Distribucion",
      accessorKey: "distribution" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-block rounded-full bg-[#747679] px-2 py-1 text-xs font-medium text-white">
          {row.distribution}%
        </span>
      ),
    },
    {
      header: "Para entrega",
      accessorKey: "toDeliver" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.toDeliver}
        </span>
      ),
    },
    {
      header: "En camino",
      accessorKey: "inTransit" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.inTransit}
        </span>
      ),
    },
    {
      header: "Entregado",
      accessorKey: "delivered" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.delivered}
        </span>
      ),
    },
    {
      header: "No entregado",
      accessorKey: "notDelivered" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.notDelivered}
        </span>
      ),
    },
    {
      header: "Canceladas",
      accessorKey: "cancelled" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm">
          {row.cancelled}
        </span>
      ),
    },
    {
      header: "Post-facturacion",
      accessorKey: "postInvoicing" as const,
      cell: (row: DeliveryWindowRow) => (
        <span className="inline-block rounded-full bg-[#747679] px-2 py-1 text-xs font-medium text-white">
          {row.postInvoicing}%
        </span>
      ),
    },
  ];
}

export function OrdersWindowView() {
  const [page, setPage] = useState(1);
  const { headerFilters, handleFilterChange, applyFilters, resetFilters } =
    useStandardFilters<WindowFilters, DeliveryWindowRow>({
      initialFilters,
      configs: filterConfig,
    });

  const filtered = useMemo(() => applyFilters(mockData), [applyFilters]);
  const itemsPerPage = 10;
  const pageData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const headerActions: Action[] = [
    {
      label: "",
      variant: "secondary",
      onClick: resetFilters,
      icon: <TrashIcon className="h-5 w-5" />,
    },
    {
      label: "",
      variant: "secondary",
      onClick: () => console.log("Refrescar"),
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "",
      variant: "secondary",
      onClick: () => console.log("Ordenar"),
      icon: <ArrowsUpDownIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Pedidos por ventana de entrega"
        description="Fecha de entrega"
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setPage(1);
          handleFilterChange(id, value);
        }}
        action={headerActions}
      />

      <div className="flex-1 p-6">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <DataTable
            data={pageData}
            columns={getColumns() as any}
            statusKey={undefined}
            dataType="General"
          />
        </div>

        <Pagination
          currentPage={page}
          totalRecords={filtered.length}
          pageSize={itemsPerPage}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
