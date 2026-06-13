/* "use client";

import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";
import type { ChangeFormData } from "@/utils/types";

interface ChangeDataFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChangeFormData) => void;
  initialData?: ChangeFormData | null;
}

const emptyForm: ChangeFormData = {
  docentry: 0,
  docnum: 0,
  folionum: 0,
  cardcode: "",
  cardname: "",
  phone1: "",
  e_mail: "",
  doctotalsy: 0,
  docdate: "",
  itemsAmount: 0,
  orderStatusID: 0,
  paymentMethodID: 0,
  deliveryTypeID: 0,
  salesChannelID: 0,
  recipient: "",
  deliveryDate: null,
  lastQueryDate: null,
  createdate: "",
  createts: 0,
  Product: {
    itemcode: "",
    dscription: "",
    quantity: 0,
    price: 0,
  },
};

export default function ChangeDataForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ChangeDataFormProps) {
  const [formData, setFormData] = useState<ChangeFormData>(emptyForm);

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData(emptyForm); // limpia al cerrar
  }, [initialData]);

  /* helpers 
  const handleChange =
    <K extends keyof ChangeFormData>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ ...formData, [k]: e.target.value });

  const handleProd =
    <K extends keyof ChangeFormData["Product"]>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({
        ...formData,
        Product: { ...formData.Product, [k]: e.target.value },
      });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  /* UI 
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* ─── overlay ─── 
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
        </Transition.Child>

        {/* ─── panel ─── 
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-6 sm:items-center sm:p-0 ">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative bg-white w-full max-w-2xl transform overflow-hidden rounded-lg  shadow-xl transition-all">
                {/* close btn 
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* header 
                <div className="border-b px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Editar datos del pedido
                  </Dialog.Title>
                </div>

                {/* form 
                <form onSubmit={handleSubmit} className="space-y-10 p-6">
                  {/* ── sección datos generales ── 
                  <fieldset>
                    <legend className="mb-4 text-base font-medium text-gray-700">
                      Datos generales
                    </legend>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="DocEntry"
                        type="number"
                        value={formData.docentry}
                        onChange={handleChange("docentry")}
                      />
                      <Input
                        label="DocNum"
                        type="number"
                        value={formData.docnum}
                        onChange={handleChange("docnum")}
                      />
                      <Input
                        label="FolioNum"
                        type="number"
                        value={formData.folionum}
                        onChange={handleChange("folionum")}
                      />
                      <Input
                        label="CardCode"
                        value={formData.cardcode}
                        onChange={handleChange("cardcode")}
                      />
                      <Input
                        label="CardName"
                        value={formData.cardname}
                        onChange={handleChange("cardname")}
                      />
                      <Input
                        label="Teléfono"
                        value={formData.phone1}
                        onChange={handleChange("phone1")}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={formData.e_mail}
                        onChange={handleChange("e_mail")}
                        className="sm:col-span-2"
                      />

                      {/* fecha 
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Fecha documento
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formData.docdate.split("T")[0]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                docdate: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border-gray-300 px-3 py-2 pl-10"
                          />
                          <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <Input
                        label="Recipient"
                        value={formData.recipient}
                        onChange={handleChange("recipient")}
                        className="sm:col-span-2"
                      />
                    </div>
                  </fieldset>

                  {/* ── sección producto ── 
                  <fieldset>
                    <legend className="mb-4 text-base font-medium text-gray-700">
                      Producto
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="ItemCode"
                        value={formData.Product.itemcode}
                        onChange={handleProd("itemcode")}
                      />
                      <Input
                        label="Descripción"
                        value={formData.Product.dscription}
                        onChange={handleProd("dscription")}
                      />
                      <Input
                        label="Cantidad"
                        type="number"
                        value={formData.Product.quantity}
                        onChange={handleProd("quantity")}
                      />
                      <Input
                        label="Precio"
                        type="number"
                        value={formData.Product.price}
                        onChange={handleProd("price")}
                      />
                    </div>
                  </fieldset>

                  {/* buttons 
                  <div className="flex justify-end gap-3">
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
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

/* ——— Input helper component ——— 
function Input({
  label,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...rest}
        className="w-full rounded-lg bg-gray-50 border-gray-700 px-3 py-2"
      />
    </div>
  );
}
/*  */
// ChangeDataForm.tsx
// components/monitoreo/ChangeDataForm.tsx
"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/button/action-button";
import type { ChangeFormData } from "@/utils/types";
import { isValidEmail, isValidRUT } from "@/utils/validate";

