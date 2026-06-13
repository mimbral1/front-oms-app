"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Action, PageHeader } from "@/components/layout/page-header";
//import { PickerUserConfig } from "@/features/picking/types/users";
import { useCreatePicker } from "@/features/picking/hooks/useCreatePickerUser";
import { ArrowDownOnSquareIcon, XCircleIcon } from "@heroicons/react/24/outline";

/**
 * Un estado inicial mínimo para crear un Picker.
 * Ajusta según tus necesidades reales.
 */
export interface PickerUserConfig {
  rut: string;
  name: string;
  lastname: string;
  email: string;
  company: string;
  location: string;
  picking: number;
  createdBy: {
    name: string;
    email: string;
  };
  dateCreated: string;
  dateModified: string;
  user: any;
  status: string;
}

const initialPicker: PickerUserConfig = {
  rut: "",
  name: "",
  lastname: "",
  email: "",
  company: "",
  location: "",
  picking: 0,
  createdBy: {
    name: "",
    email: "",
  },
  dateCreated: new Date().toISOString(),
  dateModified: new Date().toISOString(),
  user: undefined,
  status: "Active",
};

export default function NuevoPickerPage() {
  const router = useRouter();

  // Estado local del formulario
  const [picker, setPicker] = useState<PickerUserConfig>(initialPicker);

  const { createPicker, loading, error } = useCreatePicker();

  // Manejo de cambios en los campos del formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPicker((prev) => ({
      ...prev,
      [name]: name === "picking" ? Number(value) : value,
    }));
  };

  // Simula la acción "Aplicar": podrías guardar cambios parciales, etc.
  const handleApply = () => {
    console.log("Aplicar cambios temporalmente:", picker);
    // Lógica adicional si fuera necesario
  };

  // Simula la acción "Guardar": guardamos y volvemos al listado
  const handleSave = async () => {
    try {
      const res = await createPicker(picker);
      if (res?.success) {
        // Redirigimos al listado tras guardar
        router.push("/picking/configuraciones");
      }
    } catch (err) {
      console.error("Error al guardar el picker:", err);
    }
  };

  // Guardar y crear nuevo
  const handleSaveAndNew = async () => {
    try {
      const res = await createPicker(picker);
      if (res?.success) {
        // Reseteamos
        setPicker(initialPicker);
      }
    } catch (err) {
      console.error("Error al guardar y crear nuevo:", err);
    }
  };

  // Simula la acción "Cancelar": volvemos al listado sin guardar
  const handleCancel = () => {
    router.push("/picking/configuraciones/pickers");
  };

  // Acciones para el PageHeader
  const headerActions: Action[] = [
    /* { label: "Aplicar", variant: "primary", onClick: handleApply }, */
    { label: "Guardar", variant: "success", onClick: handleSave, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
    {
      label: "Guardar y crear nuevo",
      variant: "success",
      onClick: handleSaveAndNew,
      icon: <ArrowDownOnSquareIcon className="h-5 w-5" />,
    },
    { label: "Volver al listado", variant: "secondary", onClick: handleCancel, icon: <XCircleIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fc]">
      {/* Encabezado con acciones */}
      <PageHeader title="Nuevo" action={headerActions} />
      {/* Contenido principal */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sección PRINCIPAL */}
          <section>
            <h2 className="text-lg font-semibold mb-3">PRINCIPAL</h2>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Campo: User */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  User
                </label>
                {/* 
                  Podrías usar un componente de selección de usuario o un input normal.
                  En el ejemplo, solo un input de texto:
                */}
                <input
                  type="text"
                  name="createdBy.name"
                  value={picker.createdBy.name}
                  onChange={(e) =>
                    setPicker((prev) => ({
                      ...prev,
                      createdBy: {
                        ...prev.createdBy,
                        name: e.target.value,
                      },
                    }))
                  }
                  placeholder="Nombre de usuario creador"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {picker.createdBy.email || "email@ejemplo.com"}
                </p>
              </div>

              {/* Nombre */}
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={picker.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Apellido */}
              <div className="mb-4">
                <label
                  htmlFor="lastname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Apellido
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={picker.lastname}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={picker.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            </div>
          </section>

          {/* Sección DETALLE */}
          <section>
            <h2 className="text-lg font-semibold mb-3">DETALLE</h2>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Documento / RUT */}
              <div className="mb-4">
                <label
                  htmlFor="rut"
                  className="block text-sm font-medium text-gray-700"
                >
                  Documento (RUT / ID)
                </label>
                <input
                  type="text"
                  id="rut"
                  name="rut"
                  value={picker.rut}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* ID Funcionario */}
              <div className="mb-4">
                <label
                  htmlFor="picking"
                  className="block text-sm font-medium text-gray-700"
                >
                  ID Funcionario / #Pickings
                </label>
                <input
                  type="number"
                  id="picking"
                  name="picking"
                  value={picker.picking}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Active warehouse / Ubicación */}
              <div className="mb-4">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Active warehouse
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={picker.location}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              {/* Estado */}
              <div className="mb-4">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  value={picker.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
