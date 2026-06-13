// src/app/delivery/envios/[id]/layout.tsx
"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import {
  WarehouseHeaderProvider,
  useWarehouseHeader,
} from "@/app/context/warehouse/warehousecontext";

import { TabsNav } from "@/components/ui/tabnav/TabNav";
import PedidoActions from "@/features/pedidos/components/PedidoActions";
import CancelOrderAlert from "@/features/pedidos/components/CancelOrderAlert";
import { BoxIcon, TagIcon, TagsIcon } from "lucide-react";



// Define aquí las pestañas que necesites
/* ---------- Tabs ---------- */
const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "bultos", label: "BULTOS", icon: BoxIcon },
  { id: "etiquetas", label: "ETIQUETAS", icon: TagsIcon },
  { id: "tracking", label: "SEGUIMIENTO", icon: ClipboardDocumentCheckIcon },
  { id: "logs", label: "LOGS", icon: ChatBubbleLeftRightIcon },
];

type TabId = (typeof TABS)[number]["id"];

/* ---------- Layout interno que pinta header + pestañas ---------- */
function InnerLayout({ children }: { children: React.ReactNode }) {
  const { header } = useWarehouseHeader();      // ↍ lo que setea usePageHeader
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();

  /* pestaña activa */
  const currentTab: TabId =
    (TABS.find(t => pathname.endsWith(`/${t.id}`))?.id as TabId) || "resumen";

  /* navegación */
  const goTo = (tab: TabId) => {
    const base = `/delivery/envios/${id}`;
    router.push(tab === "resumen" ? base : `${base}/${tab}`);
  };

  /* modales */
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header fijo + Tabs */}
      <div className="fixed left-[70px] right-0 top-0 z-30 bg-white shadow-sm">
        {header /* <-- viene del contexto */}
        <TabsNav tabs={TABS} currentTab={currentTab} onSelectTab={goTo} />
      </div>

      {/* Contenido */}
      <main className="pt-[150px] px-6">{children}</main>

      {/* Modales */}
      <PedidoActions
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        onRequestCancel={() => { setIsActionsOpen(false); setIsCancelOpen(true); }}
        onPrint={() => console.log("Print")}
        onFulfillmentPlan={() => console.log("Fulfillment Plan")}
      />

      <CancelOrderAlert
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => setIsCancelOpen(false)}
      />
    </div>
  );
}

/* ---------- Wrapper con provider ---------- */
export default function DeliveryEnvioLayout({ children }: { children: React.ReactNode }) {
  return (
    <WarehouseHeaderProvider>
      <InnerLayout>{children}</InnerLayout>
    </WarehouseHeaderProvider>
  );
}
