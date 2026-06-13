"use client";

import { FC } from "react";
import { ZodError } from "zod";
import { BuildingStorefrontIcon, TruckIcon } from "@heroicons/react/24/outline";
import { useNuevoPedidoStore } from "@/features/pedidos/stores/nuevo-pedido";
import { metodoEntregaSchema } from "@/features/pedidos/types/nuevo-pedido";
import type { MetodoEntrega } from "@/features/pedidos/types/nuevo-pedido";

const MetodoEntregaComponent: FC = () => {
  const { metodoEntrega, setMetodoEntrega, errors } = useNuevoPedidoStore();

  const handleChange = (
    field: keyof MetodoEntrega,
    value: string | number | { inicio?: string; fin?: string },
  ) => {
    const updatedMetodo: MetodoEntrega =
      field === "fechaEntrega"
        ? {
            ...metodoEntrega,
            fechaEntrega: {
              ...metodoEntrega.fechaEntrega,
              ...(value as { inicio?: string; fin?: string }),
            },
          }
        : ({
            ...metodoEntrega,
            [field]: value,
          } as MetodoEntrega);

    setMetodoEntrega(updatedMetodo);

    try {
      metodoEntregaSchema.parse(updatedMetodo);
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        metodoEntrega: [],
      });
    } catch (error: unknown) {
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        metodoEntrega:
          error instanceof ZodError && error.issues[0]?.message
            ? [error.issues[0].message]
            : [],
      });
    }
  };

  return (
    <div className="mb-6 rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">
        Metodo de Entrega
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          className={`flex cursor-pointer items-center rounded-xl border p-6 transition-all border-gray-400 hover:border-gray-500 ${
            metodoEntrega.tipo === "delivery" ? "border-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => handleChange("tipo", "delivery")}
        >
          <input
            type="radio"
            name="metodoEntrega"
            id="delivery"
            checked={metodoEntrega.tipo === "delivery"}
            onChange={() => handleChange("tipo", "delivery")}
            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="delivery"
            className="ml-4 flex cursor-pointer items-center"
          >
            <TruckIcon className="mr-3 h-6 w-6 text-blue-600" />
            <div>
              <span className="block font-medium text-gray-900">Delivery</span>
              <span className="text-sm text-gray-500">Entrega a domicilio</span>
            </div>
          </label>
        </div>

        <div
          className={`flex cursor-pointer items-center rounded-xl border p-6 transition-all ${
            metodoEntrega.tipo === "pickup"
              ? "border-blue-500 bg-blue-50"
              : "hover:border-gray-400"
          }`}
          onClick={() => handleChange("tipo", "pickup")}
        >
          <input
            type="radio"
            name="metodoEntrega"
            id="pickup"
            checked={metodoEntrega.tipo === "pickup"}
            onChange={() => handleChange("tipo", "pickup")}
            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="pickup"
            className="ml-4 flex cursor-pointer items-center"
          >
            <BuildingStorefrontIcon className="mr-3 h-6 w-6 text-blue-600" />
            <div>
              <span className="block font-medium text-gray-900">
                Recoger en tienda
              </span>
              <span className="text-sm text-gray-500">
                El cliente recogera en el local
              </span>
            </div>
          </label>
        </div>
      </div>

      {errors.metodoEntrega?.map((error, index) => (
        <p key={index} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ))}

      {metodoEntrega.tipo === "delivery" && (
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Direccion de entrega
            </label>
            <textarea
              value={metodoEntrega.direccion || ""}
              onChange={(e) => handleChange("direccion", e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Ingrese la direccion de entrega"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Transportista
            </label>
            <select
              value={metodoEntrega.transportista || ""}
              onChange={(e) => handleChange("transportista", e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleccione un transportista</option>
              <option value="envio_programado">Envio programado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Costo de envio
            </label>
            <input
              type="number"
              value={metodoEntrega.shippingCost || ""}
              onChange={(e) =>
                handleChange("shippingCost", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fecha inicio
              </label>
              <input
                type="datetime-local"
                value={metodoEntrega.fechaEntrega?.inicio || ""}
                onChange={(e) =>
                  handleChange("fechaEntrega", { inicio: e.target.value })
                }
                className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fecha fin
              </label>
              <input
                type="datetime-local"
                value={metodoEntrega.fechaEntrega?.fin || ""}
                onChange={(e) =>
                  handleChange("fechaEntrega", { fin: e.target.value })
                }
                className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetodoEntregaComponent;
