// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/views/FlujosListView.tsx
"use client";
import { useState } from "react";
import { Layers, Pencil, Pause, Play, Trash2, Plus, FolderOpen, ImageUp } from "lucide-react";
import { ActionButton } from "@/components/ui";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useFlujos } from "../hooks/useFlujos";
import { FlujoFormModal } from "../components/FlujoFormModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { FlujoGridView } from "./FlujoGridView";
import { FlujoWizardView } from "./FlujoWizardView";
import { CargaMasivaView } from "./CargaMasivaView";
import type { GridModo } from "../hooks/useFlujoGrid";
import type { Flujo } from "../types/flujo-types";

export interface FlujosListViewProps { accountId: number }

const ESTADO_LABEL: Record<string, string> = { en_progreso: "En progreso", pausado: "Pausado", completado: "Completado" };
const ESTADO_COLOR: Record<string, string> = { en_progreso: "text-amber-700", pausado: "text-gray-500", completado: "text-emerald-700" };

function fmtExpira(f: Flujo): string {
  if (f.estado === "completado") return "—";
  if (!f.expiresAt) return "—";
  if (f.vencido) return "Vencido";
  const dias = Math.ceil((new Date(f.expiresAt).getTime() - Date.now()) / 86400000);
  return dias <= 0 ? "Vencido" : `${dias} día${dias === 1 ? "" : "s"}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? "—" : new Date(iso).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export function FlujosListView({ accountId }: FlujosListViewProps) {
  const { flujos, cupo, busy, error, reload, editar, pausar, reanudar, eliminar } = useFlujos();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Flujo | null>(null);
  const [toDelete, setToDelete] = useState<Flujo | null>(null);
  const [openFlujo, setOpenFlujo] = useState<Flujo | null>(null);
  // Pieza G — modo de la grilla al abrir (elegido en el wizard; no persiste).
  const [openModo, setOpenModo] = useState<GridModo>("publicar");
  // U4 — flujo abierto en la vista de Carga masiva de imágenes.
  const [cargaOpen, setCargaOpen] = useState(false);
  const [cargaFlujo, setCargaFlujo] = useState<Flujo | null>(null);
  const [cargaTodos, setCargaTodos] = useState(true);
  const cupoLleno = cupo.activos >= cupo.max && cupo.max > 0;

  // U4 — proyecta un Flujo al shape mínimo que pide CargaMasivaView.
  const toLite = (f: Flujo) => ({ id: f.id, n3_id: f.n3_id, nombre: f.nombre });

  // U4 — la vista de Carga masiva tiene prioridad de render. Al volver, limpia
  // `cargaFlujo`: si `openFlujo` sigue seteado cae a la grilla; si no, a la lista.
  if (cargaOpen) {
    return (
      <CargaMasivaView
        flujo={cargaFlujo ? toLite(cargaFlujo) : null}
        flujos={flujos.map(toLite)}
        initialTodos={cargaTodos}
        onSelectFlujo={(lite) => setCargaFlujo(flujos.find((x) => x.id === lite.id) ?? null)}
        onBack={() => {
          setCargaOpen(false);
          setCargaFlujo(null);
        }}
      />
    );
  }

  // Crear flujo → wizard de 3 pasos. Al crear, abre la grilla del flujo nuevo
  // en el modo elegido (Publicar/Editar).
  if (wizardOpen) {
    return (
      <FlujoWizardView
        accountId={accountId}
        onCancel={() => setWizardOpen(false)}
        onCreated={(f, modo) => { setWizardOpen(false); setOpenModo(modo); setOpenFlujo(f); void reload(); }}
        cupo={cupo}
      />
    );
  }

  // Al abrir un flujo, reemplazamos la lista por la grilla editable (sin ruta
  // nueva). El n3_id del grid es el n3_id real del flujo (atado en la creación);
  // si es "" (flujo pre-Pieza B) la grilla muestra su estado vacío.
  if (openFlujo) {
    return (
      <FlujoGridView
        flujo={{ id: openFlujo.id, n3_id: openFlujo.n3_id ?? "", nombre: openFlujo.nombre }}
        accountId={accountId}
        modo={openModo}
        onBack={() => setOpenFlujo(null)}
        onOpenCargaMasiva={() => {
          setCargaTodos(false);
          setCargaFlujo(openFlujo);
          setCargaOpen(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <EcommercePageHeader
        eyebrow="Catalog Hub"
        title="Flujos de trabajo"
        actions={
          <div className="flex items-center gap-2">
            <ActionButton variant="secondary" size="sm" disabled={flujos.length === 0}
              onClick={() => {
                setCargaTodos(true);
                setCargaFlujo(null);
                setCargaOpen(true);
              }}>
              <ImageUp className="w-4 h-4" /> Carga masiva de imágenes
            </ActionButton>
            <ActionButton variant="primary" size="sm" disabled={cupoLleno}
              onClick={() => setWizardOpen(true)}>
              <Plus className="w-4 h-4" /> Crear flujo
            </ActionButton>
          </div>
        }
      />

      <div className="bg-white px-6 border-b border-gray-200 flex items-center gap-3 h-12">
        <Layers className="w-4 h-4 text-blue-700" />
        <span className="text-[12.5px] text-gray-600">
          Flujos activos: <strong className="tabular-nums">{cupo.activos}{cupo.max > 0 ? `/${cupo.max}` : ""}</strong>
          {cupo.max <= 0 && <span className="ml-1 text-gray-400">(sin límite)</span>}
          {cupoLleno && <span className="ml-2 text-rose-700">cupo lleno</span>}
        </span>
        <span className="ml-auto text-[11.5px] text-gray-500 tabular-nums">
          {busy ? "Cargando…" : `${flujos.length.toLocaleString("es-CL")} flujos`}
        </span>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="flex-1 bg-gray-100 px-6 py-6">
        <div className="bg-white rounded-md border border-gray-200 overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2 pl-5 pr-2">Nombre</th>
                <th className="text-left py-2 px-2 w-28">Estado</th>
                <th className="text-left py-2 px-2 w-28">Expira</th>
                <th className="text-left py-2 px-2 w-36">Creado por</th>
                <th className="text-left py-2 px-2 w-36">Fecha</th>
                <th className="text-right py-2 pl-2 pr-5 w-40">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {busy && flujos.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">Cargando…</td></tr>
              ) : flujos.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-500">Sin flujos — crea uno con &quot;Crear flujo&quot;.</td></tr>
              ) : (
                flujos.map((f) => (
                  <tr key={f.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60">
                    <td className="py-2.5 pl-5 pr-2">
                      <div className="font-medium text-gray-800">{f.nombre}</div>
                      {f.descripcion && <div className="text-[11px] text-gray-500">{f.descripcion}</div>}
                    </td>
                    <td className={`py-2.5 px-2 ${ESTADO_COLOR[f.estado] ?? "text-gray-700"}`}>{ESTADO_LABEL[f.estado] ?? f.estado}</td>
                    <td className={`py-2.5 px-2 ${f.vencido ? "text-rose-700" : "text-gray-600"}`}>{fmtExpira(f)}</td>
                    <td className="py-2.5 px-2 text-gray-700">{f.createdByName ?? "—"}</td>
                    <td className="py-2.5 px-2 text-gray-500 tabular-nums">{fmtDate(f.createdAt)}</td>
                    <td className="py-2.5 pl-2 pr-5">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton variant="primary" size="sm" onClick={() => { setOpenModo("publicar"); setOpenFlujo(f); }} title="Abrir grilla"><FolderOpen className="w-4 h-4" /></ActionButton>
                        <ActionButton variant="secondary" size="sm" onClick={() => { setToEdit(f); setFormOpen(true); }} title="Editar"><Pencil className="w-4 h-4" /></ActionButton>
                        {f.estado === "pausado"
                          ? <ActionButton variant="success" size="sm" onClick={() => reanudar(f.id)} title="Reanudar"><Play className="w-4 h-4" /></ActionButton>
                          : <ActionButton variant="secondary" size="sm" onClick={() => pausar(f.id)} title="Pausar"><Pause className="w-4 h-4" /></ActionButton>}
                        <ActionButton variant="danger" size="sm" onClick={() => setToDelete(f)} title="Eliminar"><Trash2 className="w-4 h-4" /></ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FlujoFormModal queda SOLO para editar (acción lápiz). Crear va por el
          wizard de 3 pasos (setWizardOpen). */}
      <FlujoFormModal
        open={formOpen} initial={toEdit} onClose={() => setFormOpen(false)}
        onSubmit={async (p) => { if (toEdit) await editar(toEdit.id, p); }}
      />
      <ConfirmModal
        open={!!toDelete} title="Eliminar flujo"
        message={`Vas a eliminar el flujo "${toDelete?.nombre ?? ""}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar" variant="danger"
        onClose={() => setToDelete(null)}
        onConfirm={async () => { const f = toDelete; setToDelete(null); if (f) await eliminar(f.id); }}
      />
    </div>
  );
}
