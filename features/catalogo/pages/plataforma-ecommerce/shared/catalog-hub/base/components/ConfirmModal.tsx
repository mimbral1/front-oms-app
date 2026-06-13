// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/ConfirmModal.tsx
"use client";
import { useState } from "react";
import { SimpleModal } from "@/components/ui/modal";
import { ActionButton } from "@/components/ui";

export function ConfirmModal({ open, title, message, confirmLabel, variant = "danger", onClose, onConfirm }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  variant?: "danger" | "success" | "warning"; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); try { await onConfirm(); onClose(); } finally { setBusy(false); } };
  return (
    <SimpleModal open={open} title={title} onClose={onClose} maxWidth="sm:max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <ActionButton variant="secondary" size="sm" onClick={onClose}>Cancelar</ActionButton>
          <ActionButton variant={variant} size="sm" loading={busy} onClick={run}>{confirmLabel}</ActionButton>
        </div>
      </div>
    </SimpleModal>
  );
}
