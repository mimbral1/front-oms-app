"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { DocumentTextIcon, ClockIcon } from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "MAIN", icon: DocumentTextIcon },
  { id: "logs", label: "LOGS SECTION", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/pedidos/auditorias/tipos/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
