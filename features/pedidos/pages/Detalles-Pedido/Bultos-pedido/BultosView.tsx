"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBultosStore } from "@/features/pedidos/stores/detalle-pedidos";
import { useFetchBultos } from "@/features/pedidos/hooks/useFetchBultos";
import { DataTable } from "@/components/ui/table";
// import { bultosMock } from "@/data/mocks/detalle-pedido";
import { Column } from "@/components/ui/table";
import { Bulto } from "@/features/pedidos/types/detalle-pedido";
import { ArrowDownOnSquareIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { resolveStatus } from "@/components/ui/badge/status-registry";
import type { StatusVariant } from "@/components/ui/badge/status";

export function BultosView() {
  const params = useParams();
  const router = useRouter();
  const pedidoId = params?.id as string;
  console.log("PedidoID ", pedidoId);

  useFetchBultos(pedidoId);

  const { bultos, isLoading, error, setBultos, setLoading, setError } =
    useBultosStore();

  /* if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  } */

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">
        {error}
      </div>
    );
  }

  const columns: Column<Bulto>[] = [
    {
      accessorKey: "tipoPaquete",
      header: "Tipo de Paquete",
      cell: (bulto) => (
        <span className="text-sm text-gray-900 font-medium">
          {bulto.tipoPaquete}
        </span>
      ),
    },
    {
      accessorKey: "codigoBarras",
      header: "Código de Barras",
      cell: (bulto) => (
        <span className="text-sm text-gray-900">{bulto.codigoBarras}</span>
      ),
    },
    {
      accessorKey: "refId",
      header: "Ref ID",
      cell: (bulto) => (
        <span className="text-sm text-gray-900">{bulto.refId}</span>
      ),
    },
    {
      accessorKey: "inventario",
      header: "Inventario",
      cell: (bulto) => (
        <span className="text-sm text-blue-600 font-medium">
          {bulto.inventario}
        </span>
      ),
    },
    {
      accessorKey: "slot",
      header: "Slot",
      cell: (bulto) => (
        <span className="text-sm text-gray-900">{bulto.slot ?? "-"}</span>
      ),
    },
  ];
  const headerActions: Action[] = useMemo(
    () => [
      { label: "Aplicar", variant: "success", disabled: true, onClick: () => { }, icon: <CheckCircleIcon className="h-5 w-5" /> },
      { label: "Guardar", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Guardar & Crear nuevo", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Volver al listado", variant: "secondary", onClick: () => router.push("/pedidos"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router]                 // ↍ solo cambia si cambia el router
  );
  /* const headerComponent = (
    <PageHeader
      title={`Bultos del Pedido VTX #${pedidoId}`}
      //description="Detalles de los bultos asignados al pedido"
      action={headerActions}
      status={{
        text: "Listo para enviar",
        variant: "success",
      }}
    />
  ); */
  usePageHeader(() => ({
    title: `Bultos del Pedido VTX #${pedidoId}`,
    action: headerActions,
    status: { text: "Listo para enviar", variant: resolveStatus("Listo para enviar", "pedido").variant as StatusVariant },
  }), [pedidoId, headerActions]);

  return (
    <>
      {bultos.length === 0 ? (
        <p className="text-gray-500">No hay bultos para este pedido.</p>
      ) : (
        <div className="flex-1">
          <div className=" ">
            <DataTable<Bulto>
              columns={columns}
              data={bultos}
              showStatusBorder={false} // sin borde lateral
            />
          </div>
        </div>
      )}
    </>
  );
}
