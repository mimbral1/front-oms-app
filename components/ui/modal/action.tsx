import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  modalOverlay,
  modalPanel,
  modalTitle,
  modalCloseButton,
  modalDescription,
} from "./modal.styles";
import { ActionButton } from "@/components/ui/button/action-button";

export interface Action {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger" | "warning" | "error";
  icon?: React.ReactNode;
}

interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions: Action[];
}

export function ActionsModal({
  isOpen,
  onClose,
  title,
  description,
  actions,
}: ActionsModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={modalPanel}>
                <Dialog.Title
                  as="h3"
                  className={modalTitle}
                >
                  {title}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className={modalCloseButton}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {description && (
                  <div className="mt-2">
                    <p className={modalDescription}>{description}</p>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {actions.map((action, index) => (
                    <ActionButton
                      key={index}
                      onClick={() => {
                        action.onClick();
                        onClose();
                      }}
                      variant={
                        action.variant === "danger"
                          ? "error"
                          : action.variant === "warning"
                            ? "warning"
                            : "primary"
                      }
                      className="w-full"
                    >
                      {action.label}
                    </ActionButton>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
