"use client";

import { FC } from "react";
import { ZodError } from "zod";
import { useNuevoPedidoStore } from "@/features/pedidos/stores/nuevo-pedido";
import { clienteSchema, NuevoPedidoCliente } from "@/features/pedidos/types/nuevo-pedido";

const Cliente: FC = () => {
  const { pedido, setCliente, errors, setErrors } = useNuevoPedidoStore();

  if (!pedido) return null;

  const handleChange = (field: keyof NuevoPedidoCliente, value: string) => {
    const newCliente = { ...pedido.cliente, [field]: value };
    setCliente(newCliente);

    try {
      clienteSchema.parse(newCliente);
      setErrors({
        ...errors,
        [`cliente.${String(field)}`]: [],
      });
    } catch (error: unknown) {
      setErrors({
        ...errors,
        [`cliente.${String(field)}`]:
          error instanceof ZodError && error.issues[0]?.message
            ? [error.issues[0].message]
            : [],
      });
    }
  };

  return (
    <div className="mb-6 rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">
        Informacion del Cliente
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Nombre del cliente
          </label>
          <input
            type="text"
            value={pedido.cliente.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
            placeholder="Ingrese el nombre del cliente"
          />
          {(errors["cliente.nombre"] || []).map((error, index) => (
            <p key={index} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Telefono</label>
          <input
            type="tel"
            value={pedido.cliente.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
            placeholder="Ingrese el telefono"
          />
          {(errors["cliente.telefono"] || []).map((error, index) => (
            <p key={index} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cliente;
