"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { ChatBubbleLeftRightIcon, DocumentTextIcon, BuildingStorefrontIcon, } from "@heroicons/react/24/outline";
import { Clock, DollarSignIcon, PackageCheckIcon, PackageIcon } from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/rutas/listado-rutas/nuevo"
      hideTabsWithoutId
      contentClassName="h-screen overflow-hidden pt-[126px] px-0"
    >
      {children}
    </TabbedLayout>
  );
}
