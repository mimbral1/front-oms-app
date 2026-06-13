import {
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import * as React from "react";

export interface PedidoAction {
  id: string;
  label: string;
  icon: any; // Tipo any para los íconos de HeroIcons
  onClick?: () => void;
}

const RefundIcon = ({ className }: { className?: string }) =>
  React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": true,
    },
    React.createElement("path", { d: "M18.7 8.2A7.4 7.4 0 0 0 5.4 6.5" }),
    React.createElement("path", { d: "M5.4 6.5H9" }),
    React.createElement("path", { d: "M5.4 6.5V2.9" }),
    React.createElement("path", { d: "M5.3 15.8a7.4 7.4 0 0 0 13.3 1.7" }),
    React.createElement("path", { d: "M18.6 17.5H15" }),
    React.createElement("path", { d: "M18.6 17.5v3.6" }),
    React.createElement("path", { d: "M12 7.8v8.4" }),
    React.createElement("path", { d: "M14.4 9.2h-3.3a1.6 1.6 0 0 0 0 3.2h1.8a1.6 1.6 0 0 1 0 3.2H9.6" })
  );

export interface Store {
  id: string;
  name: string;
}

export type ChangeStoreFormData = {
  location: string;
  inventory: string;
  carrier: string;
  startDate: string;
  endDate: string;
  schedule: string;
  type: string;
  useLastAddress: boolean;
  // Nuevos
  addressStreet: string;
  addressNumber: string;
  addressApartment: string;
  addressCommune: string;
  addressCity: string;
  addressRegion: string;
  addressReference: string;
  contactName: string;
  contactPhone: string;
};

/* export interface ChangeFormData {
  docentry: number;
  docnum: number;
  folionum: number;
  cardcode: string;
  cardname: string;
  phone1: string;
  e_mail: string;
  doctotalsy: number;
  docdate: string;
  itemsAmount: number;
  orderStatusID: number;
  paymentMethodID: number;
  deliveryTypeID: number;
  salesChannelID: number;
  recipient: string;
  deliveryDate: string | null;
  lastQueryDate: string | null;
  createdate: string;
  createts: number;
  Product: {
    itemcode: string;
    dscription: string;
    quantity: number;
    price: number;
  };
} */
export interface ChangeFormData {
  /* --- ya existentes --- */
  orderID: number;
  docentry: number;
  docnum: number;
  folionum: number | null;
  cardcode: string;
  cardname: string;
  phone1: string;
  e_mail: string;
  doctotalsy: number;
  docdate: string;
  // itemsAmount: number;
  orderStatusID: number;
  paymentMethodID: number | null;
  deliveryTypeID: number | null;
  salesChannelID: number | null;
  recipient: string | null;
  deliveryDate: string | null;
  lastQueryDate: string | null;
  createdate: string;
  createts: number | null;
  Product: {
    itemcode: string;
    dscription: string;
    quantity: number;
    price: number;
  };

  /* --- NUEVOS --- */
  fixed_rut: string; // “19345330-9”
  integrationError: string | null;
  INTEGRATION_STATUS: string; // “sent-to-sap”, “ready-for-handling”, …
}

// Función para obtener las acciones disponibles para un pedido
export const getPedidoActions = (callbacks: {
  onRequestCancel?: () => void;
  onPrint?: () => void;
  onRefundAmount?: () => void;
  onRefundItems?: () => void;
  onFulfillmentPlan?: () => void;
}): PedidoAction[] => {
  return [
    {
      id: "request-cancel",
      label: "Solicitar cancelación",
      icon: XCircleIcon,
      onClick: callbacks.onRequestCancel,
    },
    {
      id: "print",
      label: "Imprimir ficha",
      icon: PrinterIcon,
      onClick: callbacks.onPrint,
    },
    {
      id: "refund-amount",
      label: "Reembolsar importe",
      icon: RefundIcon,
      onClick: callbacks.onRefundAmount,
    },
    {
      id: "refund-items",
      label: "Reembolsar ítems",
      icon: RefundIcon,
      onClick: callbacks.onRefundItems,
    },
    {
      id: "fulfillment",
      label: "Plan de Fulfillment",
      icon: DocumentMagnifyingGlassIcon,
      onClick: callbacks.onFulfillmentPlan,
    },
  ];
};

