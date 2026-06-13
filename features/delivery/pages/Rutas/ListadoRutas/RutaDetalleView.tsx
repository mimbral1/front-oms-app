// views\Delivery\Rutas\RutaDetalleView.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowDownOnSquareIcon, CheckCircleIcon, DocumentTextIcon, HomeIcon, MapIcon, TruckIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ClockIcon } from "@heroicons/react/24/outline";

interface RutaContentProps {
  activeTab: string;
}
export const getRutaDetalleTabs = () => [
  {
    id: "principal",
    label: "PRINCIPAL",
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    id: "entregas",
    label: "ENTREGAS",
    icon: <TruckIcon className="h-5 w-5" />,
  },
  {
    id: "tracking",
    label: "TRACKING",
    icon: <MapIcon className="h-5 w-5" />,
  },
  {
    id: "logs",
    label: "LOGS",
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
];

export function RutaContent({ activeTab }: RutaContentProps) {
  if (activeTab === "principal") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Detalle</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Conductor</p>
              <p className="text-gray-900">Fabian Claros</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Repartidor</p>
              <p className="text-gray-900">Darian</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Vehículo</p>
              <p className="text-gray-900">Carro 431 JM</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Programación
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Inicio</p>
                <p className="text-gray-900">30/06/2024 08:00:00</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Finalización
                </p>
                <p className="text-gray-900">30/06/2024 15:00:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "entregas") {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Lista de Entregas
        </h2>
        {/* Contenido de entregas */}
      </div>
    );
  }

  if (activeTab === "tracking") {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Tracking de Ruta
        </h2>
        {/* Contenido de tracking */}
      </div>
    );
  }

  if (activeTab === "logs") {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Historial de Logs
        </h2>
        {/* Contenido de logs */}
      </div>
    );
  }

  return null;
}

export const getRutaDetalleActions = () => [
  {
    label: "Aplicar",
    variant: "success" as const,
    onClick: () => { },
      icon: <CheckCircleIcon className="h-5 w-5" />
  },
  {
    label: "Guardar",
    variant: "success" as const,
    onClick: () => { },
      icon: <ArrowDownOnSquareIcon className="h-5 w-5" />
  },
  {
    label: "Guardar & Crear nuevo",
    variant: "success" as const,
    onClick: () => { },
      icon: <ArrowDownOnSquareIcon className="h-5 w-5" />
  },
  {
    label: "Volver al listado",
    variant: "secondary" as const,
    onClick: () => window.history.back(),
      icon: <XCircleIcon className="h-5 w-5" />
  },
];

export default function RutaDetalleView({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState("principal");

  const headerActions = getRutaDetalleActions();
  const headerTabs = getRutaDetalleTabs();

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        title={id}
        status={{
          text: "Programada",
          variant: "info",
        }}
        action={headerActions}
        tabs={headerTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 p-6">
        <RutaContent activeTab={activeTab} />
      </div>
    </div>
  );
}
