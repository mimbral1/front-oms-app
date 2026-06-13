"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { FaRegQuestionCircle } from "react-icons/fa";
import { CirclePlus, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/button/action-button";

export interface Esquema {
  id?: string,
  nombre: string,
  refId: string,
  motivo: string,
  posicion_inicial: string,
  posicion_final: string,
  status: "Active" | "Inactive",
  created?: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
}

interface Props {
  record: Esquema;
  readOnly?: boolean;
  onChange?: (field: keyof Esquema, value: string) => void;
}

export const EsquemaFields: React.FC<Props> = ({
  record,
  readOnly = true,
  onChange,
}) => {
  const handle =
    (field: keyof Esquema) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange?.(field, e.target.value);
      };

  // anadir y eliminar campos
  const [variables, setVariables] = React.useState<
    { motivo: string; decimales: string; posicion_inicial: string; posicion_final: string }[]
  >([]);


  const handleAddVariable = () => {
    const yaUsados = variables.map((v) => v.motivo);
    const disponibles = opcionesDisponibles.filter(
      (op) => !yaUsados.includes(op)
    );

    if (disponibles.length === 0) return; // no quedan opciones

    setVariables((prev) => [
      ...prev,
      {
        motivo: "",
        decimales: "",
        posicion_inicial: "",
        posicion_final: "",
      },
    ]);
  };


  const removeVariable = (indexToRemove: number) => {
    setVariables(variables.filter((_, idx) => idx !== indexToRemove));
  };

  // campos variables segun motivo seleccionado
  const variableOptions: Record<string, string[]> = {
    Code128: ["Cantidad", "Precio", "Número de lote", "Fecha de expedición"],
    "EAN13": ["Cantidad", "Precio"],
    "UPC-A": ["Cantidad", "Precio"],
  };
  const opcionesDisponibles = variableOptions[record.motivo] || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/** DETALLE */}
          <Card
            title="DETALLE"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              {/* nombre */}
              <span className="col-span-1 text-sm text-gray-600 font-bold font-bold">Nombre</span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.nombre}
                  </a>
                ) : (
                  <input
                    type="text"
                    value={record.nombre}
                    onChange={handle("nombre")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
              {/* ref id */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Ref ID
              </span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.refId}
                  </a>
                ) : (
                  <input
                    type="text"
                    value={record.refId}
                    onChange={handle("refId")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
              {/* motivo */}
              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Motivo
              </span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.motivo}
                  </a>
                ) : (
                  <select
                    value={record.motivo}
                    onChange={handle("motivo")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900 bg-white"
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="UPC-A">UPC-A</option>
                    <option value="EAN13">EAN13</option>
                    <option value="Code128">Code128</option>
                  </select>
                )}
              </div>
            </div>
          </Card>

          {/** POSICION REF ID (ITEM) */}
          <Card
            title="POSICIÓN REF ID (ÍTEM)"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4">
              <span className="col-span-1 text-sm text-gray-600 font-bold">Posición inicial</span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.posicion_inicial}
                  </a>
                ) : (
                  <input
                    type="text"
                    value={record.posicion_inicial}
                    onChange={handle("posicion_inicial")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>

              <span className="col-span-1 text-sm text-gray-600 font-bold">
                Posición final
              </span>
              <div className="col-span-5">
                {readOnly ? (
                  <a
                    href="#"
                    className="text-sm font-medium text-blue-600 underline truncate"
                  >
                    {record.posicion_final}
                  </a>
                ) : (
                  <input
                    type="text"
                    value={record.posicion_final}
                    onChange={handle("posicion_final")}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        {/** ─── RIGHT COLUMN ─── */}
        <div className="space-y-6">
          <Card
            title="VARIABLES"
            icon={FaRegQuestionCircle}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            {/* boton add variables */}
            {variables.map((variable, index) => (
              <div
                key={index}
                className="relative border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
              >
                {/* Ícono papelera */}
                {!readOnly && (
                  <button
                    onClick={() => removeVariable(index)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-red-600 transition"
                    title="Eliminar variable"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <br />

                {/* Campos en filas de 2 columnas */}
                <div className="grid grid-cols-6 gap-4 mt-6">
                  {/* Motivo */}
                  <span className="col-span-2 text-sm text-gray-600 font-bold">Motivo</span>
                  <div className="col-span-4">
                    <select
                      className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900 bg-white"
                      value={variable.motivo}
                      onChange={(e) => {
                        const updated = [...variables];
                        updated[index].motivo = e.target.value;
                        setVariables(updated);
                      }}
                    >
                      <option value="">Seleccione una opción</option>
                      {opcionesDisponibles
                        .filter((opcion) => {
                          const yaUsado = variables.some(
                            (v, i) => v.motivo === opcion && i !== index
                          );
                          return !yaUsado;
                        })
                        .map((opcion) => (
                          <option key={opcion} value={opcion}>
                            {opcion}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Decimales */}
                  <span className="col-span-2 text-sm text-gray-600 font-bold">Decimales</span>
                  <div className="col-span-4">
                    <input
                      type="number"
                      className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                      value={variable.decimales}
                      onChange={(e) => {
                        const updated = [...variables];
                        updated[index].decimales = e.target.value;
                        setVariables(updated);
                      }}
                    />
                  </div>

                  {/* Posición inicial */}
                  <span className="col-span-2 text-sm text-gray-600 font-bold">Posición inicial</span>
                  <div className="col-span-4">
                    <input
                      type="number"
                      className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                      value={variable.posicion_inicial}
                      onChange={(e) => {
                        const updated = [...variables];
                        updated[index].posicion_inicial = e.target.value;
                        setVariables(updated);
                      }}
                    />
                  </div>

                  {/* Posición final */}
                  <span className="col-span-2 text-sm text-gray-600 font-bold">Posición final</span>
                  <div className="col-span-4">
                    <input
                      type="number"
                      className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                      value={variable.posicion_final}
                      onChange={(e) => {
                        const updated = [...variables];
                        updated[index].posicion_final = e.target.value;
                        setVariables(updated);
                      }}
                    />
                  </div>
                </div>
              </div>


            ))}

            {opcionesDisponibles.length > 0 && (
              <ActionButton
                variant="primary"
                onClick={handleAddVariable}
                className="mt-4"
              >
                <CirclePlus className="h-4 w-4" />
                <span>Add Variables</span>
              </ActionButton>
            )}


          </Card>
        </div>

      </div >
    </div >
  );
};
