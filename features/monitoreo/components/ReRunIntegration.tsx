"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { ActionButton } from "@/components/ui/button/action-button";

export default function PasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // se ejecuta cuando la clave es correcta
}) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (pwd === process.env.NEXT_PUBLIC_RERUN_PWD) {
      onSuccess();
      setPwd("");
      setError("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold mb-4">
                Ingresa la contraseña
              </Dialog.Title>

              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="********"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

              <div className="mt-6 flex justify-end gap-3">
                <ActionButton variant="secondary" onClick={onClose}>
                  Cancelar
                </ActionButton>
                <ActionButton variant="primary" onClick={handleSubmit}>
                  Continuar
                </ActionButton>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