export default function ChangeDataForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (d: ChangeFormData) => void;
  initialData?: ChangeFormData | null;
}) {
  const empty: ChangeFormData = {
    orderID: 0,
    docentry: 0,
    docnum: 0,
    folionum: 0,
    cardcode: "",
    cardname: "",
    phone1: "",
    e_mail: "",
    doctotalsy: 0,
    docdate: "",
    // itemsAmount: 0,
    orderStatusID: 1,
    paymentMethodID: 0,
    deliveryTypeID: 0,
    salesChannelID: 0,
    recipient: "",
    deliveryDate: null,
    lastQueryDate: null,
    createdate: "",
    createts: 0,
    Product: { itemcode: "", dscription: "", quantity: 0, price: 0 },

    /* ↍ añadimos las 3 claves extra si todavía no existían */
    fixed_rut: "",
    integrationError: null,
    INTEGRATION_STATUS: "ready-for-handling",
  };

  const [form, setForm] = useState<ChangeFormData>(initialData ?? empty);
  const [rutOk, setRutOk] = useState(true);
  const [emailOk, setEmailOk] = useState(true);
  useEffect(() => setForm(initialData ?? empty), [initialData]);

  const set =
    <K extends keyof ChangeFormData>(k: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm({ ...form, [k]: e.target.value as any });
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm({ ...form, e_mail: v });
    setEmailOk(v === "" || isValidEmail(v));
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm({ ...form, fixed_rut: v });
    setRutOk(v === "" || isValidRUT(v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutOk || !emailOk) return;
    onSubmit(form);
  };
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        {/* --- overlay --- */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        {/* --- panel centrado --- */}
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <Dialog.Title className="mb-4 text-lg font-semibold">
                Editar datos del pedido
              </Dialog.Title>

              {/* ---- tu formulario ---- */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="RUT (cardcode)"
                  value={form.cardcode}
                  onChange={set("cardcode")}
                />
                <Input
                  label="Nombre cliente"
                  value={form.cardname}
                  onChange={set("cardname")}
                />
                <Input
                  label="Teléfono"
                  value={form.phone1}
                  onChange={set("phone1")}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="usuario@dominio.cl"
                  value={form.e_mail}
                  onChange={handleEmailChange}
                  error={!emailOk}
                  errorMessage="Email inválido"
                />
                {/* <Input
                  label="Email"
                  type="email"
                  value={form.e_mail}
                  onChange={set("e_mail")}
                /> */}
                {/* <Input
                  label="RUT corregido"
                  value={form.fixed_rut}
                  onChange={set("fixed_rut")}
                /> */}
                <Input
                  label="RUT corregido"
                  placeholder="12.345.678-9"
                  value={form.fixed_rut}
                  onChange={handleRutChange}
                  error={!rutOk}
                  errorMessage="RUT inválido"
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Order Status ID
                  </label>

                  <select
                    value={form.orderStatusID}
                    onChange={set("orderStatusID")}
                    className="  w-full rounded-lg border px-3 py-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value={1}>1: Pendiente</option>
                    <option value={2}>2: En proceso</option>
                    <option value={3}>3: Completado</option>
                  </select>
                </div>

                <Input
                  label="Integration Error"
                  value={form.integrationError ?? ""}
                  onChange={set("integrationError")}
                />
                <Input
                  label="Integration Status"
                  value={form.INTEGRATION_STATUS}
                  onChange={set("INTEGRATION_STATUS")}
                />

                <div className="mt-6 flex justify-end gap-3">
                  <ActionButton
                    type="submit"
                    variant="primary"
                    disabled={!rutOk || !emailOk}
                  >
                    Guardar
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                  >
                    Cancelar
                  </ActionButton>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

/* helper */
/* function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }
) {
  const { label, className = "", ...rest } = props;
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...rest}
        className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2"
      />
    </div>
  );
}
 */
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: boolean;
  errorMessage?: string;
};
function Input({
  label,
  error,
  errorMessage,
  className = "",
  ...rest
}: InputProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        {...rest}
        className={`w-full rounded-lg px-3 py-2 border
          ${error ? "border-red-500" : "border-gray-300"} bg-gray-50`}
      />

      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
