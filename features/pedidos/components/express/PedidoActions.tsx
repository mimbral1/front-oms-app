"use client";

import React from "react";
import ActionsModal from "@/components/ui/modal/actions";
import { getPedidoExpresActions, StatusVariant } from "@/utils/types";

export interface PedidoActionsProps {
  isOpen: boolean;
  statusVariant: StatusVariant;
  onClose: () => void;
  onRequestCancel?: () => void;
  onStartDelivery?: () => void;
  onPrint?: () => void;
  onMarkUndelivered?: () => void;
}

export default function PedidoActions({
  isOpen,
  statusVariant,
  onClose,
  onRequestCancel,
  onStartDelivery,
  onPrint,
  onMarkUndelivered,
}: PedidoActionsProps) {
  const actions = getPedidoExpresActions(statusVariant, {
    onRequestCancel,
    onStartDelivery,
    onPrint,
    onMarkUndelivered,
  });

  return <ActionsModal isOpen={isOpen} onClose={onClose} actions={actions} />;
}
