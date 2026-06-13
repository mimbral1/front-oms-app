"use client";

import { FC } from "react";
import { ZodError } from "zod";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PrimaryButton } from "@/components/ui/button/primary";
import { useNuevoPedidoStore } from "@/features/pedidos/stores/nuevo-pedido";
import { Item, itemSchema, NuevoPedidoItem } from "@/features/pedidos/types/nuevo-pedido";

const ItemsPedido: FC = () => {
  const { items, addItem, removeItem, updateItem, errors } =
    useNuevoPedidoStore();

  const handleAddItem = () => {
    const newItem: NuevoPedidoItem = {
      id: crypto.randomUUID(),
      producto: "",
      cantidad: 1,
      precio: 0,
      subtotal: 0,
    };
    addItem(newItem);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof Item,
    value: string | number,
  ) => {
    const updatedItem = { ...items[index], [field]: value };
    updateItem(index.toString(), updatedItem);

    try {
      itemSchema.parse(updatedItem);
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        [`items.${index}`]: [],
      });
    } catch (error: unknown) {
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        [`items.${index}`]:
          error instanceof ZodError && error.issues[0]?.message
            ? [error.issues[0].message]
            : [],
      });
    }
  };

  return (
    <div className="mb-6 rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">
          Items del Pedido
        </h2>
        <PrimaryButton
          onClick={handleAddItem}
          icon={PlusIcon}
          className="transition-all"
        >
          Agregar Item
        </PrimaryButton>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item, index) => (
              <tr key={index} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={item.producto}
                    onChange={(e) =>
                      handleUpdateItem(index, "producto", e.target.value)
                    }
                    className="w-full rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nombre del producto"
                  />
                  {errors[`items.${index}`]?.map((error, i) => (
                    <p key={i} className="mt-1 text-sm text-red-500">
                      {error}
                    </p>
                  ))}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) =>
                      handleUpdateItem(
                        index,
                        "cantidad",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-24 rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
                    min="1"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={item.precio}
                    onChange={(e) =>
                      handleUpdateItem(
                        index,
                        "precio",
                        parseFloat(e.target.value),
                      )
                    }
                    className="w-32 rounded-lg border-gray-300 shadow-sm transition-all focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ${(item.cantidad * item.precio).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => removeItem(index.toString())}
                    className="text-red-600 transition-colors hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsPedido;
