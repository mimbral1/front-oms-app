"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "MAIN FORM SECTION", icon: DocumentTextIcon },
  { id: "price-change", label: "PRICE CHANGE", icon: CurrencyDollarIcon },
  { id: "auditorias", label: "AUDITS", icon: ShieldCheckIcon },
  { id: "comentarios", label: "COMMENTS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/catalogo/precios/precio"
    >
      {children}
    </TabbedLayout>
  );
}
