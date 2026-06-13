"use client";

import React from "react";

import { TabbedLayout } from "@/components/ui/tabbed-layout/TabbedLayout";
import { AdjustmentsHorizontalIcon, Cog6ToothIcon, DocumentTextIcon, ExclamationTriangleIcon, } from "@heroicons/react/24/outline";
import { NotebookPenIcon, Package2Icon } from "lucide-react";

const TABS = [
    { id: "resumen", label: "RESUMEN", icon: DocumentTextIcon },
    { id: "agenda", label: "AGENDA", icon: NotebookPenIcon },
    { id: "olas", label: "OLAS", icon: Cog6ToothIcon },
    { id: "rondas", label: "RONDAS", icon: AdjustmentsHorizontalIcon },
    { id: "preparables", label: "PREPARABLES", icon: Package2Icon },
    { id: "prioridad", label: "PRIORIDAD (TIPO DE ENTREGA)", icon: ExclamationTriangleIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TabbedLayout
      tabs={TABS}
      basePath="/picking/configuraciones/configuraciones-picking"
      contentClassName="pt-[150px] pb-10 px-6"
    >
      {children}
    </TabbedLayout>
  );
}
