"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Clock } from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "comments", label: "COMMENTS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS SECTION", icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/delivery/flota/conductores"
      contentClassName="pt-48 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
