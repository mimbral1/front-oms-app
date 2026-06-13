"use client";

import React, { useMemo } from "react";
import { Action } from "@/components/layout/page-header";
import { DataTable, Column } from "@/components/ui/table";
import {
  CheckCircleIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useParams } from "next/navigation";
import { useFetchItemsAuditoria } from "@/features/auditorias/hooks/useFetchDetalleAuditoria"; // Hook que gestiona el fetch de los items 
import { useAuditoriaItemsStore } from "@/features/auditorias/stores/detalle-auditorias";
import { auditoriaMock } from "@/data/mocks/auditorias";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";

export interface BultosItem {
  id: string;
  type: string;
  reference: {
    name: string;
    sku: string;
  };
  barcode: string;
  items: string;
  results: {
    encontrado: string;
    faltante: string;
    sobrante: string;
  };
  fixed: string;
  estado: string;
}

const controlResultStyles: Record<string, string> = {
  found: "bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold",
  missing: "bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold",
  error:
    "bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold",
};

export default function ControlView() {
  const params = useParams();
  const bultoId = params?.id as string;
  console.log("bultoId: ", bultoId);
  const { isLoading, error } = useFetchItemsAuditoria(bultoId); // Traemos los items transformados desde la API
  const { items } = useAuditoriaItemsStore();
  const auditoria = auditoriaMock.find((audit) => audit.id === bultoId);

  const columns: Column<BultosItem>[] = [
    {
      accessorKey: "type",
      header: "Tipo",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.type === "item" ? (
            <CheckCircleIcon className="w-5 h-5 text-blue-500" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-800">{row.type}</span>
        </div>
      ),
    },
    {
      accessorKey: "reference",
      header: "Referencia",
      cell: (row) => (
        <span className="text-sm text-gray-900 whitespace-pre-wrap">
          {row.reference.name}
        </span>
      ),
    },
    {
      accessorKey: "barcode",
      header: "Código de barras",
      cell: (row) => (
        <span className="text-sm text-gray-700 font-mono">{row.barcode}</span>
      ),
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: (row) => (
        <span className="text-sm font-semibold text-gray-700">{row.items}</span>
      ),
    },
    {
      accessorKey: "results",
      header: "Resultados",
      cell: (row) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 font-bold">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span>{row.results.encontrado}</span>
          </div>
          <div className="flex items-center gap-2 text-red-600 font-bold">
            <MinusCircleIcon className="w-5 h-5 text-red-500" />
            <span>{row.results.faltante}</span>
          </div>
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <PlusCircleIcon className="w-5 h-5 text-orange-500" />
            <span>{row.results.sobrante}</span>
          </div>
        </div>
      ),
    },

    {
      accessorKey: "fixed",
      header: "Fixed",
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.fixed === "true" ? "Yes" : "No"}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.estado}</span>
      ),
    },
  ];

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "secondary" as const,
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: false,
      },
      {
        label: "Volver al listado",
        variant: "secondary" as const,
        onClick: () => window.history.back(),
        icon: <ArrowLeftIcon className="h-5 w-5" />,
      },
    ],
    [items]
  );

  usePageHeader(
    () => ({
      title: `CONTENIDO AUDITORIA ${auditoria?.id}`,
      action: headerActions,
      status: {
        text: auditoria?.estado || "",
        variant: auditoria?.estado === "Active" ? "success" : "warning",
      },
    }),
    [auditoria?.id, auditoria?.estado, headerActions]
  );
  if (!items) {
    return <p className="p-4 text-center text-red-500">Items no encontrados</p>;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bg-transparent">
      <DataTable<BultosItem>
        data={items} // Pasar los items que ya han sido transformados
        columns={columns}
        showStatusBorder={false}
        rowBgClass="bg-white"
      />
    </div>
  );
}
