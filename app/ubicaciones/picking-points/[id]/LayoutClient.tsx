"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "sectores-picking", label: "SECTORES DE PICKING", icon: DocumentTextIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/ubicaciones/picking-points"
    >
      {children}
    </TabbedLayout>
  );
}
