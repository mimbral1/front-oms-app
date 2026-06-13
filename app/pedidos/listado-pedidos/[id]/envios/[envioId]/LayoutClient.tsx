// src/app/pedidos/[id]/layout.tsx
"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  DocumentTextIcon,
  CubeIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

import { TabsNav } from "@/components/ui/tabnav/TabNav";
import PedidoActions from "@/features/pedidos/components/PedidoActions";
import CancelOrderAlert from "@/features/pedidos/components/CancelOrderAlert";
import {
  useWarehouseHeader,
  WarehouseHeaderProvider,
} from "@/app/context/warehouse/warehousecontext";

interface LayoutProps {
  children: React.ReactNode;
  headerComponent?: React.ReactNode;
}

// define aquí tus pestañas
const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "bultos", label: "BULTOS", icon: CubeIcon },
  { id: "etiquetas", label: "ETIQUETAS", icon: DocumentDuplicateIcon },
  { id: "tracking", label: "TRACKING", icon: ClockIcon },
  { id: "logs", label: "LOGS", icon: ChatBubbleLeftRightIcon },
];

type TabId = (typeof TABS)[number]["id"];

function Inner({ children }: { children: React.ReactNode }) {
  const { header } = useWarehouseHeader(); // ① encabezado desde contexto
  const router = useRouter();
  const pathname = usePathname();
  const { id, envioId } = useParams<{ id: string; envioId: string }>();

  /* pestaña activa */
  const current: TabId =
    (TABS.find((t) => pathname.endsWith(`/${t.id}`))?.id as TabId) || "resumen";

  /* navegación entre tabs */
  const goTo = (tab: TabId) => {
    const base = `/pedidos/listado-pedidos/${id}/envios/${envioId}`;
    router.push(tab === "resumen" ? base : `${base}/${tab}`);
  };

  // Estado de modales de acciones
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);

  const onRequestCancel = () => {
    setIsActionsOpen(false);
    setIsCancelAlertOpen(true);
  };
  const onConfirmCancel = () => {
    // lógica de cancelación
    setIsCancelAlertOpen(false);
  };

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header fijo + pestañas */}
      <div className="fixed left-[70px] right-0 top-0 z-30 bg-white shadow-sm">
        {header}
        <TabsNav tabs={TABS} currentTab={current} onSelectTab={goTo} />
      </div>

      {/* Contenido debajo del header (ajusta pt según la altura real) */}
      <main className="pt-[20px] px-6 pb-[20px]">{children}</main>

      {/* Modales de acciones y cancelación */}
      <PedidoActions
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onRequestCancel={onRequestCancel}
        onPrint={() => console.log("Print")}
        onFulfillmentPlan={() => console.log("Fulfillment Plan")}
      />

      <CancelOrderAlert
        isOpen={isCancelAlertOpen}
        onClose={() => setIsCancelAlertOpen(false)}
        onConfirm={onConfirmCancel}
      />
    </div>
  );
}

export default function PedidoEnvioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WarehouseHeaderProvider>
      <Inner>{children}</Inner>
    </WarehouseHeaderProvider>
  );
}
