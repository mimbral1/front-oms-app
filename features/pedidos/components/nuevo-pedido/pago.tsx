"use client";

import { FC } from "react";
import { ZodError } from "zod";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/button/primary";
import { useNuevoPedidoStore } from "@/features/pedidos/stores/nuevo-pedido";
import {
  metodoPagoSchema,
  pedidoSchema,
  MetodoPagoItem,
} from "@/features/pedidos/types/nuevo-pedido";
import {
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

const Pago: FC = () => {
  const { metodoPago, setMetodoPago, items, errors, setIsSubmitting } =
    useNuevoPedidoStore();

  const router = useRouter();

  const handleAddMetodo = (tipo: "efectivo" | "tarjeta" | "transferencia") => {
    const metodos = metodoPago.metodos || [];
    setMetodoPago({
      metodos: [...metodos, { tipo, monto: 0 }],
    });

    try {
      metodoPagoSchema.parse({ metodos: [...metodos, { tipo, monto: 0 }] });
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        metodoPago: [],
      });
    } catch (error: unknown) {
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        metodoPago:
          error instanceof ZodError && error.issues[0]?.message
            ? [error.issues[0].message]
            : [],
      });
    }
  };

  const handleUpdateMonto = (index: number, monto: number) => {
    const metodos = [...(metodoPago.metodos || [])];
    metodos[index] = { ...metodos[index], monto };
    setMetodoPago({ metodos });

    try {
      metodoPagoSchema.parse({ metodos });
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        metodoPago: [],
      });
    } catch (error: unknown) {
      useNuevoPedidoStore.getState().setErrors({
        ...useNuevoPedidoStore.getState().errors,
        metodoPago:
          error instanceof ZodError && error.issues[0]?.message
            ? [error.issues[0].message]
            : [],
      });
    }
  };

  const handleRemoveMetodo = (index: number) => {
    const metodos = metodoPago.metodos?.filter((_, i) => i !== index) || [];
    setMetodoPago({ metodos });
  };

  const calcularSubtotal = () => {
    return items.reduce(
      (total, item) => total + item.cantidad * item.precio,
      0,
    );
  };

  const calcularCostoEnvio = () => {
    return 5.0;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularCostoEnvio();
  };

  const calcularTotalPagos = () => {
    return (
      metodoPago.metodos?.reduce(
        (total: number, metodo: MetodoPagoItem) => total + metodo.monto,
        0,
      ) || 0
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const pedidoData = {
        cliente: useNuevoPedidoStore.getState().cliente,
        items: useNuevoPedidoStore.getState().items,
        metodoEntrega: useNuevoPedidoStore.getState().metodoEntrega,
        metodoPago: useNuevoPedidoStore.getState().metodoPago,
      };

      pedidoSchema.parse(pedidoData);

      const total = calcularTotal();
      const totalPagos = calcularTotalPagos();
      if (Math.abs(total - totalPagos) > 0.01) {
        throw new Error(
          "La suma de los pagos debe ser igual al total del pedido",
        );
      }

      console.log("Pedido valido:", pedidoData);
      useNuevoPedidoStore.getState().reset();
      router.push("/pedidos");
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        });
        useNuevoPedidoStore.getState().setErrors(formattedErrors);
      } else {
        useNuevoPedidoStore.getState().setErrors({
          ...useNuevoPedidoStore.getState().errors,
          metodoPago: [getErrorMessage(error, "Error al validar metodo de pago")],
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIconForTipo = (tipo: MetodoPagoItem["tipo"]) => {
    switch (tipo) {
      case "efectivo":
        return BanknotesIcon;
      case "tarjeta":
        return CreditCardIcon;
      case "transferencia":
        return BuildingLibraryIcon;
    }
  };

  const getTextForTipo = (tipo: MetodoPagoItem["tipo"]) => {
    switch (tipo) {
      case "efectivo":
        return "Efectivo";
      case "tarjeta":
        return "Tarjeta";
      case "transferencia":
        return "Transferencia";
    }
  };

  return (
    <div className="mb-6 rounded-xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">
        Informacion de Pago
      </h2>

      <div className="mb-8 space-y-4">
        {metodoPago.metodos?.map((metodo: MetodoPagoItem, index: number) => {
          const Icon = getIconForTipo(metodo.tipo);
          return (
            <div
              key={index}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <Icon className="h-6 w-6 flex-shrink-0 text-blue-600" />
              <div className="flex-grow">
                <span className="font-medium text-gray-900">
                  {getTextForTipo(metodo.tipo)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={metodo.monto || ""}
                    onChange={(e) =>
                      handleUpdateMonto(index, parseFloat(e.target.value))
                    }
                    className="w-32 rounded-lg border-gray-300 pl-8 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <button
                  onClick={() => handleRemoveMetodo(index)}
                  className="p-2 text-gray-400 transition-colors hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            onClick={() => handleAddMetodo("efectivo")}
            className="flex items-center justify-center gap-2 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Agregar Efectivo</span>
          </button>
          <button
            onClick={() => handleAddMetodo("tarjeta")}
            className="flex items-center justify-center gap-2 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Agregar Tarjeta</span>
          </button>
          <button
            onClick={() => handleAddMetodo("transferencia")}
            className="flex items-center justify-center gap-2 rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Agregar Transferencia</span>
          </button>
        </div>
      </div>

      {errors.metodoPago?.map((error: string, index: number) => (
        <p key={index} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ))}

      <div className="border-t pt-6">
        <div className="space-y-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">
              ${calcularSubtotal().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Costo de envio</span>
            <span className="font-medium">
              ${calcularCostoEnvio().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>${calcularTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total pagos</span>
            <span
              className={`font-medium ${
                Math.abs(calcularTotal() - calcularTotalPagos()) > 0.01
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              ${calcularTotalPagos().toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <PrimaryButton
            onClick={handleSubmit}
            className="w-full py-3 text-lg font-medium transition-all"
            disabled={useNuevoPedidoStore.getState().isSubmitting}
          >
            {useNuevoPedidoStore.getState().isSubmitting
              ? "Procesando..."
              : "Crear Pedido"}
          </PrimaryButton>
        </div>

        {Object.entries(errors).map(([key, messages]) =>
          messages.map((error: string, index: number) => (
            <p key={`${key}-${index}`} className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )),
        )}
      </div>
    </div>
  );
};

export default Pago;
