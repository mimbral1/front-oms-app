"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    ChatBubbleLeftRightIcon,
    ClockIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ListCollapseIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "esquemas", label: "ESQUEMAS", icon: ListCollapseIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/picking/configuraciones/multipicking/sectores"
      contentClassName="pt-[150px] pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
