"use client";

import React from "react";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { FileTextIcon } from "lucide-react";

const BarcodeSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="4" width="2" height="16" fill="black" />
    <rect x="6" y="4" width="1" height="16" fill="black" />
    <rect x="9" y="4" width="2" height="16" fill="black" />
    <rect x="13" y="4" width="1" height="16" fill="black" />
    <rect x="16" y="4" width="2" height="16" fill="black" />
    <rect x="20" y="4" width="1" height="16" fill="black" />
  </svg>
);

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "contenido", label: "CONTENIDO", icon: BarcodeSVG },
  { id: "resultado", label: "RESULTADO", icon: WrenchScrewdriverIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: CpuChipIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/pedidos/control"
      contentClassName="pt-20 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
