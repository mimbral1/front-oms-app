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
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/catalogo/skus/nuevo"
    >
      {children}
    </TabbedLayout>
  );
}
