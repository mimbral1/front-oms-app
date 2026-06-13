"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { ClockIcon, TableCellsIcon } from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "MAIN FORM SECTION", icon: TableCellsIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/flota/vehiculos/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
