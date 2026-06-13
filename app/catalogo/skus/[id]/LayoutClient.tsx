"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    CpuChipIcon,
    CameraIcon,
} from "@heroicons/react/24/outline";
import { CircleDollarSignIcon, FileTextIcon, ListCheckIcon, ListIcon, PaperclipIcon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "imagen", label: "IMAGEN", icon: CameraIcon },
    { id: "precio", label: "PRECIO", icon: CircleDollarSignIcon },
    { id: "stock", label: "STOCK", icon: ListCheckIcon },
    { id: "plataformas", label: "PLATAFORMAS", icon: ListIcon },
    { id: "atributos", label: "ATRIBUTOS", icon: FileTextIcon },
    { id: "relacionado", label: "RELACIONADO", icon: PaperclipIcon },
    { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
    { id: "logs", label: "LOGS", icon: CpuChipIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/catalogo/skus"
      contentClassName="pt-[150px]"
    >
      {children}
    </TabbedLayout>
  );
}
