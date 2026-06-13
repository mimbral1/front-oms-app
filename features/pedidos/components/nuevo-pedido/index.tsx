// views\PedidosView\Nuevo-Pedido\index.tsx
"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/button/primary";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Cliente from "./cliente";
import ItemsPedido from "./items";
import MetodoEntrega from "./metodoEntrega";
import Pago from "./pago";

const NuevoPedido: FC = () => {
  const router = useRouter();

  const handleCancel = () => {
    router.push("/pedidos");
  };

  return (
    <div className="pb-5 bg-page-bg">
      {/* TopBar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-20 bg-white border-b border-gray-200 pl-20">
        <div className="h-full flex justify-between items-center px-6">
          <h1 className="text-2xl font-bold text-gray-900">Nuevo pedido</h1>
          <PrimaryButton
            variant="outline"
            icon={XMarkIcon}
            className="font-bold"
            onClick={handleCancel}
          >
            Cancelar
          </PrimaryButton>
        </div>
      </div>

      {/* Contenido del formulario */}
      <div className="pt-24 px-5 pl-20">
        <Cliente />
        <ItemsPedido />
        <MetodoEntrega />
        <Pago />
      </div>
    </div>
  );
};

export default NuevoPedido;
