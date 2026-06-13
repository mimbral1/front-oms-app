// features/pedidos/components/BulkActionsModal.tsx
"use client";

import { CalendarPlus, PrinterIcon, User2Icon } from "lucide-react";
import { SimpleModal } from "@/components/ui/modal";
import { ActionButton } from "@/components/ui/button/action-button";
import type { RescheduleForm } from "@/features/pedidos/hooks/usePedidoReschedule";

/* ─── Types ─── */

interface BulkActionsModalProps {
  /** Whether the modal is open */
  open: boolean;
  onClose: () => void;
  /** Number of currently selected orders */
  selectedCount: number;
  /** Whether any order is selected (enables action buttons) */
  hasSelection: boolean;

  /* ─ Reschedule flow ─ */
  isRescheduleStep: boolean;
  onGoToReschedule: () => void;
  onGoBackToActions: () => void;
  onApplyReschedule: () => void;
  rescheduleForm: RescheduleForm;
  onRescheduleFieldChange: <K extends keyof RescheduleForm>(field: K, value: RescheduleForm[K]) => void;
  rescheduleError: string | null;
}

/**
 * Modal with bulk-action options for selected orders,
 * including the reschedule-delivery flow.
 */
export default function BulkActionsModal({
  open,
  onClose,
  selectedCount,
  hasSelection,
  isRescheduleStep,
  onGoToReschedule,
  onGoBackToActions,
  onApplyReschedule,
  rescheduleForm,
  onRescheduleFieldChange,
  rescheduleError,
}: BulkActionsModalProps) {
  const disabled = !hasSelection;

  const actionBtnClass = (d: boolean) =>
    "group flex flex-col items-center gap-2.5 rounded-xl border px-4 py-5 transition-all " +
    (d
      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
      : "border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md cursor-pointer");

  const iconSpanClass = (d: boolean) =>
    "flex h-10 w-10 items-center justify-center rounded-lg " +
    (d ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600 group-hover:bg-blue-200");

  const labelClass = (d: boolean) =>
    "text-xs font-medium text-center leading-tight " +
    (d ? "text-gray-400" : "text-gray-700 group-hover:text-blue-700");

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title={isRescheduleStep ? "Reagendar entrega" : "Acciones"}
    >
      {!isRescheduleStep ? (
        <div className="space-y-5">
          {/* Selection counter */}
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5">
            <span className="text-sm text-blue-700">Pedidos seleccionados:</span>
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
              {selectedCount}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Reschedule delivery */}
            <button
              type="button"
              disabled={disabled}
              className={actionBtnClass(disabled)}
              onClick={() => { if (!disabled) onGoToReschedule(); }}
            >
              <span className={iconSpanClass(disabled)}>
                <CalendarPlus className="h-5 w-5" />
              </span>
              <span className={labelClass(disabled)}>Reagendar entrega</span>
            </button>

            {/* Choose picker */}
            <button
              type="button"
              disabled={disabled}
              className={actionBtnClass(disabled)}
              onClick={() => { /* TODO: choose picker logic */ }}
            >
              <span className={iconSpanClass(disabled)}>
                <User2Icon className="h-5 w-5" />
              </span>
              <span className={labelClass(disabled)}>Elegir picker</span>
            </button>

            {/* Print labels */}
            <button
              type="button"
              disabled={disabled}
              className={actionBtnClass(disabled)}
              onClick={() => { /* TODO: print labels logic */ }}
            >
              <span className={iconSpanClass(disabled)}>
                <PrinterIcon className="h-5 w-5" />
              </span>
              <span className={labelClass(disabled)}>Imprimir etiquetas</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─── Reschedule form ─── */
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Estás reagendando la entrega para{" "}
            <span className="font-semibold">{selectedCount}</span> pedido(s). No se aplicará a
            pedidos en estado <span className="font-semibold">Pendiente Entrega</span> ni{" "}
            <span className="font-semibold">Pedido Entregado</span>.
          </p>

          {rescheduleError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {rescheduleError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Ubicación" value={rescheduleForm.ubicacion} onChange={(v) => onRescheduleFieldChange("ubicacion", v)} />
            <Field label="Inventario" value={rescheduleForm.inventario} onChange={(v) => onRescheduleFieldChange("inventario", v)} />
            <Field label="Transportista" value={rescheduleForm.transportista} onChange={(v) => onRescheduleFieldChange("transportista", v)} />
            <Field label="Horario" value={rescheduleForm.horario} placeholder="Ej: 09:00 - 18:00" onChange={(v) => onRescheduleFieldChange("horario", v)} />
            <Field label="Programación desde" type="date" value={rescheduleForm.fechaDesde} onChange={(v) => onRescheduleFieldChange("fechaDesde", v)} />
            <Field label="Programación hasta" type="date" value={rescheduleForm.fechaHasta} onChange={(v) => onRescheduleFieldChange("fechaHasta", v)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Motivo</label>
            <textarea
              className="min-h-[80px] w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={rescheduleForm.motivo}
              onChange={(e) => onRescheduleFieldChange("motivo", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <ActionButton type="button" variant="secondary" onClick={onGoBackToActions}>
              Volver
            </ActionButton>
            <ActionButton type="button" variant="primary" onClick={onApplyReschedule}>
              Aplicar
            </ActionButton>
          </div>
        </div>
      )}
    </SimpleModal>
  );
}

/* ─── Internal helper ─── */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type={type}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
