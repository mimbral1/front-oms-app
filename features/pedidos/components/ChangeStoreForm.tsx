import React, { Fragment, useState } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { type ChangeStoreFormData } from "@/utils/types";
import { ActionButton } from "@/components/ui/button/action-button";

interface ChangeStoreFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChangeStoreFormData) => void;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ChangeStoreForm({
  isOpen,
  onClose,
  onSubmit,
}: ChangeStoreFormProps) {
  const [formData, setFormData] = useState<ChangeStoreFormData>({
    // Campos existentes
    location: "",
    inventory: "",
    carrier: "",
    startDate: "",
    endDate: "",
    schedule: "",
    type: "",
    // Selector
    useLastAddress: false,
    // Campos nuevos de dirección
    addressStreet: "",
    addressNumber: "",
    addressApartment: "",
    addressCommune: "",
    addressCity: "",
    addressRegion: "",
    addressReference: "",
    contactName: "",
    contactPhone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const onField =
    <K extends keyof ChangeStoreFormData>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value as ChangeStoreFormData[K] }));

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
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-y-auto rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 max-h-[90vh]">

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

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-6"
                    >
                      Cambiar tienda
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Ubicación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ubicación
                        </label>
                        <select
                          value={formData.location}
                          onChange={onField("location")}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                        >
                          <option value="">Seleccionar ubicación</option>
                          <option value="palermo">Palermo</option>
                        </select>
                      </div>

                      {/* Inventario */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Inventario
                        </label>
                        <input
                          type="text"
                          value={formData.inventory}
                          onChange={onField("inventory")}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none focus:ring-indigo-500"
                          placeholder="Ingresa el inventario"
                        />
                      </div>

                      {/* Transportista */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transportista
                        </label>
                        <input
                          type="text"
                          value={formData.carrier}
                          onChange={onField("carrier")}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none focus:ring-indigo-500"
                          placeholder="Ingresa el transportista"
                        />
                      </div>

                      {/* Programación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Programación
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.startDate}
                              onChange={onField("startDate")}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none focus:ring-indigo-500 pl-10"
                              placeholder="dd-mm-aaaa"
                            />
                            <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.endDate}
                              onChange={onField("endDate")}
                              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none focus:ring-indigo-500 pl-10"
                              placeholder="dd-mm-aaaa"
                            />
                            <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                        </div>
                      </div>

                      {/* Horario */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horario
                        </label>
                        <input
                          type="text"
                          value={formData.schedule}
                          onChange={onField("schedule")}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none focus:ring-indigo-500"
                          placeholder="dd-mm-aaaa hh:mm - hh:mm"
                        />
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo
                        </label>
                        <input
                          type="text"
                          value={formData.type}
                          onChange={onField("type")}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none focus:ring-indigo-500"
                          placeholder="Ingresa el tipo"
                        />
                      </div>

                      {/* ===== Selector: Usar última dirección ===== */}
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Usar última dirección
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Si activas esta opción, no será necesario ingresar una nueva dirección.
                            </p>
                          </div>
                          <Switch
                            checked={formData.useLastAddress}
                            onChange={(value: boolean) =>
                              setFormData((prev) => ({ ...prev, useLastAddress: value }))
                            }
                            className={classNames(
                              formData.useLastAddress ? "bg-indigo-600" : "bg-gray-200",
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            )}
                          >
                            <span
                              className={classNames(
                                formData.useLastAddress ? "translate-x-6" : "translate-x-1",
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                              )}
                            />
                          </Switch>
                        </div>

                        {/* ===== Campos de Dirección (condicionales) ===== */}
                        {!formData.useLastAddress && (
                          <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Calle
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressStreet}
                                  onChange={onField("addressStreet")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Ej. Av. Siempre Viva"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Número
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressNumber}
                                  onChange={onField("addressNumber")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="1234"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Depto./Casa
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressApartment}
                                  onChange={onField("addressApartment")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Opcional"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Comuna
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressCommune}
                                  onChange={onField("addressCommune")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Ej. Providencia"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Ciudad
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressCity}
                                  onChange={onField("addressCity")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Ej. Santiago"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Región
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressRegion}
                                  onChange={onField("addressRegion")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Ej. Metropolitana"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Referencia
                                </label>
                                <input
                                  type="text"
                                  value={formData.addressReference}
                                  onChange={onField("addressReference")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Entre calles, portería, etc."
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Contacto (nombre)
                                </label>
                                <input
                                  type="text"
                                  value={formData.contactName}
                                  onChange={onField("contactName")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="Persona que recibe"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Teléfono
                                </label>
                                <input
                                  type="tel"
                                  value={formData.contactPhone}
                                  onChange={onField("contactPhone")}
                                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 outline-none"
                                  placeholder="+56 9 1234 5678"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <ActionButton type="submit" variant="primary">
                          Guardar
                        </ActionButton>
                        <ActionButton type="button" variant="secondary" onClick={onClose}>
                          Cancelar
                        </ActionButton>
                      </div>
                    </form>
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
