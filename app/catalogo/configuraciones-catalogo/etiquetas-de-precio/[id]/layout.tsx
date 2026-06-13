"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { Clock5Icon, MessageSquareTextIcon } from "lucide-react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "comments", label: "COMENTARIOS", icon: MessageSquareTextIcon },
    { id: "logs", label: "LOGS", icon: Clock5Icon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/catalogo/configuraciones-catalogo/etiquetas-de-precio"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
