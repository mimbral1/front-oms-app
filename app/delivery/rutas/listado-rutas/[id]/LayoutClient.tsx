"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import {
  Boxes,
  Clock,
  DollarSignIcon,
  PackageCheckIcon,
  PackageIcon,
} from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "entregas", label: "ENTREGAS", icon: PackageIcon },
  { id: "carga", label: "CARGA", icon: Boxes },
  { id: "seguimiento", label: "SEGUIMIENTO", icon: PackageCheckIcon },
  { id: "comments", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/rutas/listado-rutas"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
