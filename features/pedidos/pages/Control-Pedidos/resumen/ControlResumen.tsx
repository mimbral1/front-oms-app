"use client";

import { useParams } from "next/navigation";
import { auditoriaMock } from "@/data/mocks/auditorias";
import {
  ClipboardDocumentListIcon,
  UserIcon,
  IdentificationIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { useMemo } from "react";

export function ResumenControl() {
  const { id } = useParams();

  const auditoria = auditoriaMock.find((audit) => audit.id === id);
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
    [auditoria]
  );
  const estadoVariantMap: Record<
    string,
    "success" | "warning" | "error" | "info"
  > = {
    Finalizada: "success",
    "En curso": "warning",
    Corregir: "warning",
    Pendiente: "info",
    Error: "error",
  };
  const estadoColorMap: Record<string, string> = {
    Finalizada: "bg-green-500 text-white",
    "En curso": "bg-yellow-500 text-white",
    Corregir: "bg-orange-500 text-white",
    Pendiente: "bg-blue-500 text-white",
    Error: "bg-red-500 text-white",
  };

  // (4) Componente para el header

  usePageHeader(
    () => ({
      title: `CONTROL ${auditoria?.id}`,
      action: headerActions,
      status: {
        text: auditoria?.estado || "Empty",
        variant: auditoria?.estado === "Active" ? "success" : "warning",
      },
    }),
    [auditoria?.id, auditoria?.estado, headerActions]
  );
  if (id !== auditoria?.id) {
    return (
      <p className="p-4 text-center text-red-500">Almacén no encontrado</p>
    );
  }

  if (!auditoria) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <p>No se encontró la auditoría con ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Resumen de Auditoría
        </h1>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${estadoColorMap[auditoria.estado] || "bg-gray-400 text-white"
            }`}
        >
          {auditoria.estado}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IdentificationIcon className="w-6 h-6 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500">ID Auditoría</p>
            <p className="text-gray-900 font-semibold">{auditoria.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ClipboardDocumentListIcon className="w-6 h-6 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500">Entidad</p>
            <p className="text-gray-900 font-semibold">{auditoria.entidad}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BuildingStorefrontIcon className="w-6 h-6 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500">Inventario</p>
            <p className="text-gray-900 font-semibold">
              {auditoria.inventario}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserIcon className="w-6 h-6 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500">Controlador</p>
            <p className="text-gray-900 font-semibold">
              {auditoria.controlador.name}
            </p>
            <p className="text-gray-500 text-sm">
              {auditoria.controlador.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
