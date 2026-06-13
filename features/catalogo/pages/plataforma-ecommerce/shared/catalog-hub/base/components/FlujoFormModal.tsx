// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/FlujoFormModal.tsx
"use client";
import { useEffect, useState } from "react";
import { SimpleModal } from "@/components/ui/modal";
import { ActionButton } from "@/components/ui";
import type { Flujo } from "../types/flujo-types";

export function FlujoFormModal({ open, initial, onClose, onSubmit }: {
  open: boolean; initial?: Flujo | null; onClose: () => void;
  onSubmit: (p: { nombre: string; descripcion: string | null }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setNombre(initial?.nombre ?? ""); setDescripcion(initial?.descripcion ?? ""); setErr(null); }
  }, [open, initial]);

  const submit = async () => {
    if (!nombre.trim()) { setErr("El nombre es obligatorio."); return; }
    setSaving(true); setErr(null);
    try { await onSubmit({ nombre: nombre.trim(), descripcion: descripcion.trim() || null }); onClose(); }
    catch (e) { setErr((e as Error)?.message ?? "No se pudo guardar."); }
    finally { setSaving(false); }
  };

  return (
    <SimpleModal open={open} title={initial ? "Editar flujo" : "Crear flujo"} onClose={onClose} maxWidth="sm:max-w-md">
      <div className="space-y-4">
        <div>
          <label className="block text-[12.5px] text-gray-600 mb-1">Nombre</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={nombre}
            onChange={(e) => setNombre(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="block text-[12.5px] text-gray-600 mb-1">Descripción</label>
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[90px]" value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        {err && <p className="text-sm text-rose-700">{err}</p>}
        <div className="flex justify-end gap-2">
          <ActionButton variant="secondary" size="sm" onClick={onClose}>Cerrar</ActionButton>
          <ActionButton variant="primary" size="sm" loading={saving} onClick={submit}>Guardar</ActionButton>
        </div>
      </div>
    </SimpleModal>
  );
}
