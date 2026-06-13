"use client";

import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

export interface ChangeStoreFormData {
  rut: string;
}

/* ╍╍╍╍╍╍╍╍╍ helpers RUT ╍╍╍╍╍╍╍╍╍ */
const cleanRut = (rut: string) => rut.replace(/[.\-]/g, "").toUpperCase();

const formatRut = (rut: string) => {
  const c = cleanRut(rut);
  if (!c) return "";
  const body = c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${c.slice(-1)}`;
};

const calcDv = (rutBody: string) => {
  let sum = 0,
    multiplier = 2;
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += Number(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  return mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
};

const isRutValid = (rut: string) => {
  const c = cleanRut(rut);
  if (c.length < 2) return false;
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  return calcDv(body) === dv;
};

/* ╍╍╍╍╍╍╍╍╍ componente ╍╍╍╍╍╍╍╍╍ */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChangeStoreFormData) => void; // ahora solo { rut: string }
}

export default function ChangeStoreForm({ isOpen, onClose, onSubmit }: Props) {
  const [rut, setRut] = useState("");
  const [error, setError] = useState("");

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRut(formatRut(raw));
    if (error) setError(""); // limpia mensaje al escribir
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRutValid(rut)) {
      setError("RUT inválido");
      return;
    }
    onSubmit({ rut }); // solo enviamos el rut
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="mb-6 text-lg font-semibold leading-6 text-gray-900"
                >
                  Editar RUT
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* RUT */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={rut}
                      onChange={handleRutChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="12.345.678-5"
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                  </div>

                  {/* ── Acciones ───────────────────────────────────────────── */}
                  <div className="sm:flex sm:flex-row-reverse sm:pt-2">
                    <ActionButton type="submit" variant="primary">
                      Guardar
                    </ActionButton>
                    <ActionButton type="button" variant="secondary" onClick={onClose}>
                      Cancelar
                    </ActionButton>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

/* ─────────────────────────────────────────────
   Campos eliminados: location, inventory, carrier,
   schedule, type, ,useLastAddress. Están comentados
   en el archivo original por si necesitas volver
   atrás. El formulario ahora envía solo { rut }.
   ───────────────────────────────────────────── */
