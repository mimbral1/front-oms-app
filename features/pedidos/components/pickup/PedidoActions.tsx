"use client";

import React from "react";
import ActionsModal from "@/components/ui/modal/actions";
import { getPedidoExpresActions, StatusVariant } from "@/utils/types";

interface PedidoActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCancel?: () => void;
  onPrint?: () => void;
  onFulfillmentPlan?: () => void;
  statusVariant: StatusVariant;
}

export default function PedidoActions({
  isOpen,
  onClose,
  onRequestCancel,
  statusVariant,
}: PedidoActionsProps) {
  const actions = getPedidoExpresActions(statusVariant, {
    onRequestCancel,
  });

  return (
    <>
      <ActionsModal isOpen={isOpen} onClose={onClose} actions={actions} />
    </>
  );
}
