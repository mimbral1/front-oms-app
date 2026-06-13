"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { Clock5Icon, MessageSquareTextIcon, SheetIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: SheetIcon },
    { id: "comments", label: "COMENTARIOS", icon: MessageSquareTextIcon },
    { id: "logs", label: "LOGS", icon: Clock5Icon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/cuenta/centro-mensajes/templates-page/nuevo"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
