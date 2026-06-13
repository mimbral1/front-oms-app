"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  CubeIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  {
    id: "almacenamiento",
    label: "ALMACENAMIENTO",
    icon: CubeIcon,
  },
  { id: "skus", label: "SKUS", icon: TagIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/almacen/configuracion/slots"
    >
      {children}
    </TabbedLayout>
  );
}
