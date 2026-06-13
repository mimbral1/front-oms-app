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
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/cuenta/acciones-masivas/importaciones"
    >
      {children}
    </TabbedLayout>
  );
}
