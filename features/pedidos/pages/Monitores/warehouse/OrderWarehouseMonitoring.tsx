"use client";

import { useMemo, useState } from "react";
import { PageHeader, type Action } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";

export interface WarehouseOrder {
  location: string;
  inventario: string;
  seller: string;
  shippingDate: string;
  total: number;
  pendiente: number;
  picking: number;
  pickeadas: number;
  manejo: number;
  facturando: number;
  preFactura: number;
  facturado: number;
  distribucion: number;
  paraEntrega: number;
  enEntrega: number;
  entregado: number;
  noEntregado: number;
  canceladas: number;
  postFacturacion: number;
}

const mockData: WarehouseOrder[] = [
  {
    location: "Belgrano",
    inventario: "Belgrano",
    seller: "seller-belgrano",
    shippingDate: "2024-01-10T09:00",
    total: 95,
    pendiente: 32,
    picking: 8,
    pickeadas: 5,
    manejo: 16,
    facturando: 3,
    preFactura: 3,
    facturado: 7,
    distribucion: 4,
    paraEntrega: 2,
    enEntrega: 1,
    entregado: 1,
    noEntregado: 1,
    canceladas: 0,
    postFacturacion: 14.32,
  },
  {
    location: "Palermo",
    inventario: "Palermo",
    seller: "seller-palermo",
    shippingDate: "2024-01-10T12:00",
    total: 82,
    pendiente: 15,
    picking: 10,
    pickeadas: 6,
    manejo: 25,
    facturando: 4,
    preFactura: 3,
    facturado: 8,
    distribucion: 5,
    paraEntrega: 3,
    enEntrega: 2,
    entregado: 2,
    noEntregado: 2,
    canceladas: 1,
    postFacturacion: 17.13,
  },
  {
    location: "Pilar",
    inventario: "Pilar Recepción",
    seller: "seller-pilar",
    shippingDate: "2024-01-11T08:00",
    total: 104,
    pendiente: 25,
    picking: 12,
    pickeadas: 7,
    manejo: 34,
    facturando: 5,
    preFactura: 10,
    facturado: 9,
    distribucion: 6,
    paraEntrega: 4,
    enEntrega: 3,
    entregado: 3,
    noEntregado: 3,
    canceladas: 1,
    postFacturacion: 20,
  },
];

function numericPill(value: number | string) {
  return (
    <div className="inline-flex items-center justify-center rounded-full border border-gray-300 px-3 py-1 text-sm text-blue-600">
      {value}
    </div>
  );
}

function percentagePill(value: number) {
  return (
    <div className="inline-flex items-center justify-center rounded-full bg-gray-500 px-3 py-1 text-sm font-medium text-white">
      {value.toFixed(2)}%
    </div>
  );
}

export function getColumns() {
  return [
    {
      header: "Location",
      accessorKey: "location",
      cell: (row: WarehouseOrder) => (
        <span className="cursor-pointer text-blue-600 underline">
          {row.location}
        </span>
      ),
    },
    {
      header: "Inventario",
      accessorKey: "inventario",
      cell: (row: WarehouseOrder) => <span>{row.inventario}</span>,
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: (row: WarehouseOrder) => numericPill(row.total),
    },
    {
      header: "Pendiente",
      accessorKey: "pendiente",
      cell: (row: WarehouseOrder) => numericPill(row.pendiente),
    },
    {
      header: "Picking",
      accessorKey: "picking",
      cell: (row: WarehouseOrder) => numericPill(row.picking),
    },
    {
      header: "Pickeadas",
      accessorKey: "pickeadas",
      cell: (row: WarehouseOrder) => numericPill(row.pickeadas),
    },
    {
      header: "Manejo",
      accessorKey: "manejo",
      cell: (row: WarehouseOrder) => numericPill(row.manejo),
    },
    {
      header: "Facturando",
      accessorKey: "facturando",
      cell: (row: WarehouseOrder) => numericPill(row.facturando),
    },
    {
      header: "Pre- factura",
      accessorKey: "preFactura",
      cell: (row: WarehouseOrder) => percentagePill(row.preFactura),
    },
    {
      header: "Facturado",
      accessorKey: "facturado",
      cell: (row: WarehouseOrder) => numericPill(row.facturado),
    },
    {
      header: "Distribucion",
      accessorKey: "distribucion",
      cell: (row: WarehouseOrder) => numericPill(row.distribucion),
    },
    {
      header: "Para entrega",
      accessorKey: "paraEntrega",
      cell: (row: WarehouseOrder) => numericPill(row.paraEntrega),
    },
    {
      header: "En entrega",
      accessorKey: "enEntrega",
      cell: (row: WarehouseOrder) => numericPill(row.enEntrega),
    },
    {
      header: "Entregado",
      accessorKey: "entregado",
      cell: (row: WarehouseOrder) => numericPill(row.entregado),
    },
    {
      header: "No entregado",
      accessorKey: "noEntregado",
      cell: (row: WarehouseOrder) => numericPill(row.noEntregado),
    },
    {
      header: "Canceladas",
      accessorKey: "canceladas",
      cell: (row: WarehouseOrder) => numericPill(row.canceladas),
    },
    {
      header: "Post-facturación",
      accessorKey: "postFacturacion",
      cell: (row: WarehouseOrder) => percentagePill(row.postFacturacion),
    },
  ];
}

interface WarehouseOrderFilters {
  dateRange: string;
  locationID: string;
  inventario: string;
  seller: string;
}

const initialFilters: WarehouseOrderFilters = {
  dateRange: "",
  locationID: "",
  inventario: "",
  seller: "",
};

const filterConfig: FilterConfig<WarehouseOrderFilters, WarehouseOrder>[] = [
  {
    id: "dateRange",
    label: "Fecha de envío",
    type: "datetime",
    match: (row, value) => row.shippingDate.slice(0, 10) === String(value).slice(0, 10),
  },
  {
    id: "locationID",
    label: "Location ID",
    type: "text",
    rowValue: (row) => row.location,
  },
  {
    id: "inventario",
    label: "Inventario",
    type: "text",
    rowValue: (row) => row.inventario,
  },
  {
    id: "seller",
    label: "Seller",
    type: "text",
    rowValue: (row) => row.seller,
  },
];

export default function PedidosPorAlmacenView() {
  const [orders] = useState<WarehouseOrder[]>(mockData);
  const [currentPage, setCurrentPage] = useState(1);
  const { headerFilters, handleFilterChange, applyFilters } =
    useStandardFilters<WarehouseOrderFilters, WarehouseOrder>({
      initialFilters,
      configs: filterConfig,
    });

  const filteredData = useMemo(() => applyFilters(orders), [applyFilters, orders]);
  const itemsPerPage = 5;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = () => {
    console.log("Refrescando datos...");
  };

  const handleNew = () => {
    console.log("Creando nuevo...");
  };

  const headerActions: Action[] = [
    {
      label: "Actualizar",
      variant: "secondary",
      onClick: handleRefresh,
      icon: <ArrowPathIcon className="h-5 w-5" />,
    },
    {
      label: "Nuevo",
      variant: "success",
      onClick: handleNew,
      icon: <PlusIcon className="h-5 w-5" />,
    },
  ];

  const columns = getColumns();

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Pedidos por Almacén"
        filters={headerFilters}
        onFilterChange={(id, value) => {
          setCurrentPage(1);
          handleFilterChange(id, value);
        }}
        action={headerActions}
      />

      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <DataTable
              data={paginatedData}
              columns={columns as any}
              showStatusBorder={false}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalRecords={filteredData.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
