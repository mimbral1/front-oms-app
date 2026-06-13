"use client";

import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { getPedidoActions } from "@/utils/types";

interface PedidoActionsProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCancel?: () => void;
  onPrint?: () => void;
  onFulfillmentPlan?: () => void;
}

export default function PedidoActions({
  isOpen,
  onClose,
  onRequestCancel,
  onPrint,
  onFulfillmentPlan,
}: PedidoActionsProps) {
  const runAndClose = (callback?: () => void) => {
    onClose();
    callback?.();
  };

  const actions = getPedidoActions({
    onRequestCancel: () => runAndClose(onRequestCancel),
    onPrint: () => runAndClose(onPrint),
    onRefundAmount: onClose,
    onRefundItems: onClose,
    onFulfillmentPlan: () => runAndClose(onFulfillmentPlan),
  });

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-transparent" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-2xl rounded-sm bg-white px-8 py-7 text-left shadow-xl ring-1 ring-gray-100">
                <div className="mb-9 flex items-start justify-between">
                  <Dialog.Title className="text-base font-bold uppercase tracking-wide text-gray-700">
                    ACCIONES
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-full p-1 text-gray-700 transition hover:bg-gray-100"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-8 w-8" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-x-12 gap-y-7 sm:grid-cols-2">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        className="flex items-center gap-4 text-left text-lg font-semibold text-[#6f99ff] transition hover:text-blue-600"
                        onClick={action.onClick}
                      >
                        <Icon className="h-8 w-8 shrink-0 stroke-[1.7]" />
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
