"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { ChatBubbleLeftRightIcon, DocumentTextIcon, BuildingStorefrontIcon, ListBulletIcon, NumberedListIcon, } from "@heroicons/react/24/outline";
import { Clock, PaperclipIcon, ShoppingCartIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/customers/logistica/solicitudes/nuevo"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
