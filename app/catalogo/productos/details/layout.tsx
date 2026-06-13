"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "main", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "skus", label: "SKUS", icon: DocumentTextIcon },
  { id: "attributes", label: "ATRIBUTOS", icon: PencilSquareIcon },
  { id: "comments", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/catalogo/productos/details"
      defaultTab="main"
    >
      {children}
    </TabbedLayout>
  );
}
