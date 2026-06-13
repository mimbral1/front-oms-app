/* "use client";

import React, { useState } from "react";
import ActionsModal from "@/components/ui/modal/actions";
import { getEditActions, type ChangeFormData } from "@/utils/types";
import ChangeDataForm from "./ChangeDataForm";

interface PedidoActionsProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChangeFormData | null;
  onChangeStore?: (data: ChangeFormData) => void;
}

export default function EditIntegrationActions({
  isOpen,
  onClose,
  data,
  onChangeStore,
}: PedidoActionsProps) {
  const [isChangeStoreOpen, setIsChangeStoreOpen] = useState(false);

  const handleChangeStore = () => {
    onClose();
    setIsChangeStoreOpen(true);
  };

  const handleChangeStoreSubmit = (data: ChangeFormData) => {
    onChangeStore?.(data);
    setIsChangeStoreOpen(false);
  };

  const actions = getEditActions({
    onChangeStore: handleChangeStore,
  });

  return (
    <>
      {console.log(actions)}
      <ActionsModal isOpen={isOpen} onClose={onClose} actions={actions} />

      <ChangeDataForm
        isOpen={isChangeStoreOpen}
        onClose={() => setIsChangeStoreOpen(false)}
        onSubmit={handleChangeStoreSubmit}
        initialData={data}
      />
    </>
  );
}
 */

/* 
"use client";

import React, { useState } from "react";
import ActionsModal from "@/components/ui/modal/actions";
import { getEditActions, type ChangeFormData } from "@/utils/types";
import ChangeDataForm from "./ChangeDataForm";
import { useUpdateOrder } from "@/features/monitoreo/hooks/useUpdateOrderIntegration";

interface PedidoActionsProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChangeFormData | null;
  onChangeStore?: (data: ChangeFormData) => void;
}

export default function EditIntegrationActions({
  isOpen,
  onClose,
  data,
  onChangeStore,
}: PedidoActionsProps) {
  const [isChangeStoreOpen, setIsChangeStoreOpen] = useState(false);

  const { updateAndReprocess, loading, error } = useUpdateOrder();

  function buildUpdatePayload(f: ChangeFormData) {
    return {
      cardcode: f.cardcode,
      cardname: f.cardname,
      phone1: f.phone1,
      e_mail: f.e_mail,
      fixed_rut: f.fixed_rut,
      orderStatusID: f.orderStatusID,
      integrationError: f.integrationError,
      INTEGRATION_STATUS: f.INTEGRATION_STATUS,
    };
  }
  const handleSubmit = async (f: ChangeFormData) => {
    if (!data) return; // todavía no hay fila seleccionada
    try {
      const res = await updateAndReprocess(
        data.docentry, // id → URL
        buildUpdatePayload(f) // body PATCH
      );
      console.log("PATCH ✔ï¸‍", res.patch);
      console.log("REPROCESS ✔ï¸‍", res.reprocess);
      setIsChangeStoreOpen(false); // cierra formulario
      onClose(); // cierra modal de acciones
    } catch (e) {
      console.error("❌ Error actualizando pedido:", e);
    }
  };

  const handleChangeStore = () => {
    onClose();
    setIsChangeStoreOpen(true);
  };

  const handleChangeStoreSubmit = (data: ChangeFormData) => {
    onChangeStore?.(data);
    setIsChangeStoreOpen(false);
  };

  const actions = getEditActions({
    onChangeStore: handleChangeStore,
  });

  return (
    <>
      {console.log(actions)}
      <ActionsModal isOpen={isOpen} onClose={onClose} actions={actions} />

      <ChangeDataForm
        isOpen={isChangeStoreOpen}
        onClose={() => setIsChangeStoreOpen(false)}
        onSubmit={handleSubmit}
        initialData={data}
      />

      {loading && <p className="mt-2 text-sm text-blue-600">Guardando…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
} */
// components/monitoreo/EditIntegration.tsx// components/monitoreo/EditIntegration.tsx
// components/monitoreo/EditIntegration.tsx/*
/* 
"use client";
import React, { useState, useEffect } from "react";
import ActionsModal from "@/components/ui/modal/actions";
import ChangeDataForm from "./ChangeDataForm";
import { useUpdateOrder } from "@/features/monitoreo/hooks/useUpdateOrderIntegration";
import { getEditActions, type ChangeFormData } from "@/utils/types";

interface PedidoActionsProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChangeFormData | null;
  onChangeStore?: (d: ChangeFormData) => void;
}

export default function EditIntegrationActions({
  isOpen,
  onClose,
  data,
  onChangeStore,
}: PedidoActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const closeActions = () => setShowActions(false);
  useEffect(() => {
    if (isOpen) {
      setShowActions(true);
      setShowForm(false);
    }
  }, [isOpen]);

  const { updateAndReprocess, loading, error } = useUpdateOrder();

  const buildPayload = (f: ChangeFormData) => ({
    cardcode: f.cardcode,
    cardname: f.cardname,
    phone1: f.phone1,
    e_mail: f.e_mail,
    fixed_rut: f.fixed_rut,
    orderStatusID: f.orderStatusID,
    integrationError: f.integrationError,
    INTEGRATION_STATUS: f.INTEGRATION_STATUS,
  });

  const handleSubmit = async (f: ChangeFormData) => {
    if (!data) return;
    await updateAndReprocess(data.docentry, buildPayload(f));
    onChangeStore?.(f); // si el padre lo necesita
    onClose(); // cerrar todo
  };

  const handleChangeData = () => {
    setShowActions(false);
    setShowForm(true);
  };

  const actions = getEditActions({ onChangeStore: handleChangeData });

  const closeAll = () => {
    setShowActions(false);
    setShowForm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <ActionsModal
        isOpen={showActions}
        onClose={closeActions}
        actions={actions}
      />

      <ChangeDataForm
        isOpen={showForm}
        onClose={closeAll} // cerrar todo si pulsa «Cancelar»
        onSubmit={handleSubmit}
        initialData={data}
      />

      {loading && <p className="mt-2 text-sm text-blue-600">Guardando…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
} */
"use client";
import React, { useState, useEffect } from "react";
import ActionsModal from "@/components/ui/modal/actions";
import ChangeDataForm from "./ChangeDataForm";
import { getEditActions, type ChangeFormData } from "@/utils/types";
import { useUpdateOrder } from "@/features/monitoreo/hooks/useUpdateOrderIntegration";
import toast from "react-hot-toast";

