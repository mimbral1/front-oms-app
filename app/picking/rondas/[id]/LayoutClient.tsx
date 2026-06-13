"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  PlayIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "items", label: "ITEMS", icon: ClipboardDocumentListIcon },
  { id: "pedidos", label: "PEDIDOS", icon: ShoppingCartIcon },
  { id: "simular", label: "SIMULAR SESIÓN", icon: PlayIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/picking/rondas"
    >
      {children}
    </TabbedLayout>
  );
}
