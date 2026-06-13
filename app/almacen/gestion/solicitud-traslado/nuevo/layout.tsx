"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/almacen/gestion/solicitud-traslado/nuevo"
      hideTabsWithoutId
      contentClassName="pt-[150px] pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
