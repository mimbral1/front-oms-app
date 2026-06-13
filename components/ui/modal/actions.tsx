"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  modalDefaultOverlay,
  modalDefaultPanel,
  modalDefaultCloseButton,
  modalDefaultTitle,
  modalDefaultActionIcon,
  modalDefaultActionLabel,
} from "./modal.styles";
import { ActionButton } from "@/components/ui/button/action-button";

export interface Action {
  id: string;
  label: string;
  icon: any;
  onClick?: () => void;
}

interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Action[];
}

export default function ActionsModal({
  isOpen,
  onClose,
  title = "Acciones",
  actions,
}: ActionsModalProps) {
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
          <div className={modalDefaultOverlay} />
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
              <Dialog.Panel className={modalDefaultPanel}>
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className={modalDefaultCloseButton}
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <Dialog.Title
                    as="h3"
                    className={modalDefaultTitle}
                  >
                    {title}
                  </Dialog.Title>
                  <div className="mt-2">
                    <div className="divide-y divide-gray-100">
                      {actions.map((action) => (
                        <ActionButton
                          key={action.id}
                          onClick={() => action.onClick?.()}
                          variant="text"
                          className="flex h-auto w-full items-center justify-start gap-3 rounded-none px-3 py-4 hover:bg-gray-50"
                        >
                          <action.icon className={modalDefaultActionIcon} />
                          <span className={modalDefaultActionLabel}>
                            {action.label}
                          </span>
                        </ActionButton>
                      ))}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
