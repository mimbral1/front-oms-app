// app/(tu-ruta)/ExpressOrdersPage.tsx
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

type ExpressOrderRow = OrderCardProps & {
  createdAt: string;
  integrationId: string;
  tracking: string;
};

const initialFilters: Filters = {
  dateFrom: "2023-02-01T00:00",
  dateTo: "2023-03-29T23:59",
  displayId: "",
  integrationId: "",
  tracking: "",
};

const toTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const filterConfig: FilterConfig<Filters, ExpressOrderRow>[] = [
  {
    id: "dateFrom",
    label: "Desde",
    type: "datetime",
    match: (row, value) => toTimestamp(row.createdAt) >= toTimestamp(String(value)),
  },
  {
    id: "dateTo",
    label: "Hasta",
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

export function ExpressOrdersView() {
  const {
    headerFilters,
    handleFilterChange,
    applyFilters,
    resetFilters,
  } = useStandardFilters<Filters, ExpressOrderRow>({
    initialFilters,
    configs: filterConfig,
  });
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const mockData: ExpressOrderRow[] = [
    {
      orderNumber: "1307880520191-01",
      statusVariant: "pending",
      statusLabel: "Pendiente",
      paymentCode: "pending",
      paymentDesc: "Tarjeta Fizzmod",
      location: "Palermo",
      shipping: "Express 48hs",
      userName: "Argenis Hernandez",
      dateTime: "2023/02/04 16:37",
      createdAt: "2023-02-04T16:37",
      integrationId: "EXP-001",
      tracking: "EX-1307880520191-01",
      onOptionsClick: () => console.log("Opciones 1"),
      onOrderClick: () => console.log("Ver 1"),
    },
    {
      orderNumber: "1307880520191-02",
      statusVariant: "pending",
      statusLabel: "Pendiente",
      paymentCode: "pending",
      paymentDesc: "Tarjeta Fizzmod",
      location: "Palermo",
      shipping: "Express 48hs",
      userName: "Argenis Hernandez",
      dateTime: "2023/02/04 16:37",
      createdAt: "2023-02-04T16:37",
      integrationId: "EXP-002",
      tracking: "EX-1307880520191-02",
      onOptionsClick: () => console.log("Opciones 1"),
      onOrderClick: () => console.log("Ver 1"),
    },
    {
      orderNumber: "1312840520687-01",
      statusVariant: "ready",
      statusLabel: "Listo para enviar",
      paymentCode: "finished",
      paymentDesc: "Pago contra entrega",
      location: "Belgrano",
      shipping: "Express 48hs",
      userName: "Ariel Mikowski",
      dateTime: "2023/02/25 09:37",
      createdAt: "2023-02-25T09:37",
      integrationId: "EXP-003",
      tracking: "EX-1312840520687-01",
      onOptionsClick: () => console.log("Opciones 2"),
      onOrderClick: () => console.log("Ver 2"),
    },
    {
      orderNumber: "1311450520631-01",
      statusVariant: "inTransit",
      statusLabel: "En camino",
      paymentCode: "finished",
      paymentDesc: "Pago contra entrega",
      location: "Belgrano",
      shipping: "Express 24hs",
      userName: "Joaquin Fizzmod",
      dateTime: "2023/02/18 13:23",
      createdAt: "2023-02-18T13:23",
      integrationId: "EXP-004",
      tracking: "EX-1311450520631-01",
      onOptionsClick: () => console.log("Opciones 3"),
      onOrderClick: () => console.log("Ver 3"),
    },
  ];

  const handleCancel = async (orderNumber: string) => {
    try {
      toast.success(`Pedido ${orderNumber} cancelado`);
    } catch (error) {
      toast.error("No se pudo cancelar");
      console.error(error);
    }
  };

  const handleStartDelivery = async (orderNumber: string) => {
    try {
      toast.success(`Entrega iniciada (${orderNumber})`);
    } catch (error) {
      toast.error("No se pudo iniciar la entrega");
      console.error(error);
    }
  };

  const filteredOrders = applyFilters(mockData);
  const grouped = {
    pending: filteredOrders.filter((order) => order.statusVariant === "pending"),
    ready: filteredOrders.filter((order) => order.statusVariant === "ready"),
    inTransit: filteredOrders.filter((order) => order.statusVariant === "inTransit"),
  };

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
      onClick: () => console.log("Filtros avanzados"),
      icon: <FunnelIcon className="h-5 w-5" />,
    },
    {
      label: "",
      variant: "secondary",
      onClick: () => console.log("Ordenar columnas"),
      icon: <ArrowsUpDownIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title="Pedidos exprés"
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
            callbacks={(orderNumber) => ({
              onRequestCancel: () => handleCancel(orderNumber),
            })}
          />

          <Column
            title="Listo para entrega"
            orders={grouped.ready}
            openCardId={openCardId}
            setOpenCardId={setOpenCardId}
            callbacks={(orderNumber) => ({
              onStartDelivery: () => handleStartDelivery(orderNumber),
              onRequestCancel: () => handleCancel(orderNumber),
            })}
          />

          <Column
            title="En camino"
            orders={grouped.inTransit}
            openCardId={openCardId}
            setOpenCardId={setOpenCardId}
            callbacks={() => ({})}
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
  callbacks: (orderNumber: string) => Partial<OrderCardProps>;
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
              compact={false}
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
