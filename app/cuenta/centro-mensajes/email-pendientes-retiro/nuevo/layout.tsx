"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { ClockIcon } from "lucide-react";

const TABS = [
    { id: "envio", label: "ENVÍO SIMPLE", icon: DocumentTextIcon },
    { id: "config", label: "CONFIG PICKUP", icon: ChatBubbleLeftRightIcon },
    { id: "app", label: "APP", icon: ClockIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/cuenta/centro-mensajes/email-pendientes-retiro/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
