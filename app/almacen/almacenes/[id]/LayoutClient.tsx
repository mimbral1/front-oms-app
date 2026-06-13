"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import {
  DocumentTextIcon,
  MapPinIcon,
  CircleStackIcon,
  ArrowsRightLeftIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PencilSquareIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const TABS = [
  { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
  { id: "planograma", label: "PLANOGRAMA", icon: Squares2X2Icon },
  { id: "staging", label: "STAGING", icon: MapPinIcon },
  { id: "slots-despacho", label: "SLOTS DE DESPACHO", icon: PencilSquareIcon },
  { id: "slots", label: "SLOTS", icon: CircleStackIcon },
  { id: "movimientos", label: "MOVIMIENTOS", icon: ArrowsRightLeftIcon },
  {
    id: "almacenamiento",
    label: "ALMACENAMIENTO",
    icon: BuildingStorefrontIcon,
  },
  { id: "comentarios", label: "COMENTARIOS", icon: ChatBubbleLeftRightIcon },
  { id: "logs", label: "LOGS", icon: ClockIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/almacen/almacenes"
    >
      {children}
    </TabbedLayout>
  );
}
