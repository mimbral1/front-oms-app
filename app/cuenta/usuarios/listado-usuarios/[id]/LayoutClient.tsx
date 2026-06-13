"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  KeyIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { Clock } from "lucide-react";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "api-key", label: "API KEY", icon: KeyIcon },
  { id: "apps", label: "APPS", icon: ComputerDesktopIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/cuenta/usuarios/listado-usuarios"
      contentClassName="pt-40 pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
