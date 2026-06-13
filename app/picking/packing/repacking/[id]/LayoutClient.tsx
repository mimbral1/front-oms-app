"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    BuildingStorefrontIcon,
    QueueListIcon,
} from "@heroicons/react/24/outline";
import { Clock, ListCheckIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "items", label: "ITEMS", icon: QueueListIcon },
    { id: "auditoria", label: "AUDITORIA", icon: ListCheckIcon },
    { id: "direcciones", label: "DIRECCIONES", icon: BuildingStorefrontIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/picking/packing/repacking"
      contentClassName="pt-40 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
