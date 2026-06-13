"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/picking/packing/trackeo-de-paquetes/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
