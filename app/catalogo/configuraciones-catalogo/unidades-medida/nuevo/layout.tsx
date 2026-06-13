"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    CurrencyDollarIcon,
    ListBulletIcon,
    LinkIcon,
    ClockIcon,
    CameraIcon,
    ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "imagen", label: "IMAGEN", icon: CameraIcon },
    { id: "precios", label: "PRECIOS", icon: CurrencyDollarIcon },
    { id: "stock", label: "STOCK", icon: DocumentTextIcon },
    { id: "plataformas", label: "PLATAFORMAS", icon: ListBulletIcon },
    { id: "atributos", label: "ATRIBUTOS", icon: DocumentTextIcon },
    { id: "relacionado", label: "RELACIONADO", icon: LinkIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleBottomCenterTextIcon },
    { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/catalogo/configuraciones-catalogo/unidades-medida/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
