"use client";

import React from "react";

import { useParams } from "next/navigation";
import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ itemCode?: string; priceList?: string }>();
  const itemCode = params?.itemCode ?? "";
  const priceList = params?.priceList ?? "";
  const basePath = (itemCode && priceList)
    ? `/catalogo/precios/precio-base/${encodeURIComponent(itemCode)}/${encodeURIComponent(priceList)}`
    : "/catalogo/precios/precio-base";

  return (
    <TabbedLayout
      tabs={TABS}
      basePath={basePath}
    >
      {children}
    </TabbedLayout>
  );
}