import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void; // cierra TODO
  data: ChangeFormData | null;
  onChangeStore?: (d: ChangeFormData) => void;
}

type BasicPatch = {
  message: string;
  result?: { updated: string[] }; // ↍ la clave puede faltar
};

// 🚩 2. el mock con ese tipo
const MOCK_PATCH: BasicPatch = {
  message: "Orden actualizada",
  result: {
    updated: [
      "cardcode",
      "cardname",
      "phone1",
      "e_mail",
      "fixed_rut",
      "orderStatusID",
      "integrationError",
      "INTEGRATION_STATUS",
    ],
  },
};

function showSuccess(orderID: number | string, updated: string[]) {
  toast.custom(
    (t) => (
      <div className="pointer-events-auto w-80 max-w-full rounded-lg bg-white shadow-lg ring-1 ring-black/10 animate-enter">
        <div className="flex p-4">
          {/* icono de éxito */}
          <CheckCircleIcon className="h-6 w-6 shrink-0 text-green-500" />

          {/* contenido */}
          <div className="ml-3 grow text-left">
            <p className="text-sm font-semibold text-gray-900">
              Orden actualizada
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Pedido&nbsp;
              <span className="font-medium text-gray-900">{orderID}</span>
              &nbsp;actualizado correctamente
            </p>

            <ul className="mt-2 list-disc list-inside text-xs text-gray-500 space-y-0.5">
              {updated.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          {/* botón de cerrar */}
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-4 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    ),
    {
      position: "top-center",
      duration: 4000,
    }
  );
}

export default function EditIntegrationActions({
  isOpen,
  onClose,
  data,
}: Props) {
  /* ---------- estado visual ---------- */
  const [showActions, setShowActions] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [lastPatch, setLastPatch] = useState<BasicPatch | null>(null);

  /* cada vez que el padre abre -> reinicia */
  useEffect(() => {
    if (isOpen) {
      setShowActions(true);
      setShowForm(false);
    }
  }, [isOpen]);
  console.log("Data desde EditIntegration: ", data);

  /* ---------- llamadas API ---------- */
  const { updateAndReprocess, loading, error } = useUpdateOrder();

  const buildPayload = (f: ChangeFormData) => ({
    cardcode: f.cardcode,
    cardname: f.cardname,
    phone1: f.phone1,
    e_mail: f.e_mail,
    fixed_rut: f.fixed_rut,
    orderStatusID: f.orderStatusID,
    integrationError: f.integrationError,
    INTEGRATION_STATUS: f.INTEGRATION_STATUS,
  });

  const handleSubmit = async (f: ChangeFormData) => {
    if (!data) return;
    const res = await updateAndReprocess(data.orderID, buildPayload(f));
    setLastPatch(res.patch as BasicPatch);
    if (res.patch?.message === "Orden actualizada") {
      toast.success(`Pedido ${data.orderID} actualizado correctamente`);
    }
    onClose();
  };

  /* ---------- acciones del menú ---------- */
  const handleChangeData = () => {
    setShowActions(false); // oculta menú
    setShowForm(true); // muestra form
  };

  const actions = getEditActions({ onChangeStore: handleChangeData });

  /* ---------- cierres ---------- */
  const closeAll = () => {
    // overlay, Esc, “X” o cancelar

    const patch = lastPatch ?? MOCK_PATCH;
    const updated = patch.result?.updated ?? [];

    //showSuccess(data?.orderID ?? "—", updated);
    setShowActions(false);
    setShowForm(false);
    onClose();
  };

  if (!isOpen) return null; // padre decide montaje

  return (
    <>
      {/* Menú */}
      <ActionsModal
        isOpen={showActions}
        onClose={closeAll} // overlay / X
        actions={actions}
      />

      {/* Formulario */}
      <ChangeDataForm
        isOpen={showForm}
        onClose={closeAll} // “Cancelar” del form
        onSubmit={handleSubmit}
        initialData={data}
      />

      {loading && <p className="mt-2 text-sm text-blue-600">Guardando…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
