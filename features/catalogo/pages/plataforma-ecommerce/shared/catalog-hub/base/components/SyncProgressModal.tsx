// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/SyncProgressModal.tsx
//
// Modal de progreso de la sincronización a ML (Pieza F). Muestra la barra
// done/total, los contadores ok/errores y el detalle por SKU. Usa el primitivo
// de modal compartido (SimpleModal, props open/title/onClose).
"use client";
import type { SyncJobStatus } from "../api/catalog-hub-grid-api";
import { SimpleModal } from "@/components/ui/modal";

export interface SyncProgressModalProps {
  open: boolean;
  status: SyncJobStatus | null;
  error: string | null;
  onClose: () => void;
}

const ITEM_LABEL: Record<string, string> = { pending: "Pendiente", running: "Procesando", ok: "OK", error: "Error" };
const ITEM_COLOR: Record<string, string> = { pending: "text-gray-400", running: "text-blue-700", ok: "text-emerald-700", error: "text-rose-700" };

export function SyncProgressModal({ open, status, error, onClose }: SyncProgressModalProps) {
  const total = status?.total ?? 0;
  const done = status?.done ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const running = status?.status === "pending" || status?.status === "running";

  return (
    <SimpleModal open={open} onClose={onClose} title="Sincronización a MercadoLibre">
      <div className="space-y-4 min-w-[420px]">
        {error && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">{error}</div>
        )}

        <div>
          <div className="flex items-center justify-between text-[12px] text-gray-600 mb-1">
            <span>{running ? "Procesando…" : status?.status === "error" ? "Finalizado con errores" : "Completado"}</span>
            <span className="tabular-nums">{done}/{total}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex gap-4 text-[11.5px]">
            <span className="text-emerald-700">OK: <strong className="tabular-nums">{status?.ok ?? 0}</strong></span>
            <span className="text-rose-700">Errores: <strong className="tabular-nums">{status?.errors ?? 0}</strong></span>
          </div>
        </div>

        {status?.items?.length ? (
          <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10.5px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left py-1.5 px-2">SKU</th>
                  <th className="text-left py-1.5 px-2 w-20">Acción</th>
                  <th className="text-left py-1.5 px-2 w-24">Estado</th>
                  <th className="text-left py-1.5 px-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {status.items.map((it) => (
                  <tr key={it.sku} className="border-t border-gray-100">
                    <td className="py-1.5 px-2 tabular-nums">{it.sku}</td>
                    <td className="py-1.5 px-2 text-gray-600">{it.action === "create" ? "Crear" : it.action === "update" ? "Actualizar" : "—"}</td>
                    <td className={`py-1.5 px-2 ${ITEM_COLOR[it.status] ?? "text-gray-500"}`}>{ITEM_LABEL[it.status] ?? it.status}</td>
                    <td className="py-1.5 px-2 text-gray-500">{it.message ?? (it.itemId ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-[12px] text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}
