// app/(tu-ruta)/PickupOrdersPage.tsx
"use client";

import React, { useState } from "react";
import { PageHeader, type Action } from "@/components/layout/page-header";
import OrderCard, { type OrderCardProps } from "@/features/pedidos/components/OrderCard";
import { type FilterConfig, useStandardFilters } from "@/lib/filters";
import {
  TrashIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

type Filters = {
  dateFrom: string;
  dateTo: string;
  displayId: string;
  integrationId: string;
  tracking: string;
};

type PickupOrderRow = OrderCardProps & {
  createdAt: string;
  integrationId: string;
  tracking: string;
};

const mockData: PickupOrderRow[] = [
  {
    orderNumber: "1261842938892-01",
    statusVariant: "pending",
    statusLabel: "Pendiente",
    paymentCode: "readyForPicking",
    paymentDesc: "-",
    location: "Palermo",
    shipping: "Retiro en tienda",
    userName: "Manuel Vilche",
    dateTime: "2022/10/07 14:59",
    createdAt: "2022-10-07T14:59",
    integrationId: "PICK-001",
    tracking: "PK-1261842938892",
  },
  {
    orderNumber: "1311450520633-01",
    statusVariant: "announced",
    statusLabel: "Listo para retirar",
    paymentCode: "finished",
    paymentDesc: "Tarjeta Fizzmod",
    location: "Belgrano",
    shipping: "Retiro en tienda",
    userName: "Ariel Mikowski",
    dateTime: "2023/02/19 13:55",
    createdAt: "2023-02-19T13:55",
    integrationId: "PICK-002",
    tracking: "PK-1311450520633",
  },
  {
    orderNumber: "1286300519239-01",
    statusVariant: "inProgress",
    statusLabel: "En viaje",
    paymentCode: "finished",
    paymentDesc: "Pago contra entrega",
    location: "Palermo",
    shipping: "Retiro en tienda",
    userName: "Fede Ata",
    dateTime: "2022/12/28 11:40",
    createdAt: "2022-12-28T11:40",
    integrationId: "PICK-003",
    tracking: "PK-1286300519239",
  },
];

const initialFilters: Filters = {
  dateFrom: "2023-01-01T00:00",
  dateTo: "2023-12-31T23:59",
  displayId: "",
  integrationId: "",
  tracking: "",
};

const toTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const filterConfig: FilterConfig<Filters, PickupOrderRow>[] = [
  {
    id: "dateFrom",
    label: "Fecha desde",
    type: "datetime",
    match: (row, value) => toTimestamp(row.createdAt) >= toTimestamp(String(value)),
  },
  {
    id: "dateTo",
    label: "Fecha hasta",
    type: "datetime",
    match: (row, value) => toTimestamp(row.createdAt) <= toTimestamp(String(value)),
  },
  {
    id: "displayId",
    label: "Display ID",
    type: "text",
    rowValue: (row) => row.orderNumber,
  },
  {
    id: "integrationId",
    label: "ID Integración",
    type: "text",
    rowValue: (row) => row.integrationId,
  },
  {
    id: "tracking",
    label: "Tracking",
    type: "text",
    rowValue: (row) => row.tracking,
  },
];

const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
};

async function cancelOrder(order: string) {
  notify.success(`Pedido ${order} cancelado`);
}

async function deliverOrder(order: string) {
  notify.success(`Pedido ${order} entregado`);
}

async function markUndelivered(order: string) {
  notify.success(`Pedido ${order} marcado NO entregado`);
}

export function PickupOrdersView() {
  const {
    headerFilters,
    handleFilterChange,
    applyFilters,
    resetFilters,
  } = useStandardFilters<Filters, PickupOrderRow>({
    initialFilters,
    configs: filterConfig,
  });
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const filteredOrders = applyFilters(mockData);
  const grouped = {
    pending: filteredOrders.filter((order) => order.statusVariant === "pending"),
    announced: filteredOrders.filter((order) => order.statusVariant === "announced"),
    inProgress: filteredOrders.filter((order) => order.statusVariant === "inProgress"),
  };

  const headerActions: Action[] = [
    {
      label: "",
      variant: "secondary",
      icon: <TrashIcon className="h-5 w-5" />,
      onClick: resetFilters,
    },
    {
      label: "",
      variant: "secondary",
      icon: <FunnelIcon className="h-5 w-5" />,
      onClick: () => console.log("filtros avanzados"),
    },
    {
      label: "",
      variant: "secondary",
      icon: <ArrowsUpDownIcon className="h-5 w-5" />,
      onClick: () => console.log("ordenar"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Pedidos Pickup"
        description="Entrega"
        filters={headerFilters}
        onFilterChange={handleFilterChange}
        action={headerActions}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Column
            title="Pendiente"
            orders={grouped.pending}
            openCardId={openCardId}
            setOpenCardId={setOpenCardId}
            callbacks={(order) => ({
              onRequestCancel: () => cancelOrder(order),
            })}
          />

          <Column
            title="Listo para retirar"
            orders={grouped.announced}
            openCardId={openCardId}
            setOpenCardId={setOpenCardId}
            callbacks={(order) => ({
              onStartDelivery: () => deliverOrder(order),
              onRequestCancel: () => cancelOrder(order),
            })}
          />

          <Column
            title="En curso"
            orders={grouped.inProgress}
            openCardId={openCardId}
            setOpenCardId={setOpenCardId}
            callbacks={(order) => ({
              onStartDelivery: () => deliverOrder(order),
              onMarkUndelivered: () => markUndelivered(order),
            })}
          />
        </div>
      </div>
    </div>
  );
}

interface ColumnProps {
  title: string;
  orders: OrderCardProps[];
  openCardId: string | null;
  setOpenCardId: React.Dispatch<React.SetStateAction<string | null>>;
  callbacks: (order: string) => Partial<OrderCardProps>;
}

function Column({
  title,
  orders,
  openCardId,
  setOpenCardId,
  callbacks,
}: ColumnProps) {
  return (
    <div>
      <h3 className="mb-2 text-center text-lg font-medium text-gray-500">
        {title}
      </h3>

      <div className="flex flex-col items-center space-y-4">
        {orders.map((order) => {
          const extra = callbacks(order.orderNumber);
          const hasActions = Object.keys(extra).length > 0;

          return (
            <OrderCard
              key={order.orderNumber}
              {...order}
              {...extra}
              {...(hasActions && {
                isActionsOpen: openCardId === order.orderNumber,
                onOptionsClick: () => setOpenCardId(order.orderNumber),
                onCloseOptions: () => setOpenCardId(null),
              })}
              rowSpacingClass="space-y-8"
              cardRadiusClass="rounded-md"
              widthClass="w-full"
            />
          );
        })}
      </div>
    </div>
  );
}