export const getEditActions = (callbacks: {
  onChangeStore?: () => void;
}): PedidoAction[] => {
  return [
    {
      id: "store",
      label: "Modificar datos de la Orden",
      icon: PencilSquareIcon,
      onClick: callbacks.onChangeStore,
    },
  ];
};
/* export const getPedidoExpresActions = (callbacks: {
  onRequestCancel?: () => void;
}): PedidoAction[] => {
  return [
    {
      id: "cancel",
      label: "Solicitar cancelación",
      icon: ArrowDownTrayIcon,
      onClick: callbacks.onRequestCancel,
    },
  ];
}; */
export type StatusVariant =
  | "pending"
  | "announced" // 🆕
  | "ready"
  | "inTransit"
  | "inProgress"; // 🆕

export const getPedidoExpresActions = (
  statusVariant: StatusVariant,
  {
    onRequestCancel,
    onStartDelivery,
    onPrint,
    onMarkUndelivered,
  }: {
    onRequestCancel?: () => void;
    onStartDelivery?: () => void;
    onPrint?: () => void;
    onMarkUndelivered?: () => void;
  }
): PedidoAction[] => {
  const common: PedidoAction[] = onPrint
    ? [
      {
        id: "print",
        label: "Imprimir ficha",
        icon: PrinterIcon,
        onClick: onPrint,
      },
    ]
    : [];

  switch (statusVariant) {
    case "pending":
      return [
        {
          id: "cancel",
          label: "Cancelar envío",
          icon: ArrowDownTrayIcon,
          onClick: onRequestCancel,
        },
        ...common,
      ];

    case "announced": // 🆕 “Listo para retirar”
      return [
        {
          id: "deliver",
          label: "Entregar",
          icon: CheckCircleIcon,
          onClick: onStartDelivery, // o un callback específico
        },
        {
          id: "cancel",
          label: "Cancelar envío",
          icon: ArrowDownTrayIcon,
          onClick: onRequestCancel,
        },
        {
          id: "not-delivered",
          label: "No entregado",
          icon: XCircleIcon,
          onClick: onRequestCancel /* o callback */,
        },
        ...common,
      ];

    case "inProgress": // En curso
      return [
        {
          id: "deliver",
          label: "Entregar",
          icon: CheckCircleIcon,
          onClick: onStartDelivery,
        },
        {
          id: "not-delivered",
          label: "No entregado",
          icon: XCircleIcon,
          onClick: onMarkUndelivered, // ↍ callback independiente
        },
      ];
    case "inTransit":
      return [
        {
          id: "deliver",
          label: "Entregar",
          icon: CheckCircleIcon,
          onClick: onStartDelivery,
        },
        {
          id: "not-delivered",
          label: "No entregado",
          icon: XCircleIcon,
          onClick: onRequestCancel /* o callback */,
        },
        ...common,
      ];

    case "ready": // Express “Listo para enviar”
      return [
        {
          id: "start",
          label: "Iniciar entrega",
          icon: ArrowPathIcon,
          onClick: onStartDelivery,
        },
        {
          id: "cancel",
          label: "Cancelar envío",
          icon: ArrowDownTrayIcon,
          onClick: onRequestCancel,
        },
        ...common,
      ];

    default:
      return common;
  }
};

// Función para obtener el tipo de método de entrega
export const getDeliveryType = (tipo: string): string => {
  switch (tipo) {
    case "delivery":
      return "Entrega a domicilio";
    case "pickup":
      return "Retiro en tienda";
    default:
      return "No especificado";
  }
};

// Función para obtener el tipo de método de pago
export const getPaymentType = (tipo: string): string => {
  switch (tipo) {
    case "efectivo":
      return "Efectivo";
    case "tarjeta":
      return "Tarjeta";
    case "transferencia":
      return "Transferencia";
    default:
      return "No especificado";
  }
};

// Función para obtener el tipo de prioridad
export const getPriorityType = (prioridad: number): string => {
  switch (prioridad) {
    case 1:
      return "Baja";
    case 2:
      return "Media";
    case 3:
      return "Alta";
    case 4:
      return "Urgente";
    default:
      return "No especificada";
  }
};
