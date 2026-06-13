"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ClockIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/pedidos/configuraciones/perfiles-importacion"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
