"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { ClockIcon, TableCellsIcon } from "@heroicons/react/24/outline";

const TABS = [
    { id: "principal", label: "PRINCIPAL", icon: TableCellsIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/configuraciones/metodos-entrega"
      defaultTab="principal"
    >
      {children}
    </TabbedLayout>
  );
}
