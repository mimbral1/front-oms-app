"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import { DollarSignIcon, MapPinHouseIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "direcciones", label: "DIRECCIONES", icon: MapPinHouseIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/ubicaciones/pickup-points"
    >
      {children}
    </TabbedLayout>
  );
}
