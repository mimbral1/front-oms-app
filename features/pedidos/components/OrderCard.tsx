// components/OrderCard.tsx
"use client";

import React, { useState } from "react";
import {
  CubeIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  UserIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import PedidoActions from "./express/PedidoActions";
import CancelOrderAlert from "./express/CancelOrderAlert";
import { StatusVariant } from "@/utils/types";

const statusStyles: Record<StatusVariant, string> = {
  pending: "bg-orange-500 text-white",
  announced: "bg-teal-500 text-white", // ejemplo
  ready: "bg-green-500 text-white",
  inTransit: "bg-blue-500 text-white",
  inProgress: "bg-blue-500 text-white", // opcional
};
export interface OrderCardProps {
  orderNumber: string;
  statusVariant: StatusVariant;
  statusLabel: string;
  paymentCode: string;
  paymentDesc: string;
  location: string;
  shipping: string;
  userName: string;
  dateTime: string;
  isActionsOpen?: boolean;

  onRequestCancel?: () => void;
  onStartDelivery?: () => void;
  onPrint?: () => void;
  onMarkUndelivered?: () => void;

  onOptionsClick?: () => void;
  onCloseOptions?: () => void;
  onOrderClick?: () => void;

  /** Aplique un padding y radios más pequeños */
  compact?: boolean;
  /** Clase Tailwind para el gap vertical entre filas: ej. "space-y-1", "space-y-3" */
  rowSpacingClass?: string;
  /** Clase Tailwind para el border-radius: ej. "rounded-md", "rounded-lg" */
  cardRadiusClass?: string;
  widthClass?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  orderNumber,
  statusVariant,
  statusLabel,
  paymentCode,
  paymentDesc,
  location,
  shipping,
  userName,
  dateTime,
  onOrderClick,
  isActionsOpen = false,
  onOptionsClick = () => { },
  onCloseOptions = () => { },

  onRequestCancel,
  onStartDelivery,
  onPrint,
  onMarkUndelivered,

  compact = false,
  rowSpacingClass = compact ? "space-y-1" : "space-y-2",
  cardRadiusClass = compact ? "rounded-md" : "rounded-lg",
  widthClass = "",
}) => {
  const borderColor: Record<StatusVariant, string> = {
    pending: "border-l-4 border-orange-500",
    announced: "border-l-4 border-teal-500",
    ready: "border-l-4 border-green-500",
    inTransit: "border-l-4 border-blue-500",
    inProgress: "border-l-4 border-blue-500",
  };

  const paddingClass = compact ? "p-2" : "p-4";
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const handleRequestCancel = () => {
    onCloseOptions?.();
    setIsCancelAlertOpen(true);
  };

  const handleConfirmCancel = async () => {
    await onRequestCancel?.();
    setIsCancelAlertOpen(false);
  };

  const borderClass = borderColor[statusVariant];

  return (
    <div
      className={`
			${widthClass}
			${cardRadiusClass}
			${paddingClass}
			bg-white shadow-sm hover:shadow-md transition-shadow
			${borderClass}
		`}
    >
      {/* header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CubeIcon className="h-7 w-7 text-lg text-gray-500" />
          <button
            onClick={onOrderClick}
            className="text-xl font-medium text-blue-600 hover:underline"
          >
            {orderNumber}
          </button>
          <span
            className={`
              ml-2 inline-block px-2 py-[1.2px] text-lg font-semibold rounded-full
              ${statusStyles[statusVariant]}
            `}
          >
            {statusLabel}
          </span>
        </div>
        {onOptionsClick && (
          <button
            onClick={onOptionsClick}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <EllipsisHorizontalIcon className="h-6 w-6 text-gray-400" />
          </button>
        )}
      </div>

      {/* body */}
      <div
        className={`mt-3 ${rowSpacingClass} divide-y divide-gray-200 text-sm text-gray-700`}
      >
        <div className="flex items-center gap-2">
          <CreditCardIcon className="h-6 w-6 text-gray-500" />
          <span className="text-lg">{paymentCode}</span>
          <span className="text-lg text-gray-500">({paymentDesc})</span>
        </div>
        <div className="flex pt-2 items-center gap-2">
          <BuildingStorefrontIcon className="h-4 w-4 text-gray-500" />
          <span className="text-lg">{location}</span>
          <TruckIcon className="h-6 w-6 text-gray-500 ml-4" />
          <span className="text-lg">{shipping}</span>
        </div>
        <div className="flex pt-2 items-center gap-2">
          <UserIcon className="h-6 w-6 text-gray-500" />
          <span className="text-lg">{userName}</span>
        </div>
        <div className="flex pt-2 pb-2 items-center gap-2">
          <ClockIcon className="h-6 w-6 text-gray-500" />
          <span className="text-lg">{dateTime}</span>
        </div>
      </div>
      <PedidoActions
        isOpen={isActionsOpen}
        statusVariant={statusVariant}
        onClose={onCloseOptions!}
        onRequestCancel={handleRequestCancel}
        onStartDelivery={onStartDelivery}
        onMarkUndelivered={onMarkUndelivered}
        onPrint={onPrint}
      />
      {/* Alerta de confirmación de cancelación */}
      <CancelOrderAlert
        isOpen={isCancelAlertOpen}
        onClose={() => setIsCancelAlertOpen(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default OrderCard;
