"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { modalOverlay } from "./modal.styles";

export interface SimpleModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Ancho máximo del panel (Tailwind class). Default: "sm:max-w-xl" */
  maxWidth?: string;
  /**
   * Clases del contenedor del body (reemplaza padding/layout por defecto).
   * Default: "px-8 py-8 flex flex-col justify-center"
   */
  bodyClassName?: string;
}

export function SimpleModal({
  open,
  title,
  onClose,
  children,
  maxWidth = "sm:max-w-xl",
  bodyClassName = "px-8 py-8 flex flex-col justify-center",
}: SimpleModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
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
          <div className={modalOverlay} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-xl`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-3">
                  <Dialog.Title className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {/* Body */}
                <div
                  className={`max-h-[70vh] overflow-y-auto ${bodyClassName}`}
                >
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
